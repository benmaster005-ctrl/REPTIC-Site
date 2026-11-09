-- =============================================================================
-- REPTIC.CM — Story 19 : paiement des cotisations en ligne
--   * tarifs par type de membre (fixés par le secrétariat, en FCFA)
--   * paiements (une cotisation par membre et par année civile)
--   * confirmation protégée par un secret serveur : un paiement n'est marqué
--     « payé » qu'après vérification du statut auprès du prestataire
-- À exécuter dans le SQL Editor après les migrations 1 à 8.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Secret de confirmation (schéma « private », non exposé par l'API)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_secrets (
  key   text primary key,
  value text not null
);
insert into private.app_secrets (key, value)
values ('payments_confirm', encode(gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;
-- Pour lire le secret à recopier dans PAYMENT_CONFIRM_SECRET :
--   select value from private.app_secrets where key = 'payments_confirm';

-- ---------------------------------------------------------------------------
-- Tarifs
-- ---------------------------------------------------------------------------
create table public.membership_fees (
  member_type public.applicant_type primary key,
  label       text not null,
  amount      int check (amount is null or amount > 0),   -- null : paiement fermé tant que non fixé
  currency    text not null default 'XAF',
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now()
);
insert into public.membership_fees (member_type, label) values
  ('physical', 'Cotisation annuelle · personne physique'),
  ('legal', 'Cotisation annuelle · personne morale')
on conflict do nothing;

alter table public.membership_fees enable row level security;
create policy "tarifs: lecture" on public.membership_fees for select to anon, authenticated using (true);
create policy "tarifs: gestion" on public.membership_fees for update to authenticated
  using (public.has_permission('members.manage')) with check (public.has_permission('members.manage'));

-- ---------------------------------------------------------------------------
-- Paiements
-- ---------------------------------------------------------------------------
create table public.payments (
  id                      uuid primary key default gen_random_uuid(),
  reference               text not null unique,
  member_id               uuid not null references public.members(id) on delete cascade,
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  year                    int not null check (year between 2020 and 2100),
  amount                  int not null check (amount > 0),
  currency                text not null default 'XAF',
  provider                text not null,
  provider_transaction_id text,
  status                  text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  payment_method          text,
  provider_payload        jsonb,
  membership_id           uuid references public.memberships(id),
  created_at              timestamptz not null default now(),
  paid_at                 timestamptz
);
create index payments_member_idx on public.payments(member_id, year);
create unique index payments_one_paid_per_year on public.payments(member_id, year) where status = 'paid';

alter table public.payments enable row level security;
create policy "paiements: les miens" on public.payments for select to authenticated using (user_id = auth.uid());
create policy "paiements: gestionnaires" on public.payments for select to authenticated using (public.has_permission('members.read'));

-- ---------------------------------------------------------------------------
-- Création d'un paiement par le membre connecté
-- ---------------------------------------------------------------------------
create or replace function public.create_fee_payment(p_year int, p_provider text)
returns table (payment_id uuid, reference text, amount int, currency text, label text, email text, first_name text, last_name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  m public.members;
  prof public.profiles;
  fee public.membership_fees;
  v_ref text;
  v_id uuid;
  this_year int := extract(year from now())::int;
begin
  select * into prof from public.profiles where id = auth.uid();
  if prof.id is null or prof.status <> 'active' then
    raise exception 'Seuls les membres actifs peuvent régler une cotisation en ligne' using errcode = '42501';
  end if;
  select * into m from public.members where user_id = auth.uid();
  if m.id is null then
    raise exception 'Aucune fiche membre n''est rattachée à votre compte' using errcode = 'P0001';
  end if;
  if p_year < this_year or p_year > this_year + 1 then
    raise exception 'Année de cotisation invalide' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.payments where member_id = m.id and year = p_year and status = 'paid') then
    raise exception 'La cotisation % est déjà réglée', p_year using errcode = 'P0001';
  end if;
  select * into fee from public.membership_fees where member_type = m.member_type;
  if fee.amount is null then
    raise exception 'Le montant de la cotisation n''est pas encore fixé : contactez le secrétariat' using errcode = 'P0001';
  end if;

  -- Une seule tentative en cours à la fois
  update public.payments set status = 'cancelled' where member_id = m.id and year = p_year and status = 'pending';

  v_ref := 'COT-' || p_year || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));
  insert into public.payments (reference, member_id, user_id, year, amount, currency, provider)
  values (v_ref, m.id, auth.uid(), p_year, fee.amount, fee.currency, p_provider)
  returning id into v_id;

  return query select v_id, v_ref, fee.amount, fee.currency, fee.label || ' ' || p_year,
                      prof.email::text, coalesce(m.first_name, prof.first_name), coalesce(m.last_name, prof.last_name);
end $$;

revoke execute on function public.create_fee_payment(int, text) from anon;

-- Le site enregistre l'identifiant de transaction du prestataire
create or replace function public.attach_payment_transaction(p_reference text, p_transaction_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.payments set provider_transaction_id = left(p_transaction_id, 120)
   where reference = p_reference and user_id = auth.uid() and status = 'pending';
end $$;

revoke execute on function public.attach_payment_transaction(text, text) from anon;

-- ---------------------------------------------------------------------------
-- Confirmation : appelée par le site après vérification auprès du prestataire
-- (notification serveur ou retour du membre). Le secret empêche tout appel direct.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_fee_payment(
  p_secret text, p_reference text, p_status text, p_transaction_id text default null,
  p_method text default null, p_payload jsonb default null
)
returns text language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
  v_membership uuid;
  y_start date;
  y_end date;
begin
  if p_secret is null or p_secret <> (select value from private.app_secrets where key = 'payments_confirm') then
    raise exception 'Confirmation refusée' using errcode = '42501';
  end if;
  if p_status not in ('paid', 'failed', 'pending') then
    raise exception 'Statut inconnu' using errcode = 'P0001';
  end if;

  select * into pay from public.payments where reference = p_reference for update;
  if pay.id is null then
    raise exception 'Paiement introuvable' using errcode = 'P0002';
  end if;
  if pay.status = 'paid' or p_status = 'pending' then
    return pay.status; -- déjà traité, ou rien de nouveau
  end if;

  if p_status = 'failed' then
    update public.payments set status = 'failed', provider_transaction_id = coalesce(p_transaction_id, provider_transaction_id),
           provider_payload = coalesce(p_payload, provider_payload)
     where id = pay.id and status in ('pending', 'cancelled');
    return 'failed';
  end if;

  -- Payé : rattacher à l'adhésion de l'année (ou la créer)
  y_start := make_date(pay.year, 1, 1);
  y_end := make_date(pay.year, 12, 31);
  select id into v_membership from public.memberships
   where member_id = pay.member_id and status in ('active', 'expired') and starts_on <= y_end and coalesce(ends_on, y_end) >= y_end
   order by starts_on desc limit 1;
  if v_membership is null then
    insert into public.memberships (member_id, category_id, status, starts_on, ends_on, notes)
    values (pay.member_id,
            (select category_id from public.memberships where member_id = pay.member_id order by starts_on desc limit 1),
            'active', greatest(y_start, current_date), y_end, 'Cotisation ' || pay.year || ' réglée en ligne (' || pay.reference || ')')
    returning id into v_membership;
  end if;

  update public.payments
     set status = 'paid', paid_at = now(), membership_id = v_membership,
         provider_transaction_id = coalesce(p_transaction_id, provider_transaction_id),
         payment_method = coalesce(p_method, payment_method),
         provider_payload = coalesce(p_payload, provider_payload)
   where id = pay.id;

  insert into public.notifications (user_id, type, title, body, link)
  values (pay.user_id, 'payment.paid', 'Cotisation ' || pay.year || ' reçue',
          'Merci : votre paiement de ' || to_char(pay.amount, 'FM999G999G999') || ' ' || pay.currency || ' est confirmé.', '/espace/cotisation');

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (pay.user_id, 'payment.paid', 'payment', pay.id::text,
          jsonb_build_object('reference', pay.reference, 'year', pay.year, 'amount', pay.amount, 'provider', pay.provider));
  return 'paid';
end $$;

grant execute on function public.confirm_fee_payment(text, text, text, text, text, jsonb) to anon, authenticated;

-- Lecture minimale d'un paiement par sa référence (notification serveur, sans session)
create or replace function public.payment_for_confirmation(p_secret text, p_reference text)
returns table (reference text, provider text, provider_transaction_id text, status text, amount int, currency text, email text, first_name text, year int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if p_secret is null or p_secret <> (select value from private.app_secrets where key = 'payments_confirm') then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return query
    select p.reference, p.provider, p.provider_transaction_id, p.status, p.amount, p.currency, pr.email::text,
           coalesce(m.first_name, pr.first_name), p.year
      from public.payments p
      join public.profiles pr on pr.id = p.user_id
      left join public.members m on m.id = p.member_id
     where p.reference = p_reference;
end $$;

grant execute on function public.payment_for_confirmation(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- E-mail de confirmation (modifiable dans Administration > E-mails)
-- ---------------------------------------------------------------------------
insert into public.email_templates (key, name, description, variables, position, subject, body) values (
  'payment.received', 'Cotisation reçue', 'Envoyé au membre quand son paiement en ligne est confirmé.',
  array['prenom', 'annee', 'montant', 'reference', 'date'], 10,
  'Votre cotisation {{annee}} est bien reçue',
  E'Bonjour {{prenom}},\n\nNous vous confirmons la bonne réception de votre cotisation {{annee}}. Merci de votre engagement au sein du réseau.\n\nVotre reçu est disponible à tout moment dans votre espace membre, rubrique Cotisation.'
) on conflict (key) do nothing;
