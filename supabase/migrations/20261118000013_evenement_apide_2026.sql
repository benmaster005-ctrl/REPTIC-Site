-- ---------------------------------------------------------------------------
-- Événement : APIDE 2026 Special Edition Cameroun (Douala, 9 et 10 novembre 2026)
-- Organisé par One Africa Forums ; le REPTIC.CM intervient au panel 2.
-- Contenu reformulé d'après le programme officiel (version 2).
-- Ré-exécutable : la catégorie et l'événement sont mis à jour s'ils existent.
--
-- Publication directe en base : le déclencheur renseigne notified_at, aucune
-- alerte e-mail n'est envoyée aux membres (l'envoi passe par le back-office).
-- ---------------------------------------------------------------------------

insert into public.categories (kind, slug, name, position)
values ('event', 'forum', 'Forum', 1)
on conflict (kind, slug) do update set name = excluded.name, is_active = true;

insert into public.events (
  slug, title, excerpt, body, cover_path, category_id,
  starts_at, ends_at, location_name, address, city,
  status, visibility, registration_enabled
)
values (
  'apide-2026-douala',
  'APIDE 2026 Special Edition Cameroun : les paiements, catalyseurs de la finance digitale',
  'Deux jours à Douala autour du paiement digital, de l''identité numérique et de la cybersécurité. Le REPTIC.CM intervient sur l''identité numérique et l''e-gouvernement.',
  $md$
L'**Africa Pay & ID Expo (APIDE)**, organisée par One Africa Forums, pose ses valises à Douala pour une édition spéciale consacrée au Cameroun. Régulateurs, banques, fintechs et opérateurs télécoms y débattent de trois chantiers : **le paiement digital, l'identité numérique et l'e-gouvernement, la cybersécurité**.

Au programme : plus de 250 participants, 25 intervenants et une centaine de rendez-vous d'affaires (B2B).

## Le REPTIC.CM au panel 2

Le **Dr Pierre-François Kamanou**, pour le REPTIC.CM, intervient le **10 novembre de 11 h 30 à 12 h 30** au panel consacré à l'identité numérique et à l'e-gouvernement au Cameroun, aux côtés notamment de l'ANTIC, de l'ART, de la CNPS et de la DGSN.

## Programme

### Lundi 9 novembre

| Horaire | Séquence |
|---|---|
| 18 h 00 | Soirée d'ouverture et cocktail de networking. Keynote : banques camerounaises et finance digitale (Pierre Kam, APECCAM) |

### Mardi 10 novembre

| Horaire | Séquence |
|---|---|
| 08 h 30 | Accueil des participants |
| 09 h 00 | Mots de bienvenue et allocution d'ouverture (One Africa Forums, S2M, BEAC) |
| 09 h 30 | Keynote : l'interopérabilité des paiements en zone CEMAC et son modèle économique (GIMAC) |
| 10 h 00 | Panel 1 : SYSTAC 2 et supervision des paiements en zone CEMAC, quelle feuille de route réglementaire ? |
| 11 h 30 | **Panel 2 : identité numérique et e-gouvernement, l'État comme premier client du digital (avec le REPTIC.CM)** |
| 12 h 30 | Déjeuner de networking |
| 14 h 00 | Innovation Talks : l'avenir du paiement en Afrique (S2M), cyber-résilience (DataProtect), gouvernance de l'identité et protection des données à l'ère de l'IA (TECHSO GROUP) |
| 15 h 30 | Panel 3 : cybersécurité et fraude dans les paiements mobiles |
| 19 h 00 | Cocktail dînatoire de clôture (sur invitation) |

L'après-midi, un espace de rendez-vous B2B accueille des rencontres ciblées entre décideurs.

## Informations pratiques

- **Lieu** : Krystal Palace, Douala
- **Organisateur** : One Africa Forums
- **Inscription** : auprès des organisateurs (coordonnées dans le programme)

[Télécharger le programme complet (PDF)](/documents/programme-apide-2026-douala.pdf)
$md$,
  '/images/reptic/evenements/apide-2026-douala.webp',
  (select id from public.categories where kind = 'event' and slug = 'forum'),
  '2026-11-09 18:00:00+01',
  '2026-11-10 21:00:00+01',
  'Krystal Palace',
  null,
  'Douala',
  'published',
  'public',
  false
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  cover_path = excluded.cover_path,
  category_id = excluded.category_id,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  location_name = excluded.location_name,
  city = excluded.city,
  status = excluded.status,
  visibility = excluded.visibility,
  registration_enabled = excluded.registration_enabled;
