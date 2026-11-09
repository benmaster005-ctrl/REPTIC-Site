-- =============================================================================
-- REPTIC.CM — Row Level Security
-- Principe : tout est fermé par défaut, chaque accès est ouvert explicitement.
-- Contrôle côté serveur pour chaque ressource privée (§8.2).
-- =============================================================================

alter table public.roles                      enable row level security;
alter table public.permissions                enable row level security;
alter table public.role_permissions           enable row level security;
alter table public.profiles                   enable row level security;
alter table public.categories                 enable row level security;
alter table public.organizations              enable row level security;
alter table public.members                    enable row level security;
alter table public.applications               enable row level security;
alter table public.application_status_history enable row level security;
alter table public.memberships                enable row level security;
alter table public.documents                  enable row level security;
alter table public.pages                      enable row level security;
alter table public.menu_items                 enable row level security;
alter table public.governance_members         enable row level security;
alter table public.key_figures                enable row level security;
alter table public.news                       enable row level security;
alter table public.events                     enable row level security;
alter table public.event_registrations        enable row level security;
alter table public.notifications              enable row level security;
alter table public.email_templates            enable row level security;
alter table public.contact_messages           enable row level security;
alter table public.newsletter_subscribers     enable row level security;
alter table public.audit_logs                 enable row level security;
alter table public.site_settings              enable row level security;

-- ---------------------------------------------------------------------------
-- Référentiels
-- ---------------------------------------------------------------------------
create policy "roles: lecture connectés" on public.roles for select to authenticated using (true);
create policy "roles: gestion" on public.roles for all to authenticated
  using (public.has_permission('roles.manage')) with check (public.has_permission('roles.manage'));

create policy "permissions: lecture connectés" on public.permissions for select to authenticated using (true);
create policy "role_permissions: lecture connectés" on public.role_permissions for select to authenticated using (true);
create policy "role_permissions: gestion" on public.role_permissions for all to authenticated
  using (public.has_permission('roles.manage')) with check (public.has_permission('roles.manage'));

create policy "categories: lecture publique" on public.categories for select to anon, authenticated using (is_active);
create policy "categories: gestion" on public.categories for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

-- ---------------------------------------------------------------------------
-- Profils
-- ---------------------------------------------------------------------------
create policy "profiles: soi-même" on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "profiles: gestionnaires" on public.profiles for select to authenticated
  using (public.has_permission('members.read'));
create policy "profiles: mise à jour de soi" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());   -- colonnes sensibles protégées par trigger
create policy "profiles: gestion" on public.profiles for update to authenticated
  using (public.has_permission('users.manage')) with check (public.has_permission('users.manage'));

-- ---------------------------------------------------------------------------
-- Membres et organisations (annuaire selon les règles de confidentialité)
-- ---------------------------------------------------------------------------
create policy "members: soi-même" on public.members for select to authenticated
  using (user_id = auth.uid());
create policy "members: annuaire public" on public.members for select to anon, authenticated
  using (directory_visibility = 'public');
create policy "members: annuaire membres" on public.members for select to authenticated
  using (directory_visibility = 'members' and public.is_active_member());
create policy "members: gestionnaires lecture" on public.members for select to authenticated
  using (public.has_permission('members.read'));
create policy "members: mise à jour de soi" on public.members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members: gestion" on public.members for all to authenticated
  using (public.has_permission('members.manage')) with check (public.has_permission('members.manage'));

create policy "organizations: annuaire public" on public.organizations for select to anon, authenticated
  using (is_listed);
create policy "organizations: rattachement" on public.organizations for select to authenticated
  using (exists (select 1 from public.members m where m.organization_id = organizations.id and m.user_id = auth.uid()));
create policy "organizations: gestionnaires lecture" on public.organizations for select to authenticated
  using (public.has_permission('members.read'));
create policy "organizations: gestion" on public.organizations for all to authenticated
  using (public.has_permission('members.manage')) with check (public.has_permission('members.manage'));

-- ---------------------------------------------------------------------------
-- Demandes d'adhésion
-- ---------------------------------------------------------------------------
create policy "applications: candidat lecture" on public.applications for select to authenticated
  using (user_id = auth.uid());
create policy "applications: candidat création" on public.applications for insert to authenticated
  with check (user_id = auth.uid() and status = 'draft');
create policy "applications: candidat modification" on public.applications for update to authenticated
  using (user_id = auth.uid() and status in ('draft', 'additional_info'))
  with check (user_id = auth.uid());          -- transitions contrôlées par trigger
create policy "applications: candidat suppression brouillon" on public.applications for delete to authenticated
  using (user_id = auth.uid() and status = 'draft');
create policy "applications: instruction lecture" on public.applications for select to authenticated
  using (public.has_permission('applications.read'));
create policy "applications: instruction" on public.applications for update to authenticated
  using (public.has_permission('applications.review')) with check (public.has_permission('applications.review'));

create policy "history: candidat" on public.application_status_history for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()));
create policy "history: instruction" on public.application_status_history for select to authenticated
  using (public.has_permission('applications.read'));

-- ---------------------------------------------------------------------------
-- Adhésions validées
-- ---------------------------------------------------------------------------
create policy "memberships: soi-même" on public.memberships for select to authenticated
  using (exists (select 1 from public.members m where m.id = member_id and m.user_id = auth.uid()));
create policy "memberships: gestionnaires" on public.memberships for select to authenticated
  using (public.has_permission('members.read'));
create policy "memberships: gestion" on public.memberships for all to authenticated
  using (public.has_permission('members.manage')) with check (public.has_permission('members.manage'));

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------
create policy "documents: propriétaire" on public.documents for select to authenticated
  using (owner_id = auth.uid());
create policy "documents: publics" on public.documents for select to anon, authenticated
  using (visibility = 'public');
create policy "documents: réservés membres" on public.documents for select to authenticated
  using (visibility = 'members' and public.is_active_member());
create policy "documents: gestionnaires" on public.documents for select to authenticated
  using (public.has_permission('applications.read') or public.has_permission('members.read'));
create policy "documents: dépôt candidat" on public.documents for insert to authenticated
  with check (
    owner_id = auth.uid() and visibility is null and (
      application_id is null or exists (
        select 1 from public.applications a
        where a.id = application_id and a.user_id = auth.uid() and a.status in ('draft', 'additional_info')
      )
    )
  );
create policy "documents: suppression candidat" on public.documents for delete to authenticated
  using (owner_id = auth.uid() and exists (
    select 1 from public.applications a
    where a.id = application_id and a.user_id = auth.uid() and a.status in ('draft', 'additional_info')
  ));
create policy "documents: gestion" on public.documents for all to authenticated
  using (public.has_permission('documents.manage')) with check (public.has_permission('documents.manage'));

-- ---------------------------------------------------------------------------
-- Contenus éditoriaux
-- ---------------------------------------------------------------------------
create policy "pages: lecture publique" on public.pages for select to anon, authenticated
  using (status = 'published');
create policy "pages: éditeurs" on public.pages for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

create policy "menus: lecture publique" on public.menu_items for select to anon, authenticated using (is_visible);
create policy "menus: éditeurs" on public.menu_items for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

create policy "gouvernance: lecture publique" on public.governance_members for select to anon, authenticated using (is_published);
create policy "gouvernance: éditeurs" on public.governance_members for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

create policy "chiffres: lecture publique" on public.key_figures for select to anon, authenticated using (is_published);
create policy "chiffres: éditeurs" on public.key_figures for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

-- Une actualité « programmée » devient visible dès que published_at est passé
create policy "news: publiques" on public.news for select to anon, authenticated
  using (visibility = 'public' and status in ('published', 'scheduled') and published_at <= now());
create policy "news: réservées membres" on public.news for select to authenticated
  using (visibility = 'members' and status in ('published', 'scheduled') and published_at <= now()
         and public.is_active_member());
create policy "news: éditeurs" on public.news for all to authenticated
  using (public.has_permission('content.manage')) with check (public.has_permission('content.manage'));

create policy "events: publics" on public.events for select to anon, authenticated
  using (visibility = 'public' and status = 'published');
create policy "events: réservés membres" on public.events for select to authenticated
  using (visibility = 'members' and status = 'published' and public.is_active_member());
create policy "events: éditeurs" on public.events for all to authenticated
  using (public.has_permission('events.manage')) with check (public.has_permission('events.manage'));

create policy "inscriptions: soi-même" on public.event_registrations for select to authenticated
  using (user_id = auth.uid());
create policy "inscriptions: créer" on public.event_registrations for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.events e where e.id = event_id and e.registration_enabled and e.status = 'published'
      and (e.registration_deadline is null or e.registration_deadline > now())
  ));
create policy "inscriptions: annuler" on public.event_registrations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'cancelled');
create policy "inscriptions: gestion" on public.event_registrations for all to authenticated
  using (public.has_permission('events.manage')) with check (public.has_permission('events.manage'));

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create policy "notifications: soi-même" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications: marquer lue" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications: émission" on public.notifications for insert to authenticated
  with check (public.has_permission('members.manage') or public.has_permission('applications.review'));

create policy "email_templates: gestion" on public.email_templates for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

-- ---------------------------------------------------------------------------
-- Contact et newsletter : insertion publique uniquement (lecture réservée)
-- La validation et l'anti-spam sont faits dans la Server Action.
-- ---------------------------------------------------------------------------
create policy "contact: envoi public" on public.contact_messages for insert to anon, authenticated
  with check (handled_at is null and handled_by is null);
create policy "contact: traitement" on public.contact_messages for all to authenticated
  using (public.has_permission('contact.manage')) with check (public.has_permission('contact.manage'));

create policy "newsletter: inscription publique" on public.newsletter_subscribers for insert to anon, authenticated
  with check (unsubscribed_at is null);
create policy "newsletter: gestion" on public.newsletter_subscribers for all to authenticated
  using (public.has_permission('contact.manage')) with check (public.has_permission('contact.manage'));

-- ---------------------------------------------------------------------------
-- Journal d'audit : lecture seule pour les habilités, écriture via log_audit()
-- ---------------------------------------------------------------------------
create policy "audit: lecture" on public.audit_logs for select to authenticated
  using (public.has_permission('audit.read'));

create policy "settings: lecture publique" on public.site_settings for select to anon, authenticated using (true);
create policy "settings: gestion" on public.site_settings for all to authenticated
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

revoke execute on function public.log_audit(text, text, text, jsonb) from anon;
