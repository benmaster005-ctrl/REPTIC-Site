-- =============================================================================
-- REPTIC.CM — User stories, bloc 2
--   Story 12 : messages de diffusion (notification + e-mail, audience ciblée)
--   Story 11 : invitations envoyées par les membres
--   Story 6  : campagnes de newsletter (envoi par lots, suivi)
--   Story 2  : préférence « e-mail à chaque publication »
-- À exécuter dans le SQL Editor après les migrations 1 à 7.
-- =============================================================================

-- Nouvelle permission : envoyer des messages de diffusion
insert into public.permissions (key, description) values
  ('broadcasts.send', 'Envoyer des messages de diffusion aux membres')
on conflict (key) do nothing;
insert into public.role_permissions (role_key, permission_key) values
  ('manager', 'broadcasts.send'), ('admin', 'broadcasts.send')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Story 2 : préférence e-mail des membres
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists email_publications boolean not null default true;

-- ---------------------------------------------------------------------------
-- Story 12 : messages de diffusion
-- ---------------------------------------------------------------------------
create table public.broadcasts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 3 and 160),
  body             text not null check (char_length(body) between 1 and 5000),
  audience         text not null check (audience in ('all', 'physical', 'legal', 'category', 'staff')),
  category_id      uuid references public.categories(id),
  send_email       boolean not null default true,
  recipients_count int not null default 0,
  emailed_count    int not null default 0,
  sent_by          uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);
alter table public.broadcasts enable row level security;

alter table public.notifications add column if not exists broadcast_id uuid references public.broadcasts(id) on delete cascade;
create index if not exists notifications_broadcast_idx on public.notifications(broadcast_id);

create policy "broadcasts: équipe" on public.broadcasts for select to authenticated
  using (public.has_permission('broadcasts.send'));
create policy "broadcasts: destinataires" on public.broadcasts for select to authenticated
  using (exists (select 1 from public.notifications n where n.broadcast_id = broadcasts.id and n.user_id = auth.uid()));
create policy "broadcasts: suivi d'envoi" on public.broadcasts for update to authenticated
  using (public.has_permission('broadcasts.send')) with check (public.has_permission('broadcasts.send'));

-- Crée le message, notifie les destinataires et renvoie leurs adresses
-- (pour l'envoi par e-mail fait par le site).
create or replace function public.send_broadcast(
  p_title text, p_body text, p_audience text, p_category_id uuid default null, p_send_email boolean default true
)
returns table (broadcast_id uuid, email text) language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_count int;
begin
  if not public.has_permission('broadcasts.send') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  if p_audience = 'category' and p_category_id is null then
    raise exception 'Choisissez un domaine d''activité' using errcode = 'P0001';
  end if;

  insert into public.broadcasts (title, body, audience, category_id, send_email, sent_by)
  values (trim(p_title), trim(p_body), p_audience, case when p_audience = 'category' then p_category_id end, p_send_email, auth.uid())
  returning id into v_id;

  create temporary table _recipients on commit drop as
    select distinct p.id, p.email::text as email
      from public.profiles p
      left join public.members m on m.user_id = p.id
     where p.status = 'active'
       and case p_audience
             when 'all' then p.role_key in ('member', 'editor', 'manager', 'admin')
             when 'staff' then p.role_key in ('editor', 'manager', 'admin')
             when 'physical' then m.member_type = 'physical'
             when 'legal' then m.member_type = 'legal'
             when 'category' then m.activity_category_id = p_category_id
             else false
           end;

  insert into public.notifications (user_id, type, title, body, link, broadcast_id)
  select r.id, 'broadcast', trim(p_title), left(trim(p_body), 280), '/espace/messages/' || v_id, v_id from _recipients r;

  get diagnostics v_count = row_count;
  update public.broadcasts set recipients_count = v_count where id = v_id;

  perform public.log_audit('broadcast.send', 'broadcast', v_id::text,
    jsonb_build_object('title', trim(p_title), 'audience', p_audience, 'count', v_count, 'email', p_send_email));

  return query select v_id, r.email from _recipients r where p_send_email
               union all select v_id, null::text where not p_send_email or v_count = 0;
end $$;

revoke execute on function public.send_broadcast(text, text, text, uuid, boolean) from anon;

-- ---------------------------------------------------------------------------
-- Story 11 : invitations
-- ---------------------------------------------------------------------------
create table public.invitations (
  id               uuid primary key default gen_random_uuid(),
  inviter_id       uuid not null references public.profiles(id) on delete cascade,
  email            citext not null,
  message          text check (message is null or char_length(message) <= 600),
  token            uuid not null unique default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  accepted_at      timestamptz,
  accepted_user_id uuid references public.profiles(id) on delete set null
);
create index invitations_email_idx on public.invitations(email);
create index invitations_inviter_idx on public.invitations(inviter_id, created_at desc);
alter table public.invitations enable row level security;

create policy "invitations: les miennes" on public.invitations for select to authenticated
  using (inviter_id = auth.uid());
create policy "invitations: gestionnaires" on public.invitations for select to authenticated
  using (public.has_permission('members.read'));

-- Contrôles anti-abus : membres actifs, 10 invitations par 24 h,
-- pas de relance d'une même adresse avant 7 jours, pas de compte existant.
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
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception 'Adresse e-mail invalide' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where email = v_email) then
    raise exception 'Cette personne a déjà un compte sur la plateforme' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.invitations where email = v_email and created_at > now() - interval '7 days') then
    raise exception 'Cette adresse a déjà été invitée récemment' using errcode = 'P0001';
  end if;
  if (select count(*) from public.invitations where inviter_id = auth.uid() and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Limite atteinte : 10 invitations par jour' using errcode = 'P0001';
  end if;

  insert into public.invitations (inviter_id, email, message)
  values (auth.uid(), v_email, nullif(trim(coalesce(p_message, '')), ''))
  returning invitations.token into v_token;

  select coalesce(o.legal_name, nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.email)
    into v_name
    from public.profiles p
    left join public.members m on m.user_id = p.id
    left join public.organizations o on o.id = m.organization_id
   where p.id = auth.uid();

  return query select v_token, v_name;
end $$;

revoke execute on function public.create_invitation(text, text) from anon;

-- Une invitation est « acceptée » dès que la personne crée son compte
create or replace function public.mark_invitation_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.invitations set accepted_at = now(), accepted_user_id = new.id
   where email = new.email and accepted_at is null;
  return new;
end $$;

create trigger profiles_invitation_accepted after insert on public.profiles
  for each row execute function public.mark_invitation_accepted();

insert into public.email_templates (key, name, description, variables, position, subject, body) values (
  'invitation.member', 'Invitation d''un membre', 'Envoyé à la personne invitée par un membre à rejoindre le réseau.',
  array['parrain', 'message'], 9,
  '{{parrain}} vous invite à rejoindre le REPTIC.CM',
  E'Bonjour,\n\n{{parrain}}, membre du Réseau des Entreprises & Professionnels du Secteur des Télécoms et du Numérique au Cameroun, vous invite à rejoindre le réseau.\n\n{{message}}\n\nLe REPTIC.CM fédère les acteurs du numérique camerounais : représentation auprès des institutions, réseau d''affaires, veille, formation et événements. La demande d''adhésion se fait entièrement en ligne.'
) on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Story 6 : campagnes de newsletter
-- ---------------------------------------------------------------------------
create table public.newsletter_campaigns (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null check (char_length(subject) between 3 and 160),
  intro        text not null check (char_length(intro) between 1 and 5000),
  news_ids     uuid[] not null default '{}',
  status       text not null default 'draft' check (status in ('draft', 'sending', 'sent')),
  total        int not null default 0,
  sent_count   int not null default 0,
  failed_count int not null default 0,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  sent_at      timestamptz
);
create table public.newsletter_deliveries (
  campaign_id   uuid not null references public.newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  email         citext not null,
  token         uuid not null,
  status        text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error         text,
  sent_at       timestamptz,
  primary key (campaign_id, subscriber_id)
);
create index newsletter_deliveries_pending_idx on public.newsletter_deliveries(campaign_id) where status = 'pending';

alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_deliveries enable row level security;
create policy "campagnes: gestion" on public.newsletter_campaigns for all to authenticated
  using (public.has_permission('contact.manage')) with check (public.has_permission('contact.manage'));
create policy "envois: gestion" on public.newsletter_deliveries for all to authenticated
  using (public.has_permission('contact.manage')) with check (public.has_permission('contact.manage'));

-- Démarre l'envoi : prépare une ligne par abonné actif (désinscrits exclus)
create or replace function public.start_newsletter_campaign(p_campaign_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  c public.newsletter_campaigns;
  n int;
begin
  if not public.has_permission('contact.manage') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  select * into c from public.newsletter_campaigns where id = p_campaign_id for update;
  if c.id is null then
    raise exception 'Lettre introuvable' using errcode = 'P0002';
  end if;
  if c.status <> 'draft' then
    raise exception 'Cette lettre a déjà été envoyée' using errcode = 'P0001';
  end if;
  insert into public.newsletter_deliveries (campaign_id, subscriber_id, email, token)
  select c.id, s.id, s.email, s.unsubscribe_token from public.newsletter_subscribers s where s.unsubscribed_at is null;
  get diagnostics n = row_count;
  update public.newsletter_campaigns set status = case when n = 0 then 'sent' else 'sending' end, total = n,
         started_at = now(), sent_at = case when n = 0 then now() end
   where id = c.id;
  perform public.log_audit('newsletter.send', 'newsletter', c.id::text, jsonb_build_object('title', c.subject, 'count', n));
  return n;
end $$;

revoke execute on function public.start_newsletter_campaign(uuid) from anon;

-- Clôture : recalcule les compteurs et passe la campagne à « envoyée » quand il ne reste rien
create or replace function public.refresh_newsletter_campaign(p_campaign_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s int; f int; p int;
begin
  if not public.has_permission('contact.manage') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  select count(*) filter (where status = 'sent'), count(*) filter (where status = 'failed'), count(*) filter (where status = 'pending')
    into s, f, p from public.newsletter_deliveries where campaign_id = p_campaign_id;
  update public.newsletter_campaigns
     set sent_count = s, failed_count = f,
         status = case when p = 0 then 'sent' else status end,
         sent_at = case when p = 0 then coalesce(sent_at, now()) else sent_at end
   where id = p_campaign_id;
  return jsonb_build_object('sent', s, 'failed', f, 'pending', p);
end $$;

revoke execute on function public.refresh_newsletter_campaign(uuid) from anon;

-- ---------------------------------------------------------------------------
-- Story 2 : destinataires des e-mails de publication
-- Les éditeurs n'ont pas accès aux adresses des membres : cette fonction ne
-- renvoie que la liste nécessaire à l'envoi, après contrôle de la permission.
-- ---------------------------------------------------------------------------
create or replace function public.publication_email_recipients()
returns setof text language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_permission('content.manage') or public.has_permission('events.manage')) then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  return query
    select p.email::text from public.profiles p
     where p.status = 'active' and p.email_publications
       and p.role_key in ('member', 'editor', 'manager', 'admin');
end $$;

revoke execute on function public.publication_email_recipients() from anon;
