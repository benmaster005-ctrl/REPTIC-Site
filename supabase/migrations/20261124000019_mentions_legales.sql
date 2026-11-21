-- =============================================================================
-- REPTIC.CM — Mise à jour des mentions légales et de la politique de confidentialité
--
-- Le site est en ligne sur reptic.cm et auto-hébergé sur le serveur du REPTIC.CM
-- (application et Supabase). Ajouts : crédits de la revue de presse
-- (Digital Business Africa), services tiers réellement utilisés (reCAPTCHA,
-- connexion Google et LinkedIn, envoi d'e-mails), invitations d'équipe.
-- Remplace le texte des deux pages : à rejouer seulement si elles n'ont pas été
-- modifiées depuis l'administration. Rejouable.
-- =============================================================================

update public.pages set status = 'published', summary = null, body = $md$
## Éditeur

Le site **reptic.cm** est édité par le **REPTIC.CM**, Réseau des Entreprises et Professionnels des Télécoms et du Numérique au Cameroun.
Association régie par la loi n° 90/053 du 19 décembre 1990, créée le 11 mai 2017 à Yaoundé.
Siège : Yaoundé, Cameroun · contact@reptic.cm · +237 242 233 000

**Directeur de la publication** : Dr.-Ing. Pierre-François KAMANOU, Président.

## Hébergement

Le site, sa base de données et les fichiers déposés (justificatifs, documents, images) sont hébergés sur un serveur administré par le REPTIC.CM. Contact technique : contact@reptic.cm.

Les e-mails du site (confirmations, notifications, lettre d'information) sont envoyés par le serveur de messagerie du REPTIC.CM.

## Crédits

- **Revue de presse** : les articles et leurs photos sont publiés par [Digital Business Africa](https://www.digitalbusiness.africa), partenaire du REPTIC.CM. Ils restent la propriété de leur éditeur ; chaque fiche renvoie vers l'article original.
- **Actualités LinkedIn** : les publications affichées proviennent de la page LinkedIn officielle du REPTIC.CM.
- **Photos du bureau et des événements** : REPTIC.CM.

## Propriété intellectuelle

Les textes, images, logos et éléments graphiques du site appartiennent au REPTIC.CM ou à ses partenaires. Toute reproduction ou diffusion sans autorisation écrite préalable est interdite.

## Responsabilité

Le REPTIC.CM veille à l'exactitude des informations publiées et peut les corriger à tout moment. Il ne saurait être tenu responsable des contenus des sites externes vers lesquels le site renvoie.

## Données personnelles

Voir la [politique de confidentialité](/confidentialite). Pour exercer vos droits : dpo@reptic.cm.

*Dernière mise à jour : 21 novembre 2026.*
$md$
 where slug = 'mentions-legales';

update public.pages set status = 'published', summary = 'Comment le REPTIC.CM collecte, utilise et protège vos données personnelles.', body = $md$
## Responsable du traitement

Le REPTIC.CM, association régie par la loi n° 90/053 du 19 décembre 1990, dont le siège est à Yaoundé. Contact du délégué à la protection des données : **dpo@reptic.cm**.

## Les données que nous traitons

- **Formulaire de contact** : nom, e-mail, téléphone, message.
- **Lettre d'information** : adresse e-mail et date de votre consentement.
- **Demande d'adhésion d'une personne physique** : identité, profession, coordonnées, expérience, justificatifs, photo.
- **Demande d'adhésion d'une personne morale** : raison sociale, forme juridique, coordonnées, représentant légal, justificatifs, logo.
- **Compte et espace membre** : profil, préférences, historique de connexion, inscriptions aux événements, paiements de cotisation.
- **Invitations à l'équipe** : adresse e-mail de la personne invitée, rôle proposé, auteur et date de l'invitation.
- **Données techniques** : adresse IP et informations de navigation nécessaires à la sécurité du site.

## Pourquoi nous les utilisons

Instruire les adhésions, répondre aux messages, envoyer la lettre d'information (avec votre consentement), gérer les comptes, les accès à l'administration et les cotisations, assurer la sécurité du site et prévenir la fraude.

## Où elles sont conservées

Les données sont hébergées sur le serveur du REPTIC.CM. Elles ne sont ni vendues ni louées. Seules les personnes habilitées de l'équipe y ont accès, selon leur rôle, et les actions sensibles sont journalisées.

## Services tiers

- **Google reCAPTCHA** protège les formulaires (contact, lettre d'information, connexion, inscription) contre les robots. Il est chargé uniquement sur les pages qui contiennent ces formulaires et transmet à Google des informations techniques sur votre navigation ([règles de confidentialité de Google](https://policies.google.com/privacy)).
- **Connexion avec Google ou LinkedIn** : si vous choisissez cette option, le service concerné nous transmet votre nom, votre adresse e-mail et, le cas échéant, votre photo de profil. Rien n'est publié en votre nom.

## Durées de conservation

- Données d'adhésion : pendant l'adhésion, puis 3 ans après sa fin, sauf obligation légale.
- Messages de contact : 2 ans.
- Données de navigation : 13 mois au maximum.

## Vos droits

Vous disposez d'un droit d'accès, de rectification, de suppression, d'opposition et de portabilité. Écrivez à **dpo@reptic.cm**. Vous pouvez vous désinscrire de la lettre d'information à tout moment grâce au lien présent dans chaque envoi.

## Cookies et stockage local

- **Cookies indispensables** : session de connexion et sécurité. Ils ne nécessitent pas de consentement.
- **Google reCAPTCHA** peut déposer ses propres cookies sur les pages qui contiennent un formulaire.
- **Préférence d'affichage** : dans l'espace membre, l'état du menu (réduit ou non) est mémorisé dans votre navigateur.

Aucun cookie publicitaire ni outil de mesure d'audience n'est utilisé.

## Modifications

Toute modification importante de cette politique est signalée aux membres par e-mail.

*Dernière mise à jour : 21 novembre 2026.*
$md$
 where slug = 'confidentialite';
