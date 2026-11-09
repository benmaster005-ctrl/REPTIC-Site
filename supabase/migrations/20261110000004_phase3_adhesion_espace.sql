-- =============================================================================
-- REPTIC.CM — Phase 3 : parcours d'adhésion et espace membre
--   * pièces justificatives configurables par type de candidat
--   * soumission contrôlée côté base (submit_application)
--   * notifications automatiques au candidat
--   * protection des champs de la fiche membre
--   * accès des membres aux documents associatifs du stockage privé
-- À exécuter dans le SQL Editor après les migrations 1 à 3.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Pièces justificatives requises (modifiables depuis le back-office)
-- ---------------------------------------------------------------------------
create table public.required_documents (
  applicant_type public.applicant_type not null,
  key            text not null,
  label          text not null,
  help           text,
  is_required    boolean not null default true,
  accepted_mime  text[] not null default array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  position       int not null default 0,
  primary key (applicant_type, key)
);
alter table public.required_documents enable row level security;
create policy "pièces: lecture" on public.required_documents for select to anon, authenticated using (true);
create policy "pièces: gestion" on public.required_documents for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

insert into public.required_documents (applicant_type, key, label, help, is_required, accepted_mime, position) values
  ('physical', 'piece_identite', 'Pièce d''identité', 'CNI ou passeport en cours de validité, recto-verso.', true, default, 1),
  ('physical', 'cv', 'Curriculum vitae', 'Format PDF de préférence.', true, array['application/pdf'], 2),
  ('physical', 'justificatif_activite', 'Justificatif d''activité', 'Attestation, carte professionnelle ou contrat.', true, default, 3),
  ('physical', 'photo', 'Photo d''identité', 'Facultative, format JPEG ou PNG.', false, array['image/jpeg', 'image/png', 'image/webp'], 4),
  ('legal', 'rccm', 'Registre du commerce (RCCM)', null, true, default, 1),
  ('legal', 'niu', 'Numéro d''identifiant unique (NIU)', 'Attestation d''immatriculation fiscale.', true, default, 2),
  ('legal', 'statuts', 'Statuts de l''entreprise', 'Statuts signés, format PDF.', true, array['application/pdf'], 3),
  ('legal', 'piece_identite_representant', 'Pièce d''identité du représentant légal', null, true, default, 4),
  ('legal', 'logo', 'Logo', 'Facultatif, format image.', false, array['image/jpeg', 'image/png', 'image/webp'], 5)
on conflict do nothing;

-- Un seul dossier en cours par candidat
create unique index applications_one_open_per_user on public.applications(user_id)
  where status in ('draft', 'submitted', 'under_review', 'additional_info');

-- ---------------------------------------------------------------------------
-- Soumission : vérifie la complétude puis passe le dossier à « soumise »
-- ---------------------------------------------------------------------------
create or replace function public.submit_application(p_application_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
  missing text;
begin
  select * into app from public.applications where id = p_application_id for update;
  if app.id is null or app.user_id <> auth.uid() then
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

  update public.applications
     set status = 'submitted', terms_accepted_at = now(), submitted_at = now()
   where id = app.id;

  insert into public.notifications (user_id, type, title, body, link)
  values (app.user_id, 'application.submitted', 'Demande d''adhésion envoyée',
          'Votre dossier ' || app.reference || ' a bien été reçu. Nous vous tiendrons informé de son avancement.',
          '/espace/adhesion');

  return app.reference;
end $$;

revoke execute on function public.submit_application(uuid) from anon;

-- Le garde-fou des transitions doit laisser passer la soumission contrôlée ci-dessus
-- (submitted_at est désormais renseigné par submit_application).

-- ---------------------------------------------------------------------------
-- Notification du candidat à chaque décision de l'équipe
-- ---------------------------------------------------------------------------
create or replace function public.notify_application_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  t text;
  b text;
begin
  if new.status is not distinct from old.status or new.status in ('draft', 'submitted') then
    return new;
  end if;
  t := case new.status
         when 'under_review'    then 'Votre dossier est en cours d''examen'
         when 'additional_info' then 'Complément requis pour votre dossier'
         when 'accepted'        then 'Votre adhésion est acceptée'
         when 'rejected'        then 'Décision sur votre demande d''adhésion'
       end;
  b := case new.status
         when 'additional_info' then coalesce(new.decision_reason, 'Des informations complémentaires sont nécessaires.')
         when 'rejected'        then coalesce(new.decision_reason, 'Votre demande n''a pas été retenue.')
         when 'accepted'        then 'Bienvenue dans le réseau. Votre espace membre est désormais actif.'
         else 'Dossier ' || new.reference
       end;
  insert into public.notifications (user_id, type, title, body, link)
  values (new.user_id, 'application.' || new.status, t, b, '/espace/adhesion');
  return new;
end $$;

create trigger applications_notify after update of status on public.applications
  for each row execute function public.notify_application_status();

-- ---------------------------------------------------------------------------
-- Fiche membre : le membre ne modifie que ses informations publiques
-- ---------------------------------------------------------------------------
create or replace function public.protect_member_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_permission('members.manage') then
    return new;
  end if;
  if new.user_id is distinct from old.user_id
     or new.member_type is distinct from old.member_type
     or new.organization_id is distinct from old.organization_id
     or new.member_number is distinct from old.member_number
     or new.first_name is distinct from old.first_name
     or new.last_name is distinct from old.last_name
     or new.birth_date is distinct from old.birth_date then
    raise exception 'Ces informations ne peuvent être modifiées que par le secrétariat';
  end if;
  return new;
end $$;

create trigger members_protect before update on public.members
  for each row execute function public.protect_member_columns();

-- Le candidat peut corriger son nom et son téléphone, pas son rôle (déjà protégé).

-- ---------------------------------------------------------------------------
-- Stockage : les membres lisent les documents associatifs référencés
-- ---------------------------------------------------------------------------
create policy "docs: documents associatifs" on storage.objects for select to authenticated
  using (
    bucket_id = 'private-documents' and exists (
      select 1 from public.documents d
      where d.bucket = 'private-documents' and d.storage_path = storage.objects.name
        and (d.visibility = 'public' or (d.visibility = 'members' and public.is_active_member()))
    )
  );

-- ---------------------------------------------------------------------------
-- Annuaire : vue en lecture seule, filtrée par la RLS de members
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
         m.directory_visibility
    from public.members m
    left join public.organizations o on o.id = m.organization_id
    left join public.categories c on c.id = m.activity_category_id
   where m.directory_visibility is not null;

grant select on public.member_directory to anon, authenticated;

-- Inscriptions aux événements : un membre peut se réinscrire après annulation
create policy "inscriptions: réactiver" on public.event_registrations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status in ('registered', 'waitlisted', 'cancelled'));

-- L'annuaire affiche la raison sociale des entreprises membres aux autres membres
create policy "organizations: annuaire membres" on public.organizations for select to authenticated
  using (public.is_active_member() and exists (
    select 1 from public.members m
    where m.organization_id = organizations.id and m.directory_visibility in ('public', 'members')
  ));

-- Capacité des événements : au-delà, l'inscription passe en liste d'attente
create or replace function public.apply_event_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cap int;
  taken int;
begin
  if new.status <> 'registered' then
    return new;
  end if;
  select capacity into cap from public.events where id = new.event_id;
  if cap is null then
    return new;
  end if;
  select count(*) into taken from public.event_registrations
   where event_id = new.event_id and status = 'registered' and id <> new.id;
  if taken >= cap then
    new.status := 'waitlisted';
  end if;
  return new;
end $$;

create trigger event_registrations_capacity before insert or update of status on public.event_registrations
  for each row execute function public.apply_event_capacity();
