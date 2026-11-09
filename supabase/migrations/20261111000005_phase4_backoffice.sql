-- =============================================================================
-- REPTIC.CM — Phase 4 : back-office
--   * décisions sur les demandes (prise en charge, complément, acceptation, refus)
--   * gestion du statut des membres, des rôles, indicateurs
--   * journalisation des opérations sensibles et des contenus
-- Toutes les fonctions vérifient la permission de l'appelant : la RLS reste
-- la protection de fond, ces fonctions garantissent l'atomicité et l'audit.
-- À exécuter dans le SQL Editor après les migrations 1 à 4.
-- =============================================================================

-- Paramètres d'adhésion (modifiables sans déploiement)
insert into public.site_settings (key, value) values
  ('membership', '{"number_prefix": "RPT", "period": "calendar_year"}')
on conflict (key) do nothing;

-- Les fonctions d'administration ci-dessous modifient le rôle ou le statut d'un compte
-- après avoir vérifié elles-mêmes la permission de l'appelant : elles activent un
-- drapeau local à la transaction que le garde-fou des profils respecte. Ce drapeau
-- n'est pas atteignable depuis l'API (set_config n'est pas exposé par PostgREST).
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('reptic.trusted', true) = 'on' then
    return new;
  end if;
  if (new.role_key is distinct from old.role_key or new.status is distinct from old.status
      or new.email is distinct from old.email)
     and auth.uid() is not null
     and not public.has_permission('users.manage') then
    raise exception 'Modification du rôle, du statut ou de l''e-mail non autorisée';
  end if;
  return new;
end $$;

-- Numérotation des membres : RPT-AAAA-NNNN, compteur continu
create sequence if not exists public.member_number_seq;
select setval('public.member_number_seq', greatest((select count(*) from public.members), 1), (select count(*) from public.members) > 0);

create or replace function public.next_member_number()
returns text language plpgsql security definer set search_path = public as $$
declare
  prefix text := coalesce((select value ->> 'number_prefix' from public.site_settings where key = 'membership'), 'RPT');
  n bigint;
  candidate text;
begin
  loop
    n := nextval('public.member_number_seq');
    candidate := prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
    exit when not exists (select 1 from public.members where member_number = candidate);
  end loop;
  return candidate;
end $$;

revoke execute on function public.next_member_number() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Décisions sur une demande
--   p_decision : 'take' | 'additional_info' | 'reject' | 'reopen'
-- ---------------------------------------------------------------------------
create or replace function public.decide_application(p_application_id uuid, p_decision text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
  target public.application_status;
begin
  if not public.has_permission('applications.review') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  select * into app from public.applications where id = p_application_id for update;
  if app.id is null then
    raise exception 'Dossier introuvable' using errcode = 'P0002';
  end if;

  if p_decision = 'take' then
    if app.status not in ('submitted', 'under_review') then
      raise exception 'Seul un dossier soumis peut être pris en charge' using errcode = 'P0001';
    end if;
    update public.applications set status = 'under_review', assigned_to = auth.uid() where id = app.id;
  elsif p_decision in ('additional_info', 'reject') then
    if app.status not in ('submitted', 'under_review') then
      raise exception 'Ce dossier n''est pas en cours d''instruction' using errcode = 'P0001';
    end if;
    if coalesce(trim(p_reason), '') = '' then
      raise exception 'Un message est obligatoire pour cette décision' using errcode = 'P0001';
    end if;
    target := case p_decision when 'reject' then 'rejected'::public.application_status else 'additional_info'::public.application_status end;
    update public.applications
       set status = target,
           decision_reason = trim(p_reason),
           decided_by = case when target = 'rejected' then auth.uid() else decided_by end,
           decided_at = case when target = 'rejected' then now() else decided_at end,
           assigned_to = coalesce(assigned_to, auth.uid())
     where id = app.id;
  else
    raise exception 'Décision inconnue : %', p_decision using errcode = 'P0001';
  end if;

  perform public.log_audit('application.' || p_decision, 'application', app.id::text,
    jsonb_build_object('reference', app.reference, 'from', app.status, 'reason', p_reason));
end $$;

-- ---------------------------------------------------------------------------
-- Acceptation : crée l'organisation, la fiche membre, l'adhésion, active le compte
-- ---------------------------------------------------------------------------
create or replace function public.accept_application(
  p_application_id uuid,
  p_category_id uuid default null,
  p_starts_on date default current_date,
  p_ends_on date default null,
  p_directory public.content_visibility default 'members'
)
returns text language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
  p jsonb;
  v_org uuid;
  v_member uuid;
  v_number text;
  v_ends date;
begin
  if not public.has_permission('applications.review') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  select * into app from public.applications where id = p_application_id for update;
  if app.id is null then
    raise exception 'Dossier introuvable' using errcode = 'P0002';
  end if;
  if app.status not in ('submitted', 'under_review') then
    raise exception 'Seul un dossier soumis ou en cours d''examen peut être accepté' using errcode = 'P0001';
  end if;
  p := app.payload;

  -- Durée par défaut : année civile en cours
  v_ends := coalesce(p_ends_on, make_date(extract(year from p_starts_on)::int, 12, 31));
  if v_ends < p_starts_on then
    raise exception 'La date de fin précède la date de début' using errcode = 'P0001';
  end if;

  if app.applicant_type = 'legal' then
    insert into public.organizations (legal_name, legal_form, registration_number, tax_id, address, city, country,
                                      phone, email, website, rep_first_name, rep_last_name, rep_title, rep_email, rep_phone,
                                      sector_category_id, description, is_listed)
    values (p->>'legal_name', p->>'legal_form', p->>'registration_number', p->>'tax_id', p->>'address', p->>'city',
            coalesce(p->>'country', 'Cameroun'), p->>'phone', p->>'email', p->>'website',
            p->>'rep_first_name', p->>'rep_last_name', p->>'rep_title', p->>'rep_email', p->>'rep_phone',
            (select id from public.categories where kind = 'actor' and slug = p->>'sector'),
            p->>'motivation', p_directory = 'public')
    returning id into v_org;
  end if;

  select id, member_number into v_member, v_number from public.members where user_id = app.user_id;
  if v_member is null then
    v_number := public.next_member_number();
    insert into public.members (user_id, member_type, organization_id, member_number, first_name, last_name, birth_date,
                                profession, activity_category_id, experience_years, city, country, phone, directory_visibility)
    values (app.user_id, app.applicant_type, v_org, v_number,
            coalesce(p->>'first_name', p->>'rep_first_name'), coalesce(p->>'last_name', p->>'rep_last_name'),
            nullif(p->>'birth_date', '')::date, coalesce(p->>'profession', p->>'rep_title'),
            (select id from public.categories where kind = 'actor' and slug = coalesce(p->>'activity_category', p->>'sector')),
            nullif(p->>'experience_years', '')::int, p->>'city', coalesce(p->>'country', 'Cameroun'), p->>'phone', p_directory)
    returning id into v_member;
  else
    -- Ré-adhésion : la fiche existante est conservée et rattachée
    update public.members set member_type = app.applicant_type, organization_id = coalesce(v_org, organization_id) where id = v_member;
    if v_number is null then
      v_number := public.next_member_number();
      update public.members set member_number = v_number where id = v_member;
    end if;
  end if;

  insert into public.memberships (member_id, category_id, status, starts_on, ends_on)
  values (v_member, coalesce(p_category_id, app.category_id), 'active', p_starts_on, v_ends);

  -- Les pièces du dossier sont rattachées à la fiche membre
  update public.documents set member_id = v_member where application_id = app.id;

  update public.applications
     set status = 'accepted', decided_by = auth.uid(), decided_at = now(), member_id = v_member, decision_reason = null,
         assigned_to = coalesce(assigned_to, auth.uid())
   where id = app.id;

  perform set_config('reptic.trusted', 'on', true);
  update public.profiles set role_key = case when role_key = 'candidate' then 'member' else role_key end, status = 'active'
   where id = app.user_id;

  perform public.log_audit('application.accept', 'application', app.id::text,
    jsonb_build_object('reference', app.reference, 'member_number', v_number, 'ends_on', v_ends));
  return v_number;
end $$;

-- ---------------------------------------------------------------------------
-- Statut d'un membre : active | suspended | archived
-- ---------------------------------------------------------------------------
create or replace function public.set_member_status(p_member_id uuid, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  m public.members;
begin
  if not public.has_permission('members.manage') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  if p_status not in ('active', 'suspended', 'archived') then
    raise exception 'Statut inconnu' using errcode = 'P0001';
  end if;
  select * into m from public.members where id = p_member_id for update;
  if m.id is null then
    raise exception 'Membre introuvable' using errcode = 'P0002';
  end if;
  if m.user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas modifier votre propre statut' using errcode = 'P0001';
  end if;

  if m.user_id is not null then
    perform set_config('reptic.trusted', 'on', true);
    update public.profiles set status = p_status::public.account_status where id = m.user_id;
  end if;

  update public.memberships
     set status = case p_status when 'active' then 'active' when 'suspended' then 'suspended' else 'cancelled' end::public.membership_status
   where member_id = m.id and status in ('active', 'suspended');

  if p_status = 'archived' then
    update public.members set directory_visibility = null where id = m.id;
  end if;

  if m.user_id is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (m.user_id, 'account.' || p_status,
            case p_status when 'active' then 'Votre compte a été réactivé'
                          when 'suspended' then 'Votre compte est suspendu'
                          else 'Votre compte a été archivé' end,
            p_reason, '/espace');
  end if;

  perform public.log_audit('member.' || p_status, 'member', m.id::text,
    jsonb_build_object('member_number', m.member_number, 'reason', p_reason));
end $$;

-- ---------------------------------------------------------------------------
-- Rôles : attribution par un administrateur (moindre privilège)
-- ---------------------------------------------------------------------------
create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare
  prof public.profiles;
begin
  if not public.has_permission('users.manage') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas modifier votre propre rôle' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.roles where key = p_role) then
    raise exception 'Rôle inconnu' using errcode = 'P0001';
  end if;
  select * into prof from public.profiles where id = p_user_id for update;
  if prof.id is null then
    raise exception 'Compte introuvable' using errcode = 'P0002';
  end if;
  -- Un compte d'équipe doit être actif pour que ses permissions s'appliquent
  update public.profiles
     set role_key = p_role,
         status = case when p_role in ('editor', 'manager', 'admin') then 'active'::public.account_status else status end
   where id = p_user_id;
  perform public.log_audit('user.role', 'profile', p_user_id::text,
    jsonb_build_object('email', prof.email, 'from', prof.role_key, 'to', p_role));
end $$;

create or replace function public.set_user_active(p_user_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_permission('users.manage') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas désactiver votre propre compte' using errcode = 'P0001';
  end if;
  update public.profiles set status = case when p_active then 'active' else 'suspended' end::public.account_status where id = p_user_id;
  perform public.log_audit(case when p_active then 'user.enable' else 'user.disable' end, 'profile', p_user_id::text, '{}'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Indicateurs du tableau de bord (§6.3)
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_permission('stats.read') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'applications_received', (select count(*) from public.applications where status <> 'draft'),
    'applications_pending', (select count(*) from public.applications where status in ('submitted', 'under_review')),
    'applications_waiting_candidate', (select count(*) from public.applications where status = 'additional_info'),
    'applications_last_30d', (select count(*) from public.applications where submitted_at >= now() - interval '30 days'),
    'members_active', (select count(*) from public.members m join public.profiles p on p.id = m.user_id where p.status = 'active'),
    'members_suspended', (select count(*) from public.members m join public.profiles p on p.id = m.user_id where p.status = 'suspended'),
    'contact_unread', (select count(*) from public.contact_messages where handled_at is null),
    'newsletter', (select count(*) from public.newsletter_subscribers where unsubscribed_at is null),
    'by_type', (select coalesce(jsonb_object_agg(member_type, n), '{}'::jsonb)
                  from (select member_type, count(*) n from public.members m join public.profiles p on p.id = m.user_id
                         where p.status = 'active' group by member_type) t),
    'by_category', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'count', n) order by n desc), '[]'::jsonb)
                      from (select coalesce(c.name, 'Non renseigné') name, count(*) n
                              from public.members m
                              join public.profiles p on p.id = m.user_id and p.status = 'active'
                              left join public.categories c on c.id = m.activity_category_id
                             group by 1) t)
  );
end $$;

revoke execute on function public.decide_application(uuid, text, text) from anon;
revoke execute on function public.accept_application(uuid, uuid, date, date, public.content_visibility) from anon;
revoke execute on function public.set_member_status(uuid, text, text) from anon;
revoke execute on function public.set_user_role(uuid, text) from anon;
revoke execute on function public.set_user_active(uuid, boolean) from anon;
revoke execute on function public.admin_stats() from anon;

-- ---------------------------------------------------------------------------
-- Journalisation des contenus et des exports
-- ---------------------------------------------------------------------------
create or replace function public.audit_content()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  perform public.log_audit(tg_table_name || '.' || lower(tg_op), tg_table_name, rec ->> 'id',
    jsonb_strip_nulls(jsonb_build_object('title', coalesce(rec ->> 'title', rec ->> 'full_name', rec ->> 'label', rec ->> 'file_name'),
                                         'status', rec ->> 'status')));
  return coalesce(new, old);
end $$;

create trigger news_audit after insert or update or delete on public.news for each row execute function public.audit_content();
create trigger events_audit after insert or update or delete on public.events for each row execute function public.audit_content();
create trigger pages_audit after insert or update or delete on public.pages for each row execute function public.audit_content();
create trigger governance_audit after insert or update or delete on public.governance_members for each row execute function public.audit_content();
create trigger documents_audit after insert or update or delete on public.documents for each row
  when (pg_trigger_depth() = 0) execute function public.audit_content();
create trigger memberships_audit after insert or update or delete on public.memberships for each row
  when (pg_trigger_depth() = 0) execute function public.audit_content();

-- Export de la liste des membres : journalisé, réservé aux personnes habilitées
create or replace function public.log_member_export(p_count int, p_filters jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_permission('members.export') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  perform public.log_audit('export.members', 'member', null, jsonb_build_object('count', p_count, 'filters', p_filters));
end $$;
revoke execute on function public.log_member_export(int, jsonb) from anon;
revoke execute on function public.log_audit(text, text, text, jsonb) from public, anon, authenticated;

-- Les gestionnaires voient qui a déposé un dossier (nom, e-mail) : déjà couvert par profiles « members.read ».
-- Les éditeurs voient les inscriptions aux événements : couvert par « events.manage ».
