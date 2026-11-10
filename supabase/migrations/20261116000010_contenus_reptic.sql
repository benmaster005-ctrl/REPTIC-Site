-- =============================================================================
-- REPTIC.CM — Contenus repris de reptic.cm (relevé du 10 novembre 2026)
-- Les faits (dates, noms, objectifs, barème, procédure) sont ceux publiés sur
-- reptic.cm ; les textes sont REFORMULÉS et doivent être relus et validés par
-- l'association. Rejouable : chaque instruction met à jour ou remplace.
-- À exécuter dans le SQL Editor après les migrations 1 à 9.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Coordonnées
-- ---------------------------------------------------------------------------
update public.site_settings
   set value = jsonb_build_object(
         'address', 'Yaoundé, Cameroun',
         'phone', '+237 242 233 000',
         'email', 'contact@reptic.cm',
         'hours', 'Du lundi au vendredi, de 8 h 00 à 17 h 30',
         'dpo', 'dpo@reptic.cm'),
       updated_at = now()
 where key = 'contact';

-- ---------------------------------------------------------------------------
-- Familles d'acteurs : les 6 catégories de la nomenclature officielle
-- ---------------------------------------------------------------------------
update public.categories set is_active = false where kind = 'actor';

insert into public.categories (kind, slug, name, description, position, is_active) values
  ('actor', 'operateur-reseau', 'Opérateur de réseau de communication électronique',
   'Construit et exploite un réseau ouvert au public pour fournir des services de téléphonie ou d''accès à Internet.', 1, true),
  ('actor', 'operateur-infrastructure', 'Opérateur d''infrastructure ou d''interconnexion',
   'Met à disposition des infrastructures support ou des services d''interconnexion, sans fournir lui-même de service de communication au public.', 2, true),
  ('actor', 'fournisseur-services-communication', 'Fournisseur de services de communication électronique',
   'Commercialise des services de communication au public en s''appuyant sur le réseau d''un tiers.', 3, true),
  ('actor', 'fournisseur-sva', 'Fournisseur de services à valeur ajoutée',
   'Propose des services applicatifs ou de contenus diffusés par les réseaux publics, sans fournir de capacité de transmission.', 4, true),
  ('actor', 'operateur-plateforme', 'Opérateur de plateforme numérique',
   'Conçoit ou exploite une solution numérique (SaaS, sur site ou dans le cloud) dédiée à un domaine applicatif : FinTech, GovTech, HealthTech, e-commerce, médias…', 5, true),
  ('actor', 'services-conseil', 'Services & Conseil',
   'Accompagne les acteurs de l''écosystème : intégration, distribution, conseil, formation, cybersécurité, développement.', 6, true)
on conflict (kind, slug) do update set name = excluded.name, description = excluded.description, position = excluded.position, is_active = true;

-- Types de membres selon le règlement intérieur (les identifiants restent stables)
update public.categories set name = 'Membre associé (personne physique)',
       description = 'Professionnel camerounais dont l''activité relève du numérique ; cotisation individuelle.'
 where kind = 'member_type' and slug = 'personne-physique';
update public.categories set name = 'Membre actif (entreprise)',
       description = 'Entreprise ou établissement camerounais du secteur des télécoms, des TIC ou du numérique ; cotisation d''entreprise.'
 where kind = 'member_type' and slug = 'personne-morale';
insert into public.categories (kind, slug, name, description, position) values
  ('member_type', 'membre-honneur', 'Membre d''honneur', 'Personne physique proposée par le Bureau exécutif et adoptée par le Conseil ; dispensée de cotisation.', 3),
  ('member_type', 'membre-partenaire', 'Membre partenaire', 'Personne ou organisation liée à l''association par une convention de partenariat.', 4)
on conflict (kind, slug) do update set name = excluded.name, description = excluded.description;

-- Rubriques d'actualités utilisées sur reptic.cm
insert into public.categories (kind, slug, name, position) values
  ('news', 'evenement', 'Événement', 4),
  ('news', 'partenariat', 'Partenariat', 5)
on conflict (kind, slug) do nothing;

-- ---------------------------------------------------------------------------
-- Pièces justificatives (conditions d'adhésion publiées)
-- ---------------------------------------------------------------------------
delete from public.required_documents where applicant_type = 'physical' and key not in ('justificatif_fiscal', 'photo', 'cv');
delete from public.required_documents where applicant_type = 'legal' and key not in ('rccm', 'quitus_fiscal', 'document_legal', 'logo');
insert into public.required_documents (applicant_type, key, label, help, is_required, accepted_mime, position) values
  ('physical', 'justificatif_fiscal', 'Justificatif d''immatriculation fiscale', 'Preuve de votre inscription à un régime d''imposition (NIU ou attestation).', true, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 1),
  ('physical', 'photo', 'Photo', 'Photo d''identité récente, format JPEG ou PNG.', true, array['image/jpeg', 'image/png', 'image/webp'], 2),
  ('physical', 'cv', 'Curriculum vitae', 'Facultatif : présente votre expertise dans les télécoms ou le numérique.', false, array['application/pdf'], 3),
  ('legal', 'rccm', 'Registre du commerce (RCCM)', 'Extrait à jour.', true, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 1),
  ('legal', 'quitus_fiscal', 'Attestation de conformité fiscale (quitus)', 'En cours de validité.', true, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 2),
  ('legal', 'document_legal', 'Autre document légal', 'Facultatif : agrément, licence ou tout document exigé pour votre activité.', false, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 3),
  ('legal', 'logo', 'Logo', 'Facultatif, format image.', false, array['image/jpeg', 'image/png', 'image/webp'], 4)
on conflict (applicant_type, key) do update set label = excluded.label, help = excluded.help, is_required = excluded.is_required, accepted_mime = excluded.accepted_mime, position = excluded.position;

-- ---------------------------------------------------------------------------
-- Pages institutionnelles (textes reformulés, à faire valider)
-- ---------------------------------------------------------------------------
update public.pages set status = 'published', summary =
  'Le Réseau des Entreprises et Professionnels des Télécoms et du Numérique au Cameroun fédère, représente et accompagne les acteurs privés du numérique depuis 2017.',
  body = $md$
## Qui sommes-nous ?

Le REPTIC.CM est une association de droit camerounais, régie par la loi n° 90/053 du 19 décembre 1990 relative à la liberté d'association. Son assemblée constitutive s'est tenue le **11 mai 2017** à Yaoundé, où l'association a son siège.

Il rassemble les entreprises et les professionnels des télécommunications, des technologies de l'information et du numérique, pour porter d'une seule voix les intérêts du secteur privé.

## Notre mission

Fédérer, représenter et accompagner les acteurs privés du numérique camerounais : défendre leurs intérêts, stimuler l'innovation locale et contribuer à bâtir un écosystème numérique souverain.

## Ce que le réseau apporte à ses membres

- La mise en réseau entre entreprises et professionnels du secteur
- L'accès aux marchés et l'appui à la réponse aux appels d'offres
- Des formations sectorielles
- Une veille réglementaire
- Une représentation auprès des pouvoirs publics, des régulateurs et des partenaires internationaux

## Qui peut nous rejoindre ?

Trois grandes familles de profils sont éligibles :

- **Opérateurs et infrastructures** : opérateurs de réseaux, d'infrastructures et de datacenters, opérateurs de réseaux virtuels, fournisseurs d'accès à Internet, agrégateurs de services à valeur ajoutée, centres de contact.
- **Plateformes de services** : FinTech, GovTech, HealthTech, e-commerce, médias numériques, éditeurs de plateformes.
- **Services, conseil et formation** : prestataires informatiques, intégrateurs, distributeurs, agences digitales, cabinets de conseil, organismes de formation, ainsi que les professionnels individuels (consultants, développeurs, entrepreneurs, chercheurs, spécialistes de la cybersécurité).
$md$
 where slug = 'presentation';

update public.pages set status = 'published', summary =
  'Six objectifs stratégiques guident l''action du réseau au service des entreprises du numérique camerounais.',
  body = $md$
Le REPTIC.CM inscrit son action dans six objectifs stratégiques, de la formation des talents jusqu'à la transformation numérique des administrations. Ils fondent la feuille de route du Bureau exécutif.
$md$
 where slug = 'objectifs-missions';

update public.pages set status = 'published', summary =
  'Le message du Dr.-Ing. Pierre-François KAMANOU, Président du REPTIC.CM pour le mandat 2025-2028.',
  body = $md$
> Synthèse du message publié sur reptic.cm, à remplacer par le texte original du Président.

L'Assemblée générale extraordinaire du **12 juillet 2025** a ouvert une nouvelle étape pour le REPTIC.CM, avec une gouvernance, un règlement intérieur et une feuille de route renouvelés.

Pour le mandat **2025-2028**, en cohérence avec les recommandations des Rencontres économiques du GECAM 2025, le Bureau exécutif s'est fixé cinq axes prioritaires :

1. **Nouer des partenariats stratégiques**, au Cameroun et à l'international, pour renforcer l'influence du réseau.
2. **Faire de CAMTEL un hub national d'interconnexion multicanale**, au bénéfice des opérateurs locaux d'accès à Internet et de téléphonie fixe virtuelle.
3. **Obtenir un cadre réglementaire incitatif dans la commande publique** pour les PME Tech locales.
4. **Valoriser l'expertise des membres** comme levier de la transformation numérique des administrations et des entreprises.
5. **Contribuer à la régulation et à la réglementation du secteur**, en concertation avec les institutions nationales.

Ces priorités répondent à des besoins pressants : une stratégie numérique nationale alignée sur la SND30, un cadre légal lisible et l'accès des PME du numérique à la commande publique. Leur réussite repose sur la mobilisation de tous les membres (opérateurs, plateformes, startups, consultants) dans les commissions, les actions de plaidoyer et les formations.

**Dr.-Ing. Pierre-François KAMANOU**
Président du REPTIC.CM · Président-directeur général, GTS-Infotel Cameroon SA
$md$
 where slug = 'mot-du-president';

update public.pages set status = 'published', summary =
  'Catégories de membres, critères, procédure, pièces à fournir et barème des cotisations.',
  body = $md$
## Les catégories de membres

Selon l'article 2 du règlement intérieur :

- **Membre actif** : entreprise ou établissement camerounais (ou ayant un lien économique et juridique avec le Cameroun) exerçant dans les télécoms, les TIC ou le numérique. Il acquitte un droit d'entrée et une cotisation d'entreprise.
- **Membre associé** : personne physique camerounaise dont l'activité relève du numérique. Une personne étrangère peut être admise sur décision spéciale du Conseil. Il acquitte un droit d'entrée et une cotisation individuelle.
- **Membre d'honneur** : personne physique, notamment un ancien président, proposée par le Bureau exécutif et adoptée par le Conseil. Il est dispensé de cotisation.
- **Membre partenaire** : toute personne ou organisation signataire d'une convention de partenariat avec l'association.

## Qui est éligible ?

- **Entreprises** : relever d'au moins une des six familles de la nomenclature des acteurs du REPTIC.CM.
- **Professionnels** : adhérer aux objectifs de l'association, s'engager à participer à ses activités et justifier d'une expertise ou d'une expérience reconnue dans les télécoms ou le numérique.

## La procédure

1. Choisir son profil : personne physique ou personne morale.
2. Remplir le formulaire d'adhésion en ligne.
3. Déposer les pièces justificatives.
4. Le Bureau exécutif examine le dossier et rend sa décision **dans un délai d'un mois**.

## Les pièces à fournir

- **Personne physique** : justificatif d'immatriculation à un régime fiscal et photo.
- **Personne morale** : registre du commerce à jour, attestation de conformité fiscale (quitus) et tout autre document légal exigé.

## Les cotisations

L'adhésion devient définitive après le paiement du **droit d'entrée** (50 % de la cotisation annuelle, payé une seule fois, non remboursable) et de la **cotisation annuelle**.

| Membres actifs : chiffre d'affaires (FCFA) | Cotisation annuelle | Droit d'entrée |
|---|---|---|
| Moins de 100 millions | 100 000 | 50 000 |
| De 100 à 199,9 millions | 200 000 | 100 000 |
| De 200 à 499,9 millions | 500 000 | 250 000 |
| De 500 à 999,9 millions | 2 000 000 | 1 000 000 |
| 1 milliard et plus | 4 000 000 | 2 000 000 |
| Membre actif de la diaspora | 200 000 | 100 000 |
| **Membre associé** | **100 000** | **50 000** |

> Barème repris de reptic.cm : à confirmer par le secrétariat avant publication.
$md$
 where slug = 'conditions-adhesion';

update public.pages set status = 'published', summary = null, body = $md$
## Éditeur

**REPTIC.CM** · Réseau des Entreprises et Professionnels des Télécoms et du Numérique au Cameroun
Association régie par la loi n° 90/053 du 19 décembre 1990, créée le 11 mai 2017 à Yaoundé.
Siège : Yaoundé, Cameroun · contact@reptic.cm · +237 242 233 000

**Directeur de la publication** : Dr.-Ing. Pierre-François KAMANOU, Président.

## Hébergement

Le site est hébergé par Vercel Inc. (application) et Supabase (base de données et fichiers). *Adresses exactes des hébergeurs à compléter.*

## Propriété intellectuelle

Les textes, images, logos et éléments graphiques du site appartiennent au REPTIC.CM ou à ses partenaires. Toute reproduction ou diffusion sans autorisation écrite préalable est interdite.

## Responsabilité

Le REPTIC.CM veille à l'exactitude des informations publiées et peut les corriger à tout moment. Il ne saurait être tenu responsable des contenus des sites externes vers lesquels le site renvoie.

## Données personnelles

Voir la [politique de confidentialité](/confidentialite). Pour exercer vos droits : dpo@reptic.cm.
$md$
 where slug = 'mentions-legales';

update public.pages set status = 'published', summary = 'Comment le REPTIC.CM collecte, utilise et protège vos données personnelles.', body = $md$
## Responsable du traitement

Le REPTIC.CM, association régie par la loi n° 90/053 du 19 décembre 1990, dont le siège est à Yaoundé. Contact du délégué à la protection des données : **dpo@reptic.cm**.

## Les données que nous traitons

- **Formulaire de contact** : nom, e-mail, téléphone, message.
- **Demande d'adhésion d'une personne physique** : identité, profession, coordonnées, expérience, justificatifs, photo.
- **Demande d'adhésion d'une personne morale** : raison sociale, forme juridique, coordonnées, représentant légal, justificatifs, logo.
- **Espace membre** : profil, préférences, historique de connexion, inscriptions aux événements, paiements de cotisation.
- **Données techniques** : adresse IP et informations de navigation nécessaires à la sécurité du site.

## Pourquoi nous les utilisons

Instruire les adhésions, répondre aux messages, envoyer la lettre d'information (avec votre consentement), gérer les cotisations et leurs confirmations, assurer la sécurité du site et prévenir la fraude.

## Durées de conservation

- Données d'adhésion : pendant l'adhésion, puis 3 ans après sa fin, sauf obligation légale.
- Messages de contact : 2 ans.
- Données de navigation : 13 mois au maximum.

## Vos droits

Vous disposez d'un droit d'accès, de rectification, de suppression, d'opposition et de portabilité. Écrivez à **dpo@reptic.cm**. Vous pouvez vous désinscrire de la lettre d'information à tout moment grâce au lien présent dans chaque envoi.

## Cookies

Le site n'utilise que des cookies indispensables à son fonctionnement (session de connexion, sécurité). Aucun cookie publicitaire.

## Modifications

Toute modification importante de cette politique est signalée aux membres par e-mail.
$md$
 where slug = 'confidentialite';

-- ---------------------------------------------------------------------------
-- Bureau exécutif (22 membres publiés sur reptic.cm)
-- ---------------------------------------------------------------------------
delete from public.governance_members where full_name = 'À renseigner';

insert into public.governance_members (full_name, position_title, organization, sort_order, is_published)
select v.full_name, v.position_title, v.organization, v.sort_order, true
  from (values
    ('Dr.-Ing. Pierre-François KAMANOU', 'Président', 'GTS-Infotel Cameroon', 1),
    ('Anthony SAME', '1er Vice-Président', 'ST DIGITAL', 2),
    ('Mme Horore BELL BEBGA', '2e Vice-Présidente', 'AFRICA WITS', 3),
    ('Jordan TCHOKONTE', '3e Vice-Président, Réglementation et Régulation', 'ICCSOFT', 4),
    ('Dr Soka Armelle PEYOU', 'Secrétaire générale', null, 5),
    ('Beaugas-Orain DJOYUM', 'Secrétaire général adjoint', 'ICTMedia', 6),
    ('Ernest Aimé DJATCHEU NZALI', 'Trésorier', null, 7),
    ('Nelly CHATUE-DIOP', 'Présidente, Commission E-Government', 'EJARA', 8),
    ('Jéhu NDOUMI', 'Président, Commission Financements structurés & FinTech', 'YUNUS GROUP', 9),
    ('Mme Rosine EKAMBI', 'Présidente, Commission Partenariats institutionnels', 'SUITCH', 10),
    ('Abdou MFOPA', 'Président, Commission Communication numérique', 'CAM-ONE', 11),
    ('Ayuk ETTA', 'Président, Commission Développement des startups', 'Mountain Hub', 12),
    ('Dr Gérard EYOUM', 'Président, Commission Partenariats avec les organisations professionnelles', 'CYBERIX', 13),
    ('Dr Mbang SAMA', 'Vice-Président, Commission PME Tech & Labellisation', 'Digit-Tech-Innov Solutions', 14),
    ('Epanty MBANDA', 'Vice-Président, Commission Réglementation et Régulation', '4M LEGAL&TAX', 15),
    ('Fidel MOLE', 'Vice-Président, Commission Communication numérique', 'KIAMA', 16),
    ('Philippe NKOUAYA', 'Vice-Président, Commission Développement des startups', 'PhilJohn Tech', 17),
    ('Serge Armel DJIJOU', 'Rapporteur, Commission PME Tech & Labellisation', 'AUI TECH', 18),
    ('Olivier DJABA', 'Représentant de l''antenne de Douala, Rapporteur de la Commission Financements structurés & FinTech', null, 19),
    ('Antoine Anatole NKOLO BIYIDI', 'Président, Comité d''éthique et de bonne gouvernance', null, 20),
    ('Jean Gallo JIOTSA', 'Membre, Comité d''éthique', 'ADSNET', 21),
    ('Jean-Guy WANDJI', 'Membre, Comité d''éthique', 'ORAFRIC', 22)
  ) as v(full_name, position_title, organization, sort_order)
 where not exists (select 1 from public.governance_members g where g.full_name = v.full_name);

-- ---------------------------------------------------------------------------
-- Actualités publiées sur reptic.cm (textes courts reformulés, à compléter)
-- ---------------------------------------------------------------------------
-- Les contenus de démonstration sont retirés de la vitrine.
update public.news set status = 'archived' where slug = 'lancement-du-nouveau-portail';
update public.events set status = 'archived' where slug = 'forum-numerique-2027';

insert into public.news (slug, title, excerpt, body, status, visibility, published_at, category_id, notified_at)
select v.slug, v.title, v.excerpt, v.body, 'published', 'public', v.published_at::timestamptz,
       (select id from public.categories where kind = 'news' and slug = v.cat), now()
  from (values
    ('forum-de-l-economie-numerique-en-afrique-centrale',
     'Forum de l''Économie Numérique en Afrique Centrale',
     'Le Bureau exécutif du REPTIC.CM a porté la voix des PME locales du numérique lors de ce rendez-vous régional.',
     $md$Lors du Forum de l'Économie Numérique en Afrique Centrale, le Bureau exécutif du REPTIC.CM a plaidé pour une meilleure prise en compte des petites et moyennes entreprises locales du numérique.

> Article à compléter : lieu, intervenants et principaux messages.$md$,
     '2026-03-15 09:00:00+01', 'evenement'),
    ('convention-avec-les-universites-technologiques-de-yaounde',
     'Convention avec les universités technologiques de Yaoundé',
     'Un programme de mentorat pour rapprocher la formation des besoins des entreprises du numérique.',
     $md$Le REPTIC.CM a conclu un partenariat avec des universités technologiques de Yaoundé. Il prévoit un programme de mentorat destiné à rapprocher les étudiants des réalités et des besoins des entreprises du secteur.

> Article à compléter : établissements signataires, modalités du programme.$md$,
     '2026-02-02 09:00:00+01', 'partenariat'),
    ('label-cameroon-tech-excellence-officiellement-lance',
     'Label « Cameroon Tech Excellence » officiellement lancé',
     'Un label pour distinguer les entreprises membres qui répondent à des exigences de sécurité, de qualité et d''innovation.',
     $md$Le REPTIC.CM a lancé le label « Cameroon Tech Excellence ». Il distinguera les entreprises membres qui respectent des standards élevés de sécurité, de qualité et d'innovation, dans la droite ligne de l'objectif « Excellence & Qualité nationale » de l'association.

> Article à compléter : critères, calendrier et modalités de candidature.$md$,
     '2026-01-18 09:00:00+01', 'communiques')
  ) as v(slug, title, excerpt, body, published_at, cat)
on conflict (slug) do nothing;
