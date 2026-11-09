-- =============================================================================
-- REPTIC.CM — User stories, bloc 1
--   Story 2  : alerte des membres à chaque publication (actualité, événement)
--   Story 3  : fiche profil d'un membre (annuaire enrichi)
--   Story 6  : désinscription de la newsletter (lien personnel)
--   Story 15 : ressources publiques téléchargeables par les visiteurs
-- À exécuter dans le SQL Editor après les migrations 1 à 6.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Story 6 : newsletter — inscription idempotente et désinscription par jeton
-- ---------------------------------------------------------------------------
alter table public.newsletter_subscribers
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists newsletter_unsubscribe_token_idx on public.newsletter_subscribers(unsubscribe_token);

-- Inscription : crée l'abonné ou réactive un abonné désinscrit, sans révéler
-- si l'adresse existait déjà.
create or replace function public.newsletter_subscribe(p_email text, p_consent text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 254 then
    raise exception 'Adresse e-mail invalide' using errcode = 'P0001';
  end if;
  insert into public.newsletter_subscribers (email, consent_text)
  values (lower(trim(p_email)), p_consent)
  on conflict (email) do update
    set unsubscribed_at = null,
        consent_text = excluded.consent_text,
        consented_at = case when public.newsletter_subscribers.unsubscribed_at is not null then now() else public.newsletter_subscribers.consented_at end;
end $$;

-- Désinscription : le jeton personnel figure dans chaque lettre envoyée.
create or replace function public.newsletter_unsubscribe(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  found boolean;
begin
  update public.newsletter_subscribers set unsubscribed_at = coalesce(unsubscribed_at, now())
   where unsubscribe_token = p_token
  returning true into found;
  return coalesce(found, false);
end $$;

grant execute on function public.newsletter_subscribe(text, text) to anon, authenticated;
grant execute on function public.newsletter_unsubscribe(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Story 15 : ressources publiques
-- Un document « public » devient téléchargeable par les visiteurs (lien signé
-- de courte durée), comme les documents « membres » le sont pour les membres.
-- ---------------------------------------------------------------------------
create policy "docs: ressources publiques" on storage.objects for select to anon
  using (
    bucket_id = 'private-documents' and exists (
      select 1 from public.documents d
      where d.bucket = 'private-documents' and d.storage_path = storage.objects.name and d.visibility = 'public'
    )
  );

alter table public.documents add column if not exists description text;

-- ---------------------------------------------------------------------------
-- Story 3 : fiche profil — l'annuaire expose aussi les coordonnées choisies
-- par le membre (téléphone affiché, e-mail et adresse de l'entreprise).
-- ---------------------------------------------------------------------------
create or replace view public.member_directory with (security_invoker = true) as
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
    left join public.organizations o on o.id = m.organization_id
    left join public.categories c on c.id = m.activity_category_id
   where m.directory_visibility is not null;

grant select on public.member_directory to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Story 2 : alerte des membres à chaque publication
-- Une notification par membre actif quand une actualité ou un événement passe
-- « publié ». notified_at garantit une seule alerte par contenu.
-- (Une actualité programmée alerte au moment où elle est publiée par l'équipe.)
-- ---------------------------------------------------------------------------
alter table public.news add column if not exists notified_at timestamptz;
alter table public.events add column if not exists notified_at timestamptz;

-- Les contenus déjà en ligne ne déclenchent pas d'alerte rétroactive
update public.news set notified_at = coalesce(published_at, now()) where status = 'published' and notified_at is null;
update public.events set notified_at = now() where status = 'published' and notified_at is null;

create or replace function public.notify_members_of_publication()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare
  is_news boolean := tg_table_name = 'news';
  rec jsonb := to_jsonb(new);  -- lecture générique : les deux tables n'ont pas les mêmes colonnes
  shown_at timestamptz := nullif(rec ->> 'published_at', '')::timestamptz;
begin
  if new.status <> 'published' or new.notified_at is not null then
    return new;
  end if;
  if is_news and shown_at is not null and shown_at > now() then
    return new; -- date d'affichage future : pas encore visible
  end if;
  new.notified_at := now();

  insert into public.notifications (user_id, type, title, body, link)
  select p.id,
         case when is_news then 'news.published' else 'event.published' end,
         case when is_news then 'Nouvelle actualité : ' else 'Nouvel événement : ' end || (rec ->> 'title'),
         rec ->> 'excerpt',
         case when is_news then
                case when rec ->> 'visibility' = 'members' then '/espace/actualites/' else '/actualites/' end || (rec ->> 'slug')
              else '/evenements/' || (rec ->> 'slug') end
    from public.profiles p
   where p.status = 'active' and p.role_key in ('member', 'editor', 'manager', 'admin');
  return new;
end $fn$;

drop trigger if exists news_notify_members on public.news;
create trigger news_notify_members before insert or update of status, published_at on public.news
  for each row execute function public.notify_members_of_publication();

drop trigger if exists events_notify_members on public.events;
create trigger events_notify_members before insert or update of status on public.events
  for each row execute function public.notify_members_of_publication();
