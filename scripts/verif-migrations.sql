-- =============================================================================
-- REPTIC.CM — Vérification des migrations 1 à 16 (LECTURE SEULE, ne modifie rien)
-- À exécuter dans le SQL Editor (Studio) ou avec psql.
-- Résultat : une ligne par contrôle, ok = true / false. Les secrets ne sont
-- jamais affichés (seule leur présence est vérifiée).
-- =============================================================================
with
  f   as (select proname from pg_proc where pronamespace = 'public'::regnamespace),
  trg as (select tgname from pg_trigger where not tgisinternal),
  pol as (select schemaname, tablename, policyname from pg_policies),
  col as (select table_schema, table_name, column_name from information_schema.columns),
  rls as (select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relrowsecurity),
  checks(migration, controle, ok) as (
    -- 01 schéma
    select '01_schema', 'tables de base (24)', (select count(*) = 24 from pg_tables where schemaname = 'public' and tablename in
      ('application_status_history','applications','audit_logs','categories','contact_messages','documents','email_templates',
       'event_registrations','events','governance_members','key_figures','members','memberships','menu_items','news',
       'newsletter_subscribers','notifications','organizations','pages','permissions','profiles','role_permissions','roles','site_settings'))
    union all select '01_schema', 'types énumérés (8)', (select count(*) = 8 from pg_type where typnamespace = 'public'::regnamespace and typname in
      ('account_status','applicant_type','application_status','category_kind','content_status','content_visibility','membership_status','registration_status'))
    union all select '01_schema', 'fonctions has_permission / handle_new_user / log_audit', (select count(distinct proname) = 3 from f where proname in ('has_permission','handle_new_user','log_audit'))
    union all select '01_schema', 'trigger on_auth_user_created (auth.users)', exists(select 1 from pg_trigger where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass)
    union all select '01_schema', 'triggers profils / candidatures', (select count(*) = 5 from trg where tgname in ('profiles_protect','profiles_audit','profiles_touch','applications_guard','applications_log_status'))
    union all select '01_schema', 'rôles chargés (seed.sql)', exists(select 1 from public.roles)
    union all select '01_schema', 'permissions de l''admin (seed.sql)', exists(select 1 from public.role_permissions where role_key = 'admin')
    union all select '01_schema', 'pages institutionnelles (seed.sql + 10)', (select count(*) >= 5 from public.pages where status = 'published')
    union all select '01_schema', 'chiffres clés (seed.sql)', exists(select 1 from public.key_figures)
    -- 02 RLS
    union all select '02_rls', 'RLS activée sur les 24 tables de base', (select count(*) = 24 from rls where relname in
      ('application_status_history','applications','audit_logs','categories','contact_messages','documents','email_templates',
       'event_registrations','events','governance_members','key_figures','members','memberships','menu_items','news',
       'newsletter_subscribers','notifications','organizations','pages','permissions','profiles','role_permissions','roles','site_settings'))
    union all select '02_rls', 'politiques public (≥ 30)', (select count(*) >= 30 from pol where schemaname = 'public')
    union all select '02_rls', 'log_audit interdit à anon', not has_function_privilege('anon', (select min(oid) from pg_proc where proname = 'log_audit' and pronamespace = 'public'::regnamespace), 'execute')
    -- 03 stockage
    union all select '03_storage', 'buckets public-media et private-documents', (select count(*) = 2 from storage.buckets where id in ('public-media','private-documents'))
    union all select '03_storage', 'politiques media: / docs: sur storage.objects', (select count(*) >= 5 from pol where schemaname = 'storage' and tablename = 'objects' and (policyname like 'media:%' or policyname like 'docs:%'))
    -- 04 adhésion / espace
    union all select '04_adhesion', 'table required_documents (+ RLS)', 'required_documents' in (select relname from rls)
    union all select '04_adhesion', 'vue member_directory', to_regclass('public.member_directory') is not null
    union all select '04_adhesion', 'fonctions submit_application / notify / capacity', (select count(distinct proname) = 3 from f where proname in ('submit_application','notify_application_status','apply_event_capacity'))
    union all select '04_adhesion', 'triggers applications_notify / capacity / members_protect', (select count(*) = 3 from trg where tgname in ('applications_notify','event_registrations_capacity','members_protect'))
    -- 05 back-office
    union all select '05_backoffice', 'fonctions accept / decide / admin_stats / set_*', (select count(distinct proname) = 7 from f where proname in
      ('accept_application','decide_application','admin_stats','next_member_number','set_member_status','set_user_active','set_user_role'))
    union all select '05_backoffice', 'triggers d''audit des contenus (6)', (select count(*) = 6 from trg where tgname in ('documents_audit','events_audit','governance_audit','memberships_audit','news_audit','pages_audit'))
    -- 06 e-mails
    union all select '06_emails', 'modèles d''e-mail chargés', exists(select 1 from public.email_templates)
    -- 07 stories bloc 1
    union all select '07_bloc1', 'colonnes documents.description, news/events.notified_at', (select count(*) = 3 from col where table_schema = 'public' and
      ((table_name = 'documents' and column_name = 'description') or (table_name in ('news','events') and column_name = 'notified_at')))
    union all select '07_bloc1', 'fonctions newsletter_subscribe / unsubscribe', (select count(distinct proname) = 2 from f where proname in ('newsletter_subscribe','newsletter_unsubscribe'))
    union all select '07_bloc1', 'triggers news/events_notify_members', (select count(*) = 2 from trg where tgname in ('news_notify_members','events_notify_members'))
    -- 08 stories bloc 2
    union all select '08_bloc2', 'tables broadcasts / invitations / campagnes / envois (+ RLS)', (select count(*) = 4 from rls where relname in ('broadcasts','invitations','newsletter_campaigns','newsletter_deliveries'))
    union all select '08_bloc2', 'colonnes notifications.broadcast_id, profiles.email_publications', (select count(*) = 2 from col where table_schema = 'public' and
      ((table_name = 'notifications' and column_name = 'broadcast_id') or (table_name = 'profiles' and column_name = 'email_publications')))
    union all select '08_bloc2', 'fonctions invitations / diffusion / campagnes', (select count(distinct proname) = 5 from f where proname in
      ('create_invitation','send_broadcast','start_newsletter_campaign','refresh_newsletter_campaign','publication_email_recipients'))
    -- 09 cotisations
    union all select '09_cotisations', 'tables membership_fees / payments (+ RLS)', (select count(*) = 2 from rls where relname in ('membership_fees','payments'))
    union all select '09_cotisations', 'schéma private + table app_secrets', to_regclass('private.app_secrets') is not null
    union all select '09_cotisations', 'secret payments_confirm présent', exists(select 1 from private.app_secrets where key = 'payments_confirm')
    union all select '09_cotisations', 'fonctions de paiement (4)', (select count(distinct proname) = 4 from f where proname in
      ('create_fee_payment','confirm_fee_payment','attach_payment_transaction','payment_for_confirmation'))
    union all select '09_cotisations', 'tarifs chargés', exists(select 1 from public.membership_fees)
    -- 10 contenus
    union all select '10_contenus', 'bureau exécutif chargé', exists(select 1 from public.governance_members)
    union all select '10_contenus', 'actualités chargées', exists(select 1 from public.news)
    -- 11 images
    union all select '11_images', 'portraits du bureau renseignés', exists(select 1 from public.governance_members where photo_path like '/images/reptic/bureau/%')
    union all select '11_images', 'couvertures des actualités renseignées', exists(select 1 from public.news where cover_path like '/images/reptic/actualites/%')
    -- 12 LinkedIn
    union all select '12_linkedin', 'tables linkedin_posts / linkedin_sync_runs (+ RLS)', (select count(*) = 2 from rls where relname in ('linkedin_posts','linkedin_sync_runs'))
    union all select '12_linkedin', 'secret linkedin_sync présent', exists(select 1 from private.app_secrets where key = 'linkedin_sync')
    union all select '12_linkedin', 'fonctions import / pending / started', (select count(distinct proname) = 3 from f where proname in ('import_linkedin_posts','linkedin_pending_run','linkedin_sync_started'))
    -- 13 APIDE
    union all select '13_apide', 'événement apide-2026-douala', exists(select 1 from public.events where slug = 'apide-2026-douala')
    -- 14 Google / LinkedIn
    union all select '14_oauth', 'handle_new_user lit full_name (Google / LinkedIn)', exists(select 1 from pg_proc where proname = 'handle_new_user' and pronamespace = 'public'::regnamespace and prosrc like '%full_name%')
    -- 15 sécurité
    union all select '15_securite', 'fonctions guard_* / submit_contact_message', (select count(distinct proname) = 3 from f where proname in ('guard_application_insert','guard_registration_update','submit_contact_message'))
    union all select '15_securite', 'triggers applications_guard_insert / event_registrations_guard', (select count(*) = 2 from trg where tgname in ('applications_guard_insert','event_registrations_guard'))
    union all select '15_securite', 'secret public_forms présent', exists(select 1 from private.app_secrets where key = 'public_forms')
    union all select '15_securite', 'SVG refusés dans public-media', exists(select 1 from storage.buckets where id = 'public-media' and not ('image/svg+xml' = any(coalesce(allowed_mime_types, array['image/svg+xml']))))
    union all select '15_securite', 'member_directory en security_invoker = false', exists(select 1 from pg_class where oid = to_regclass('public.member_directory') and 'security_invoker=false' = any(coalesce(reloptions, '{}')))
    union all select '15_securite', 'submit_contact_message ouvert à anon', has_function_privilege('anon', (select min(oid) from pg_proc where proname = 'submit_contact_message' and pronamespace = 'public'::regnamespace), 'execute')
    -- 16 bureau LinkedIn
    union all select '16_bureau', 'colonne governance_members.linkedin_url', exists(select 1 from col where table_schema = 'public' and table_name = 'governance_members' and column_name = 'linkedin_url')
  )
select migration, controle, coalesce(ok, false) as ok
from checks
order by ok, migration;
