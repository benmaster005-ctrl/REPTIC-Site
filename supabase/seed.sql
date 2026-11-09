-- =============================================================================
-- REPTIC.CM — Données de référence
-- Les contenus éditoriaux ci-dessous sont des textes de démonstration :
-- ils doivent être remplacés par les contenus validés du commanditaire (§10).
-- =============================================================================

-- Rôles ----------------------------------------------------------------------
insert into public.roles (key, label, description, rank) values
  ('candidate', 'Candidat',       'Compte créé pour déposer et suivre une demande d''adhésion', 0),
  ('member',    'Membre',         'Membre dont l''adhésion a été validée', 10),
  ('editor',    'Éditeur',        'Publie les actualités, événements et pages', 20),
  ('manager',   'Gestionnaire',   'Instruit les demandes et gère les membres', 30),
  ('admin',     'Administrateur', 'Accès complet : comptes, rôles, paramètres', 100)
on conflict (key) do nothing;

-- Permissions ---------------------------------------------------------------
insert into public.permissions (key, description) values
  ('applications.read',   'Consulter les demandes d''adhésion et leurs pièces'),
  ('applications.review', 'Instruire les demandes : examen, complément, décision'),
  ('members.read',        'Consulter les fiches membres'),
  ('members.manage',      'Créer, corriger, suspendre, réactiver ou archiver un membre'),
  ('members.export',      'Exporter la liste des membres'),
  ('documents.manage',    'Gérer les documents privés et associatifs'),
  ('content.manage',      'Gérer pages, menus, actualités, médias et catégories'),
  ('events.manage',       'Gérer les événements et les inscriptions'),
  ('contact.manage',      'Traiter les messages de contact et la newsletter'),
  ('users.manage',        'Créer, désactiver les comptes et attribuer les rôles'),
  ('roles.manage',        'Modifier les rôles et permissions'),
  ('settings.manage',     'Modifier les paramètres et modèles d''e-mails'),
  ('audit.read',          'Consulter le journal des opérations sensibles'),
  ('stats.read',          'Consulter les indicateurs du tableau de bord')
on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('editor',  'content.manage'), ('editor', 'events.manage'), ('editor', 'stats.read'),
  ('manager', 'applications.read'), ('manager', 'applications.review'),
  ('manager', 'members.read'), ('manager', 'members.manage'), ('manager', 'members.export'),
  ('manager', 'documents.manage'), ('manager', 'events.manage'), ('manager', 'contact.manage'),
  ('manager', 'stats.read')
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
  select 'admin', key from public.permissions
on conflict do nothing;

-- Catégories : familles d'acteurs ------------------------------------------
insert into public.categories (kind, slug, name, description, position) values
  ('actor', 'operateurs-telecoms',      'Opérateurs télécoms',              'Opérateurs de réseaux et de services de communications électroniques.', 1),
  ('actor', 'fournisseurs-infrastructures', 'Fournisseurs d''infrastructures', 'Fibre, tours, datacenters, énergie et équipements réseau.', 2),
  ('actor', 'editeurs-logiciels',       'Éditeurs de logiciels',            'Conception et commercialisation de solutions logicielles.', 3),
  ('actor', 'esn',                      'Entreprises de services numériques', 'Intégration, infogérance, développement et maintenance.', 4),
  ('actor', 'agences-digitales',        'Agences digitales',                'Communication numérique, web, marketing et contenus.', 5),
  ('actor', 'cabinets-conseil',         'Cabinets de conseil',              'Conseil en stratégie, transformation numérique et cybersécurité.', 6),
  ('actor', 'organismes-formation',     'Organismes de formation',          'Formation initiale et continue aux métiers du numérique.', 7)
on conflict (kind, slug) do nothing;

-- Catégories : types de membres --------------------------------------------
insert into public.categories (kind, slug, name, description, position) values
  ('member_type', 'personne-physique', 'Membre individuel', 'Professionnels indépendants, consultants et experts du numérique.', 1),
  ('member_type', 'personne-morale',   'Membre entreprise', 'Entreprises, startups et associations du secteur numérique.', 2)
on conflict (kind, slug) do nothing;

insert into public.categories (kind, slug, name, position) values
  ('news', 'communiques', 'Communiqués', 1),
  ('news', 'vie-du-reseau', 'Vie du réseau', 2),
  ('news', 'secteur', 'Secteur numérique', 3),
  ('event', 'forum', 'Forum', 1),
  ('event', 'atelier', 'Atelier', 2),
  ('event', 'assemblee', 'Assemblée', 3)
on conflict (kind, slug) do nothing;

-- Pages institutionnelles (textes provisoires) -----------------------------
insert into public.pages (slug, title, summary, body, status) values
('presentation', 'Présentation',
 'Une association professionnelle qui fédère les entreprises des télécoms, des TIC et du numérique au Cameroun.',
 E'## Qui sommes-nous ?\n\nREPTIC.CM rassemble les entreprises et les professionnels des télécommunications, des technologies de l''information et du numérique au Cameroun.\n\n## Notre vision\n\nUn écosystème numérique camerounais structuré, compétitif et reconnu, capable de porter la transformation digitale du pays.\n\n## Nos valeurs\n\n- **Solidarité** entre les acteurs du secteur\n- **Excellence** et qualité des services\n- **Intégrité** et transparence\n- **Innovation** au service du développement\n\n> Texte provisoire — à remplacer par le contenu validé par l''association.',
 'published'),
('objectifs-missions', 'Objectifs & missions',
 'Six axes d''action pour structurer et faire grandir le secteur numérique camerounais.',
 E'Texte d''introduction à fournir par l''association.',
 'published'),
('mot-du-president', 'Mot du Président',
 'Le message institutionnel du Président de l''association.',
 E'Le message du Président sera publié ici après validation.\n\n> Texte provisoire.',
 'published'),
('conditions-adhesion', 'Conditions d''adhésion',
 'Qui peut adhérer, avantages et pièces à fournir.',
 E'Les conditions détaillées d''adhésion seront publiées après validation du règlement intérieur.',
 'published'),
('mentions-legales', 'Mentions légales', null,
 E'Éditeur, hébergeur et directeur de la publication : informations à fournir.', 'published'),
('confidentialite', 'Politique de confidentialité', null,
 E'Politique de confidentialité, finalités, durées de conservation et droits des personnes : à rédiger avec le responsable des données.', 'published')
on conflict (slug) do nothing;

-- Chiffres clés (à valider) ------------------------------------------------
insert into public.key_figures (label, value, sort_order) values
  ('Année de création', '2017', 1),
  ('Membres', '100+', 2),
  ('Secteurs représentés', '21', 3),
  ('Forums organisés', '5+', 4);

-- Bureau exécutif (postes, noms à renseigner) -----------------------------
insert into public.governance_members (full_name, position_title, sort_order) values
  ('À renseigner', 'Président', 1),
  ('À renseigner', 'Vice-président', 2),
  ('À renseigner', 'Secrétaire général', 3),
  ('À renseigner', 'Trésorier', 4);

-- Paramètres du site --------------------------------------------------------
insert into public.site_settings (key, value) values
  ('contact', '{"address": "Yaoundé, Cameroun", "phone": "+237 242 233 000", "email": "contact@reptic.cm"}'),
  ('social', '{"facebook": "https://web.facebook.com/reptic.cm", "twitter": "https://twitter.com/Reptic_Cameroun"}')
on conflict (key) do nothing;

-- Modèles d'e-mails --------------------------------------------------------
insert into public.email_templates (key, subject, body) values
  ('application.submitted', 'Votre demande d''adhésion {{reference}} a bien été reçue',
   E'Bonjour {{prenom}},\n\nNous avons bien reçu votre demande d''adhésion ({{reference}}). Vous pouvez suivre son avancement depuis votre espace.\n\nL''équipe REPTIC.CM'),
  ('application.additional_info', 'Complément requis pour votre demande {{reference}}',
   E'Bonjour {{prenom}},\n\nVotre dossier nécessite un complément :\n\n{{motif}}\n\nConnectez-vous à votre espace pour le compléter.'),
  ('application.accepted', 'Bienvenue au REPTIC.CM',
   E'Bonjour {{prenom}},\n\nVotre demande d''adhésion a été acceptée. Votre espace membre est désormais actif.'),
  ('application.rejected', 'Votre demande d''adhésion {{reference}}',
   E'Bonjour {{prenom}},\n\nAprès examen, votre demande n''a pas pu être retenue.\n\n{{motif}}')
on conflict (key) do nothing;

-- Actualités et événements de démonstration ------------------------------
insert into public.news (slug, title, excerpt, body, status, visibility, published_at, category_id)
select 'lancement-du-nouveau-portail', 'Lancement du nouveau portail REPTIC.CM',
  'Le réseau se dote d''une plateforme pour simplifier les adhésions et mieux informer ses membres.',
  E'Le nouveau portail permet de déposer une demande d''adhésion en ligne, de suivre son dossier et d''accéder à un espace membre.\n\n> Article de démonstration.',
  'published', 'public', now() - interval '2 days', id
from public.categories where kind = 'news' and slug = 'vie-du-reseau'
on conflict (slug) do nothing;

insert into public.events (slug, title, excerpt, body, starts_at, ends_at, location_name, city, status, visibility, category_id)
select 'forum-numerique-2027', 'Forum du numérique camerounais 2027',
  'Rencontre annuelle des acteurs des télécoms, des TIC et du numérique.',
  E'Programme détaillé à venir.\n\n> Événement de démonstration.',
  now() + interval '60 days', now() + interval '61 days', 'Lieu à confirmer', 'Yaoundé', 'published', 'public', id
from public.categories where kind = 'event' and slug = 'forum'
on conflict (slug) do nothing;
