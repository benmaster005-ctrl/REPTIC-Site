-- =============================================================================
-- REPTIC.CM — Schéma principal
-- Cahier des charges §7.1. Les identités sont gérées par Supabase Auth
-- (auth.users) ; la table public.profiles joue le rôle de « users ».
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------------
create type public.account_status as enum ('pending', 'active', 'suspended', 'archived');
create type public.applicant_type as enum ('physical', 'legal');            -- personne physique / morale
create type public.application_status as enum (
  'draft',                 -- Brouillon
  'submitted',             -- Soumise / en attente
  'under_review',          -- En cours d'examen
  'additional_info',       -- Complément requis
  'accepted',              -- Acceptée
  'rejected'               -- Refusée
);
create type public.membership_status as enum ('active', 'expired', 'suspended', 'cancelled');
create type public.content_status as enum ('draft', 'scheduled', 'published', 'archived');
create type public.content_visibility as enum ('public', 'members');
create type public.category_kind as enum ('actor', 'member_type', 'news', 'event', 'document');
create type public.registration_status as enum ('registered', 'waitlisted', 'cancelled', 'attended');

-- ---------------------------------------------------------------------------
-- Utilitaire : updated_at automatique
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Rôles et permissions (moindre privilège, §6.3)
-- ---------------------------------------------------------------------------
create table public.roles (
  key         text primary key,                 -- candidate, member, manager, editor, admin
  label       text not null,
  description text,
  rank        int  not null default 0           -- pour l'affichage / la hiérarchie
);

create table public.permissions (
  key         text primary key,                 -- ex. applications.review
  description text not null
);

create table public.role_permissions (
  role_key       text references public.roles(key) on delete cascade,
  permission_key text references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

-- ---------------------------------------------------------------------------
-- Profils (« users ») — 1-1 avec auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         citext not null unique,
  first_name    text,
  last_name     text,
  phone         text,
  avatar_path   text,
  role_key      text not null default 'candidate' references public.roles(key),
  status        public.account_status not null default 'pending',
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Fonctions d'autorisation (SECURITY DEFINER pour éviter la récursion RLS)
create or replace function public.current_role_key()
returns text language sql stable security definer set search_path = public as $$
  select role_key from public.profiles where id = auth.uid() and status = 'active'
$$;

create or replace function public.has_permission(perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_key = p.role_key
    where p.id = auth.uid() and p.status = 'active' and rp.permission_key = perm
  )
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and p.role_key in ('member', 'manager', 'editor', 'admin')
  )
$$;

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Empêche un utilisateur de modifier lui-même son rôle ou son statut
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role_key is distinct from old.role_key or new.status is distinct from old.status
      or new.email is distinct from old.email)
     and auth.uid() is not null
     and not public.has_permission('users.manage') then
    raise exception 'Modification du rôle, du statut ou de l''e-mail non autorisée';
  end if;
  return new;
end $$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- Catégories (familles d'acteurs, types de membres, rubriques)
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  kind        public.category_kind not null,
  slug        text not null,
  name        text not null,
  description text,
  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (kind, slug)
);

-- ---------------------------------------------------------------------------
-- Organisations (personnes morales)
-- ---------------------------------------------------------------------------
create table public.organizations (
  id                   uuid primary key default gen_random_uuid(),
  legal_name           text not null,
  legal_form           text,
  sector_category_id   uuid references public.categories(id),
  registration_number  text,        -- RCCM
  tax_id               text,        -- NIU
  address              text,
  city                 text,
  country              text default 'Cameroun',
  phone                text,
  email                citext,
  website              text,
  logo_path            text,
  rep_first_name       text,        -- représentant légal
  rep_last_name        text,
  rep_title            text,
  rep_email            citext,
  rep_phone            text,
  description          text,
  is_listed            boolean not null default false,   -- visible dans l'annuaire public
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger organizations_touch before update on public.organizations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Membres (fiche membre, personne physique ou rattachée à une organisation)
-- ---------------------------------------------------------------------------
create table public.members (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references public.profiles(id) on delete set null,
  member_type         public.applicant_type not null,
  organization_id     uuid references public.organizations(id) on delete set null,
  member_number       text unique,
  first_name          text,
  last_name           text,
  birth_date          date,
  profession          text,
  activity_category_id uuid references public.categories(id),
  experience_years    int,
  city                text,
  country             text default 'Cameroun',
  phone               text,
  bio                 text,
  photo_path          text,
  directory_visibility public.content_visibility,  -- null = absent de l'annuaire
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint member_legal_has_org check (member_type = 'physical' or organization_id is not null)
);
create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Demandes d'adhésion (§4)
-- Les champs du formulaire sont dans payload (jsonb, validé côté serveur par zod)
-- tant que la liste définitive n'est pas validée par le commanditaire (§10).
-- ---------------------------------------------------------------------------
create table public.applications (
  id               uuid primary key default gen_random_uuid(),
  reference        text unique not null default ('ADH-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  applicant_type   public.applicant_type not null,
  category_id      uuid references public.categories(id),     -- type de membre demandé
  status           public.application_status not null default 'draft',
  payload          jsonb not null default '{}'::jsonb,
  terms_accepted_at timestamptz,
  submitted_at     timestamptz,
  assigned_to      uuid references public.profiles(id),
  decided_by       uuid references public.profiles(id),
  decided_at       timestamptz,
  decision_reason  text,
  member_id        uuid references public.members(id),        -- renseigné à l'acceptation
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index applications_status_idx on public.applications(status);
create index applications_user_idx on public.applications(user_id);
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

-- Historique des statuts (auteur + date de chaque décision, §4.4)
create table public.application_status_history (
  id             bigint generated always as identity primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status    public.application_status,
  to_status      public.application_status not null,
  changed_by     uuid references public.profiles(id),
  comment        text,
  created_at     timestamptz not null default now()
);
create index application_history_app_idx on public.application_status_history(application_id);

create or replace function public.log_application_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_status_history (application_id, from_status, to_status, changed_by, comment)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, auth.uid(),
            case when new.status in ('rejected', 'additional_info') then new.decision_reason end);
  end if;
  return new;
end $$;

create trigger applications_log_status after insert or update of status on public.applications
  for each row execute function public.log_application_status();

-- Le candidat ne peut faire passer son dossier que de brouillon/complément à soumis
create or replace function public.guard_application_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then  -- service_role / tâches serveur
    return new;
  end if;
  if public.has_permission('applications.review') then
    return new;
  end if;
  if new.status is distinct from old.status and not (
       old.status in ('draft', 'additional_info') and new.status = 'submitted'
     ) then
    raise exception 'Transition de statut non autorisée (% -> %)', old.status, new.status;
  end if;
  if old.status not in ('draft', 'additional_info') then
    raise exception 'Le dossier n''est plus modifiable';
  end if;
  if new.decided_by is distinct from old.decided_by or new.decision_reason is distinct from old.decision_reason
     or new.assigned_to is distinct from old.assigned_to or new.member_id is distinct from old.member_id then
    raise exception 'Champs réservés à l''administration';
  end if;
  if new.status = 'submitted' then
    new.submitted_at := now();
  end if;
  return new;
end $$;

create trigger applications_guard before update on public.applications
  for each row execute function public.guard_application_transition();

-- ---------------------------------------------------------------------------
-- Adhésions validées
-- ---------------------------------------------------------------------------
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  category_id uuid references public.categories(id),
  status      public.membership_status not null default 'active',
  starts_on   date not null default current_date,
  ends_on     date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index memberships_member_idx on public.memberships(member_id);
create trigger memberships_touch before update on public.memberships
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Documents (métadonnées des fichiers du stockage objet)
-- ---------------------------------------------------------------------------
create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  bucket         text not null default 'private-documents',
  storage_path   text not null unique,
  file_name      text not null,
  mime_type      text not null,
  size_bytes     bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  owner_id       uuid references public.profiles(id) on delete set null,
  application_id uuid references public.applications(id) on delete cascade,
  member_id      uuid references public.members(id) on delete cascade,
  category_id    uuid references public.categories(id),
  document_type  text,              -- ex. cni, rccm, niu, statuts, cv
  title          text,
  visibility     public.content_visibility,   -- null = privé (propriétaire + gestionnaires)
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pages institutionnelles et menus (§6.2)
-- ---------------------------------------------------------------------------
create table public.pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,      -- presentation, objectifs-missions, mot-du-president…
  title        text not null,
  summary      text,
  body         text,                      -- Markdown
  cover_path   text,
  seo_title    text,
  seo_description text,
  status       public.content_status not null default 'draft',
  updated_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

create table public.menu_items (
  id         uuid primary key default gen_random_uuid(),
  menu       text not null default 'main',    -- main, footer
  parent_id  uuid references public.menu_items(id) on delete cascade,
  label      text not null,
  href       text not null,
  position   int not null default 0,
  is_visible boolean not null default true
);

-- Bureau exécutif / gouvernance
create table public.governance_members (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  position_title text not null,
  organization text,
  photo_path  text,
  bio         text,
  mandate_start date,
  mandate_end   date,
  sort_order  int not null default 0,
  is_published boolean not null default true
);

-- Chiffres clés validés (accueil)
create table public.key_figures (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  value      text not null,
  sort_order int not null default 0,
  is_published boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Actualités
-- ---------------------------------------------------------------------------
create table public.news (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  body         text,                   -- Markdown
  cover_path   text,
  category_id  uuid references public.categories(id),
  status       public.content_status not null default 'draft',
  visibility   public.content_visibility not null default 'public',
  published_at timestamptz,
  author_id    uuid references public.profiles(id),
  seo_title    text,
  seo_description text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index news_published_idx on public.news(status, published_at desc);
create trigger news_touch before update on public.news
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Événements et inscriptions
-- ---------------------------------------------------------------------------
create table public.events (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text,
  body          text,
  cover_path    text,
  category_id   uuid references public.categories(id),
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  location_name text,
  address       text,
  city          text,
  online_url    text,
  status        public.content_status not null default 'draft',
  visibility    public.content_visibility not null default 'public',
  registration_enabled boolean not null default false,
  capacity      int,
  registration_deadline timestamptz,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint events_dates check (ends_at is null or ends_at >= starts_at)
);
create index events_starts_idx on public.events(status, starts_at);
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

create table public.event_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  full_name   text not null,
  email       citext not null,
  phone       text,
  organization text,
  status      public.registration_status not null default 'registered',
  created_at  timestamptz not null default now(),
  unique (event_id, email)
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,       -- application.status, news.members, account…
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, read_at);

-- Modèles d'e-mails configurables (§4.4)
create table public.email_templates (
  key        text primary key,    -- application.submitted, application.accepted…
  subject    text not null,
  body       text not null,       -- avec variables {{prenom}}, {{reference}}…
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contact et newsletter
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null check (char_length(full_name) between 2 and 120),
  email      citext not null,
  phone      text,
  subject    text not null check (char_length(subject) between 2 and 200),
  message    text not null check (char_length(message) between 10 and 5000),
  handled_at timestamptz,
  handled_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null unique,
  consent_text text not null,
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Journal des opérations sensibles (§6, §6.3)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,            -- ex. application.accept, member.suspend, export.members
  entity_type text not null,
  entity_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.log_audit(p_action text, p_entity_type text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb))
$$;

-- Journalisation automatique des changements de rôle / statut de compte
create or replace function public.audit_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role_key is distinct from old.role_key or new.status is distinct from old.status then
    perform public.log_audit('profile.update', 'profile', new.id::text, jsonb_build_object(
      'role', jsonb_build_object('from', old.role_key, 'to', new.role_key),
      'status', jsonb_build_object('from', old.status, 'to', new.status)));
  end if;
  return new;
end $$;

create trigger profiles_audit after update on public.profiles
  for each row execute function public.audit_profile_changes();

-- Paramètres du site (coordonnées, réseaux sociaux…)
create table public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
