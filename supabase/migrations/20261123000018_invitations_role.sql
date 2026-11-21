-- =============================================================================
-- REPTIC.CM — Liens d'invitation avec rôle (éditeur, gestionnaire, administrateur)
--
-- Un administrateur (permission users.manage) ajoute un utilisateur : adresse
-- e-mail + rôle. La personne reçoit un e-mail, crée son compte (ou se connecte)
-- depuis le lien, et reçoit directement le rôle prévu.
-- Sécurité :
--   - seul le condensé SHA-256 du jeton est stocké ;
--   - usage unique, durée de validité limitée (1 à 30 jours), révocable ;
--   - réservé à l'adresse invitée : seul le compte de cette adresse peut accepter ;
--   - une nouvelle invitation pour la même adresse remplace la précédente ;
--   - rôles d'équipe seulement (les membres passent par la demande d'adhésion) ;
--   - toutes les opérations passent par des fonctions contrôlées et sont
--     journalisées. Rejouable.
-- =============================================================================

create table if not exists public.role_invitations (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  role_key    text not null references public.roles(key),
  email       citext,
  note        text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     uuid references public.profiles(id) on delete set null,
  revoked_at  timestamptz
);
create index if not exists role_invitations_pending_idx on public.role_invitations (expires_at) where used_at is null and revoked_at is null;

alter table public.role_invitations enable row level security;
drop policy if exists "invitations de rôle : lecture équipe" on public.role_invitations;
create policy "invitations de rôle : lecture équipe" on public.role_invitations
  for select to authenticated using (public.has_permission('users.manage'));
-- Aucune écriture directe : création, révocation et acceptation passent par les fonctions ci-dessous.

-- Création : renvoie le jeton en clair (une seule fois)
create or replace function public.create_role_invitation(p_role text, p_email text default null, p_days int default 7, p_note text default null)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  token text;
begin
  if not public.has_permission('users.manage') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  if p_role not in ('editor', 'manager', 'admin') then
    raise exception 'Rôle non autorisé pour une invitation' using errcode = 'P0001';
  end if;
  if p_days is null or p_days < 1 or p_days > 30 then
    raise exception 'Durée de validité invalide (1 à 30 jours)' using errcode = 'P0001';
  end if;
  if nullif(trim(p_email), '') is null then
    raise exception 'Adresse e-mail obligatoire' using errcode = 'P0001';
  end if;
  -- Une seule invitation en attente par adresse : la précédente est annulée
  update public.role_invitations set revoked_at = now()
   where email = trim(p_email)::citext and used_at is null and revoked_at is null;
  token := encode(gen_random_bytes(24), 'hex');
  insert into public.role_invitations (token_hash, role_key, email, note, created_by, expires_at)
  values (encode(digest(token, 'sha256'), 'hex'), p_role, nullif(trim(p_email), ''), nullif(trim(p_note), ''), auth.uid(), now() + make_interval(days => p_days));
  perform public.log_audit('invitation.role.create', 'role_invitation', null,
    jsonb_build_object('role', p_role, 'email', nullif(trim(p_email), ''), 'days', p_days));
  return token;
end $$;

-- Révocation
create or replace function public.revoke_role_invitation(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_permission('users.manage') then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  update public.role_invitations set revoked_at = now()
   where id = p_id and used_at is null and revoked_at is null;
  perform public.log_audit('invitation.role.revoke', 'role_invitation', p_id::text, '{}'::jsonb);
end $$;

-- Informations publiques d'un lien (page d'acceptation) : rôle et validité, rien de plus
create or replace function public.role_invitation_info(p_token text)
returns table (role_key text, role_label text, email_required boolean, state text)
language plpgsql security definer stable set search_path = public, extensions as $$
declare
  inv public.role_invitations;
begin
  select * into inv from public.role_invitations where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if inv.id is null then
    return query select null::text, null::text, false, 'invalid'::text;
    return;
  end if;
  return query
    select inv.role_key, (select r.label from public.roles r where r.key = inv.role_key), inv.email is not null,
           case when inv.revoked_at is not null then 'revoked'
                when inv.used_at is not null then 'used'
                when inv.expires_at < now() then 'expired'
                else 'valid' end;
end $$;

-- Acceptation par la personne connectée : attribue le rôle et active le compte
create or replace function public.accept_role_invitation(p_token text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  inv  public.role_invitations;
  prof public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Connectez-vous pour accepter l''invitation' using errcode = '42501';
  end if;
  select * into inv from public.role_invitations
   where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') for update;
  if inv.id is null then raise exception 'Lien d''invitation invalide' using errcode = 'P0001'; end if;
  if inv.revoked_at is not null then raise exception 'Cette invitation a été annulée' using errcode = 'P0001'; end if;
  if inv.used_at is not null then raise exception 'Cette invitation a déjà été utilisée' using errcode = 'P0001'; end if;
  if inv.expires_at < now() then raise exception 'Cette invitation a expiré' using errcode = 'P0001'; end if;

  select * into prof from public.profiles where id = auth.uid() for update;
  if prof.id is null then raise exception 'Compte introuvable' using errcode = 'P0002'; end if;
  if inv.email is not null and lower(prof.email) <> lower(inv.email::text) then
    raise exception 'Cette invitation est réservée à une autre adresse e-mail' using errcode = 'P0001';
  end if;

  -- Changement de rôle autorisé ici (le déclencheur de protection des profils l'interdit sinon)
  perform set_config('reptic.trusted', 'on', true);
  update public.profiles set role_key = inv.role_key, status = 'active' where id = prof.id;
  perform set_config('reptic.trusted', 'off', true);

  update public.role_invitations set used_at = now(), used_by = prof.id where id = inv.id;
  perform public.log_audit('invitation.role.accept', 'profile', prof.id::text,
    jsonb_build_object('email', prof.email, 'from', prof.role_key, 'to', inv.role_key));
  return inv.role_key;
end $$;

revoke all on function public.create_role_invitation(text, text, int, text) from public;
revoke all on function public.revoke_role_invitation(uuid) from public;
revoke all on function public.role_invitation_info(text) from public;
revoke all on function public.accept_role_invitation(text) from public;
grant execute on function public.create_role_invitation(text, text, int, text) to authenticated;
grant execute on function public.revoke_role_invitation(uuid) to authenticated;
grant execute on function public.role_invitation_info(text) to anon, authenticated;
grant execute on function public.accept_role_invitation(text) to authenticated;

-- Modèle de l'e-mail d'invitation (modifiable dans Administration → E-mails)
insert into public.email_templates (key, name, description, variables, position, subject, body) values (
  'invitation.team', 'Invitation à l''équipe (avec rôle)', 'Envoyé à la personne ajoutée par un administrateur dans Utilisateurs et rôles.',
  array['role', 'invite_par', 'expire_le'], 11,
  'Invitation à rejoindre l''équipe du REPTIC.CM',
  E'Bonjour,\n\n{{invite_par}} vous invite à rejoindre l''espace d''administration du REPTIC.CM en tant que {{role}}.\n\nCliquez sur le bouton ci-dessous, puis créez votre compte avec cette adresse e-mail, ou connectez-vous si vous en avez déjà un. Votre rôle vous sera attribué automatiquement.\n\nSi vous ne vous attendiez pas à cette invitation, vous pouvez ignorer cet e-mail.'
)
on conflict (key) do nothing;
