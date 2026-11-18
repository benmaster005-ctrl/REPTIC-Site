-- =============================================================================
-- REPTIC.CM — Durcissement de la sécurité avant la mise en production
-- (audit du 18 novembre 2026). Ré-exécutable.
--
-- 1. Annuaire : les tables members / organizations ne sont plus lisibles
--    directement ; seule la vue member_directory (colonnes choisies) l'est.
-- 2. Justificatifs : plus de dépôt ni de suppression une fois le dossier envoyé.
-- 3. Contact et lettre d'information : plus d'écriture directe avec la clé
--    publique ; passage obligé par des fonctions protégées par un secret serveur.
-- 4. Paiements : l'identifiant de transaction ne peut être rattaché qu'une fois.
-- 5. Invitations : la limite quotidienne s'applique avant tout autre contrôle.
-- 6. Demandes d'adhésion : envoi uniquement par submit_application, colonnes
--    réservées protégées à la création comme à la modification.
-- 7. Fonctions : exécution retirée au rôle PUBLIC (donc aux visiteurs anonymes).
-- 8. Inscriptions aux événements, pièces jointes, comptes OAuth sans e-mail,
--    SVG refusés dans les médias publics.
--
-- APRÈS EXÉCUTION : recopier le secret des formulaires dans la variable
-- d'environnement PUBLIC_FORMS_SECRET (Vercel et .env.local) :
--   select value from private.app_secrets where key = 'public_forms';
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Annuaire
-- ---------------------------------------------------------------------------
drop policy if exists "members: annuaire public" on public.members;
drop policy if exists "members: annuaire membres" on public.members;
drop policy if exists "organizations: annuaire public" on public.organizations;
drop policy if exists "organizations: annuaire membres" on public.organizations;

-- La vue s'exécute avec les droits de son propriétaire et filtre elle-même :
-- fiches « public » pour tous, fiches « members » pour les membres actifs,
-- comptes suspendus exclus. Elle n'expose que les colonnes de l'annuaire.
create or replace view public.member_directory with (security_invoker = false) as
  select m.id,
         m.member_type,
         coalesce(o.legal_name, trim(coalesce(m.first_name, '') || ' ' || coalesce(m.last_name, ''))) as display_name,
         m.profession,
         coalesce(m.city, o.city) as city,
         c.name as category,
         c.slug as category_slug,
         o.website,
         m.bio,
         m.photo_path,
         o.logo_path,
         m.directory_visibility,
         m.phone,
         o.email as organization_email,
         o.phone as organization_phone,
         o.address as organization_address,
         o.legal_form,
         o.description as organization_description,
         case when o.id is not null then trim(coalesce(m.first_name, '') || ' ' || coalesce(m.last_name, '')) end as contact_name,
         m.member_number,
         m.created_at
    from public.members m
    join public.profiles p on p.id = m.user_id and p.status = 'active'
    left join public.organizations o on o.id = m.organization_id
    left join public.categories c on c.id = m.activity_category_id
   where m.directory_visibility = 'public'
      or (m.directory_visibility = 'members' and public.is_active_member());

revoke all on public.member_directory from public, anon, authenticated;
grant select on public.member_directory to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Justificatifs : dépôt et suppression seulement tant que le dossier est
--    modifiable (brouillon ou complément demandé).
--    Arborescence : <user_id>/<application_id>/<fichier>
-- ---------------------------------------------------------------------------
drop policy if exists "docs: dépôt dans son dossier" on storage.objects;
drop policy if exists "docs: suppression de son dossier" on storage.objects;

create policy "docs: dépôt dans son dossier" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'private-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.applications a
       where a.id::text = (storage.foldername(name))[2]
         and a.user_id = auth.uid()
         and a.status in ('draft', 'additional_info')
    )
  );
create policy "docs: suppression de son dossier" on storage.objects for delete to authenticated
  using (
    bucket_id = 'private-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.applications a
       where a.id::text = (storage.foldername(name))[2]
         and a.user_id = auth.uid()
         and a.status in ('draft', 'additional_info')
    )
  );

-- La fiche « document » d'un candidat doit pointer vers son propre dossier.
drop policy if exists "documents: dépôt candidat" on public.documents;
create policy "documents: dépôt candidat" on public.documents for insert to authenticated
  with check (
    owner_id = auth.uid() and visibility is null and member_id is null
    and bucket = 'private-documents'
    and split_part(storage_path, '/', 1) = auth.uid()::text
    and (
      application_id is null or exists (
        select 1 from public.applications a
        where a.id = application_id and a.user_id = auth.uid() and a.status in ('draft', 'additional_info')
      )
    )
  );

-- Médias publics : plus de SVG (un SVG peut contenir du script).
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'public-media';

-- ---------------------------------------------------------------------------
-- 3. Contact et lettre d'information
-- ---------------------------------------------------------------------------
drop policy if exists "contact: envoi public" on public.contact_messages;
drop policy if exists "newsletter: inscription publique" on public.newsletter_subscribers;

insert into private.app_secrets (key, value)
values ('public_forms', encode(gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;

-- Inscription à la lettre : appelée uniquement par le serveur du site (secret),
-- après validation et vérification reCAPTCHA.
drop function if exists public.newsletter_subscribe(text, text);
create or replace function public.newsletter_subscribe(p_secret text, p_email text, p_consent text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or p_secret <> (select value from private.app_secrets where key = 'public_forms') then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 254 then
    raise exception 'Adresse e-mail invalide' using errcode = 'P0001';
  end if;
  insert into public.newsletter_subscribers (email, consent_text)
  values (lower(trim(p_email)), left(p_consent, 500))
  on conflict (email) do update
    set unsubscribed_at = null,
        consent_text = excluded.consent_text,
        consented_at = case when public.newsletter_subscribers.unsubscribed_at is not null then now() else public.newsletter_subscribers.consented_at end;
end $$;

-- Message de contact : même principe, plus 5 messages par heure et par adresse.
create or replace function public.submit_contact_message(
  p_secret text, p_full_name text, p_email text, p_phone text, p_subject text, p_message text
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or p_secret <> (select value from private.app_secrets where key = 'public_forms') then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 254 then
    raise exception 'Adresse e-mail invalide' using errcode = 'P0001';
  end if;
  if (select count(*) from public.contact_messages
       where email = lower(trim(p_email)) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Trop de messages envoyés. Réessayez dans une heure.' using errcode = 'P0001';
  end if;
  insert into public.contact_messages (full_name, email, phone, subject, message)
  values (trim(p_full_name), lower(trim(p_email)), nullif(left(trim(coalesce(p_phone, '')), 30), ''), trim(p_subject), trim(p_message));
end $$;

revoke execute on function public.newsletter_subscribe(text, text, text) from public;
revoke execute on function public.submit_contact_message(text, text, text, text, text, text) from public;
grant execute on function public.newsletter_subscribe(text, text, text) to anon, authenticated;
grant execute on function public.submit_contact_message(text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Paiements : identifiant de transaction rattaché une seule fois
-- ---------------------------------------------------------------------------
create or replace function public.attach_payment_transaction(p_reference text, p_transaction_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.payments set provider_transaction_id = left(p_transaction_id, 120)
   where reference = p_reference and user_id = auth.uid() and status = 'pending'
     and provider_transaction_id is null;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Invitations : limite quotidienne d'abord, et plus d'indication sur
--    l'existence d'un compte (qui permettait de tester des adresses).
-- ---------------------------------------------------------------------------
create or replace function public.create_invitation(p_email text, p_message text default null)
returns table (token uuid, inviter_name text) language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
  v_token uuid;
  v_name text;
begin
  if not public.is_active_member() then
    raise exception 'Seuls les membres actifs peuvent inviter' using errcode = '42501';
  end if;
  if (select count(*) from public.invitations where inviter_id = auth.uid() and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Limite atteinte : 10 invitations par jour' using errcode = 'P0001';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception 'Adresse e-mail invalide' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.invitations where email = v_email and created_at > now() - interval '7 days') then
    raise exception 'Cette adresse a déjà été invitée récemment' using errcode = 'P0001';
  end if;

  insert into public.invitations (inviter_id, email, message)
  values (auth.uid(), v_email, nullif(left(trim(coalesce(p_message, '')), 1000), ''))
  returning invitations.token into v_token;

  select coalesce(o.legal_name, nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.email)
    into v_name
    from public.profiles p
    left join public.members m on m.user_id = p.id
    left join public.organizations o on o.id = m.organization_id
   where p.id = auth.uid();

  return query select v_token, v_name;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Demandes d'adhésion
-- ---------------------------------------------------------------------------
-- submit_application : dossier introuvable aussi pour un appel anonyme
-- (auth.uid() nul), et signal autorisant la transition vers « soumise ».
create or replace function public.submit_application(p_application_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
  missing text;
begin
  select * into app from public.applications where id = p_application_id for update;
  if app.id is null or auth.uid() is null or app.user_id is distinct from auth.uid() then
    raise exception 'Dossier introuvable' using errcode = 'P0002';
  end if;
  if app.status not in ('draft', 'additional_info') then
    raise exception 'Ce dossier a déjà été envoyé' using errcode = 'P0001';
  end if;
  if app.payload = '{}'::jsonb then
    raise exception 'Les informations du dossier sont incomplètes' using errcode = 'P0001';
  end if;

  select string_agg(r.label, ', ' order by r.position) into missing
  from public.required_documents r
  where r.applicant_type = app.applicant_type and r.is_required
    and not exists (
      select 1 from public.documents d
      where d.application_id = app.id and d.document_type = r.key
    );
  if missing is not null then
    raise exception 'Pièces manquantes : %', missing using errcode = 'P0001';
  end if;

  perform set_config('reptic.submitting', 'on', true);
  update public.applications
     set status = 'submitted', terms_accepted_at = now(), submitted_at = now()
   where id = app.id;
  perform set_config('reptic.submitting', 'off', true);

  insert into public.notifications (user_id, type, title, body, link)
  values (app.user_id, 'application.submitted', 'Demande d''adhésion envoyée',
          'Votre dossier ' || app.reference || ' a bien été reçu. Nous vous tiendrons informé de son avancement.',
          '/espace/adhesion');

  return app.reference;
end $$;

-- Garde-fou : le candidat ne change plus le statut lui-même (seul
-- submit_application le fait) et ne touche pas aux colonnes réservées.
create or replace function public.guard_application_transition()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  submitting boolean := coalesce(current_setting('reptic.submitting', true), '') = 'on';
begin
  if auth.uid() is null then  -- tâches serveur
    return new;
  end if;
  if public.has_permission('applications.review') then
    return new;
  end if;
  if new.status is distinct from old.status and not (
       submitting and old.status in ('draft', 'additional_info') and new.status = 'submitted'
     ) then
    raise exception 'Transition de statut non autorisée (% -> %)', old.status, new.status;
  end if;
  if old.status not in ('draft', 'additional_info') then
    raise exception 'Le dossier n''est plus modifiable';
  end if;
  if new.decided_by is distinct from old.decided_by or new.decision_reason is distinct from old.decision_reason
     or new.decided_at is distinct from old.decided_at
     or new.assigned_to is distinct from old.assigned_to or new.member_id is distinct from old.member_id
     or new.reference is distinct from old.reference or new.user_id is distinct from old.user_id
     or (not submitting and (new.submitted_at is distinct from old.submitted_at
                             or new.terms_accepted_at is distinct from old.terms_accepted_at)) then
    raise exception 'Champs réservés à l''administration';
  end if;
  return new;
end $$;

-- À la création par un candidat, les colonnes réservées sont remises à zéro.
create or replace function public.guard_application_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_permission('applications.review') then
    return new;
  end if;
  new.status := 'draft';
  new.assigned_to := null;
  new.decided_by := null;
  new.decided_at := null;
  new.decision_reason := null;
  new.member_id := null;
  new.submitted_at := null;
  new.terms_accepted_at := null;
  return new;
end $$;

drop trigger if exists applications_guard_insert on public.applications;
create trigger applications_guard_insert before insert on public.applications
  for each row execute function public.guard_application_insert();

-- ---------------------------------------------------------------------------
-- 7. Fonctions appelables : retirées au rôle PUBLIC (dont héritent les
--    visiteurs anonymes), accordées aux seuls comptes connectés. Chacune
--    vérifie en plus les droits de l'appelant.
-- ---------------------------------------------------------------------------
revoke execute on function
  public.submit_application(uuid),
  public.decide_application(uuid, text, text),
  public.accept_application(uuid, uuid, date, date, public.content_visibility),
  public.set_member_status(uuid, text, text),
  public.set_user_role(uuid, text),
  public.set_user_active(uuid, boolean),
  public.admin_stats(),
  public.log_member_export(int, jsonb),
  public.send_broadcast(text, text, text, uuid, boolean),
  public.create_invitation(text, text),
  public.start_newsletter_campaign(uuid),
  public.refresh_newsletter_campaign(uuid),
  public.publication_email_recipients(),
  public.create_fee_payment(int, text),
  public.attach_payment_transaction(text, text)
from public, anon;

grant execute on function
  public.submit_application(uuid),
  public.decide_application(uuid, text, text),
  public.accept_application(uuid, uuid, date, date, public.content_visibility),
  public.set_member_status(uuid, text, text),
  public.set_user_role(uuid, text),
  public.set_user_active(uuid, boolean),
  public.admin_stats(),
  public.log_member_export(int, jsonb),
  public.send_broadcast(text, text, text, uuid, boolean),
  public.create_invitation(text, text),
  public.start_newsletter_campaign(uuid),
  public.refresh_newsletter_campaign(uuid),
  public.publication_email_recipients(),
  public.create_fee_payment(int, text),
  public.attach_payment_transaction(text, text)
to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Inscriptions aux événements : ni changement d'événement, ni statut
--    « présent » posé par l'inscrit lui-même.
-- ---------------------------------------------------------------------------
drop policy if exists "inscriptions: créer" on public.event_registrations;
create policy "inscriptions: créer" on public.event_registrations for insert to authenticated
  with check (user_id = auth.uid() and status in ('registered', 'waitlisted') and exists (
    select 1 from public.events e where e.id = event_id and e.registration_enabled and e.status = 'published'
      and (e.registration_deadline is null or e.registration_deadline > now())
  ));

create or replace function public.guard_registration_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_permission('events.manage') then
    return new;
  end if;
  if new.event_id is distinct from old.event_id or new.user_id is distinct from old.user_id
     or new.email is distinct from old.email then
    raise exception 'Modification non autorisée de l''inscription';
  end if;
  return new;
end $$;

drop trigger if exists event_registrations_guard on public.event_registrations;
create trigger event_registrations_guard before update on public.event_registrations
  for each row execute function public.guard_registration_update();

-- ---------------------------------------------------------------------------
-- 9. Comptes créés par Google / LinkedIn : e-mail absent toléré, noms bornés.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := nullif(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), '');
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@sans-email.invalid'),
    left(coalesce(
      nullif(meta ->> 'first_name', ''),
      nullif(meta ->> 'given_name', ''),
      split_part(full_name, ' ', 1)
    ), 80),
    left(coalesce(
      nullif(meta ->> 'last_name', ''),
      nullif(meta ->> 'family_name', ''),
      nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')
    ), 80)
  );
  return new;
end $$;
