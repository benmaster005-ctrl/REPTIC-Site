-- =============================================================================
-- REPTIC.CM — Posts de la page LinkedIn (collecte Bright Data)
--   * les posts sont stockés en base et affichés depuis la base
--   * l'import, sans session (tâche planifiée), passe par une fonction protégée
--     par un secret serveur, comme la confirmation des paiements
-- À exécuter dans le SQL Editor après les migrations 1 à 11.
-- =============================================================================

insert into private.app_secrets (key, value)
values ('linkedin_sync', encode(gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;
-- Secret à recopier dans LINKEDIN_SYNC_SECRET :
--   select value from private.app_secrets where key = 'linkedin_sync';

create table public.linkedin_posts (
  id              text primary key,                -- identifiant LinkedIn du post
  url             text not null,
  text            text,
  posted_at       timestamptz,
  post_type       text,
  images          text[] not null default '{}',
  video_thumbnail text,
  document_cover  text,
  num_likes       int,
  num_comments    int,
  is_visible      boolean not null default true,  -- masquable depuis le back-office
  raw             jsonb,
  imported_at     timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index linkedin_posts_date_idx on public.linkedin_posts(posted_at desc);

create table public.linkedin_sync_runs (
  id          bigint generated always as identity primary key,
  snapshot_id text,
  status      text not null default 'running' check (status in ('running', 'imported', 'failed')),
  records     int,
  error       text,
  started_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.linkedin_posts enable row level security;
alter table public.linkedin_sync_runs enable row level security;

create policy "linkedin: lecture publique" on public.linkedin_posts for select to anon, authenticated using (is_visible);
create policy "linkedin: équipe" on public.linkedin_posts for select to authenticated using (public.has_permission('content.manage'));
create policy "linkedin: masquer" on public.linkedin_posts for update to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));
create policy "linkedin: suivi" on public.linkedin_sync_runs for select to authenticated using (public.has_permission('content.manage'));

-- Démarrage d'une synchronisation (enregistre l'identifiant de la collecte)
create or replace function public.linkedin_sync_started(p_secret text, p_snapshot_id text, p_user uuid default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
begin
  if p_secret is null or p_secret <> (select value from private.app_secrets where key = 'linkedin_sync') then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  insert into public.linkedin_sync_runs (snapshot_id, started_by) values (left(p_snapshot_id, 80), p_user) returning id into v_id;
  return v_id;
end $$;

-- Collecte en cours la plus récente (pour la reprendre)
create or replace function public.linkedin_pending_run(p_secret text)
returns table (run_id bigint, snapshot_id text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if p_secret is null or p_secret <> (select value from private.app_secrets where key = 'linkedin_sync') then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return query select r.id, r.snapshot_id, r.created_at from public.linkedin_sync_runs r
    where r.status = 'running' order by r.created_at desc limit 1;
end $$;

-- Import : insère les nouveaux posts et met à jour les existants (sans toucher à is_visible)
create or replace function public.import_linkedin_posts(p_secret text, p_run_id bigint, p_posts jsonb, p_error text default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  n int := 0;
begin
  if p_secret is null or p_secret <> (select value from private.app_secrets where key = 'linkedin_sync') then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  if p_error is not null then
    update public.linkedin_sync_runs set status = 'failed', error = left(p_error, 500), finished_at = now() where id = p_run_id;
    return 0;
  end if;

  insert into public.linkedin_posts (id, url, text, posted_at, post_type, images, video_thumbnail, document_cover, num_likes, num_comments, raw)
  select p ->> 'id', p ->> 'url', p ->> 'text', nullif(p ->> 'posted_at', '')::timestamptz, p ->> 'post_type',
         coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'images', '[]'::jsonb))), '{}'),
         p ->> 'video_thumbnail', p ->> 'document_cover',
         nullif(p ->> 'num_likes', '')::int, nullif(p ->> 'num_comments', '')::int, p -> 'raw'
    from jsonb_array_elements(coalesce(p_posts, '[]'::jsonb)) p
   where coalesce(p ->> 'id', '') <> '' and coalesce(p ->> 'url', '') <> ''
  on conflict (id) do update set
    url = excluded.url, text = excluded.text, posted_at = coalesce(excluded.posted_at, public.linkedin_posts.posted_at),
    post_type = excluded.post_type, images = excluded.images, video_thumbnail = excluded.video_thumbnail,
    document_cover = excluded.document_cover, num_likes = excluded.num_likes, num_comments = excluded.num_comments,
    raw = excluded.raw, updated_at = now();
  get diagnostics n = row_count;

  update public.linkedin_sync_runs set status = 'imported', records = n, finished_at = now() where id = p_run_id;
  return n;
end $$;

grant execute on function public.linkedin_sync_started(text, text, uuid) to anon, authenticated;
grant execute on function public.linkedin_pending_run(text) to anon, authenticated;
grant execute on function public.import_linkedin_posts(text, bigint, jsonb, text) to anon, authenticated;
