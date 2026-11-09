-- =============================================================================
-- REPTIC.CM — E-mails transactionnels du site (cahier des charges §4.4)
-- Sujet et texte de chaque e-mail sont modifiables depuis le back-office
-- (Administration > E-mails). La mise en page (charte REPTIC) est appliquée
-- par le site ; les variables {{prenom}}, {{reference}}… sont remplacées à l'envoi.
-- À exécuter dans le SQL Editor après les migrations 1 à 5.
-- =============================================================================

alter table public.email_templates
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists variables text[] not null default '{}',
  add column if not exists position int not null default 0,
  add column if not exists updated_by uuid references public.profiles(id);

-- Les textes ne sont pas confidentiels : le site doit pouvoir les lire pour
-- envoyer un e-mail, quel que soit l'utilisateur à l'origine de l'action.
create policy "email_templates: lecture" on public.email_templates for select to anon, authenticated using (true);

insert into public.email_templates (key, name, description, variables, position, subject, body) values
(
  'application.submitted', 'Accusé de réception', 'Envoyé au candidat dès l''envoi de son dossier.',
  array['prenom', 'reference', 'type'], 1,
  'Votre demande d''adhésion {{reference}} a bien été reçue',
  E'Bonjour {{prenom}},\n\nNous avons bien reçu votre demande d''adhésion au Réseau des Entreprises & Professionnels du Secteur des Télécoms et du Numérique au Cameroun. Merci de la confiance que vous accordez au réseau.\n\nVotre dossier va être examiné par le secrétariat. Vous serez informé par e-mail à chaque étape de son instruction, et vous pouvez suivre son avancement à tout moment depuis votre espace.'
),
(
  'application.additional_info', 'Complément demandé', 'Envoyé quand le secrétariat demande des informations ou des pièces supplémentaires.',
  array['prenom', 'reference', 'motif'], 2,
  'Complément requis pour votre demande {{reference}}',
  E'Bonjour {{prenom}},\n\nL''examen de votre demande d''adhésion est en cours. Pour la poursuivre, le secrétariat a besoin des éléments suivants :\n\n{{motif}}\n\nVotre dossier est à nouveau modifiable depuis votre espace : complétez-le, puis renvoyez-le. L''instruction reprendra dès réception.'
),
(
  'application.accepted', 'Adhésion acceptée', 'Envoyé au nouveau membre quand son adhésion est acceptée.',
  array['prenom', 'reference', 'numero', 'date_fin'], 3,
  'Bienvenue au REPTIC.CM : votre adhésion est acceptée',
  E'Bonjour {{prenom}},\n\nNous avons le plaisir de vous informer que votre demande d''adhésion a été acceptée. Bienvenue dans le Réseau des Entreprises & Professionnels du Secteur des Télécoms et du Numérique au Cameroun.\n\nVotre espace membre est désormais actif : vous y trouverez les actualités et documents réservés, l''annuaire des membres et l''agenda des événements du réseau.\n\nNous nous réjouissons de vous compter parmi nous.'
),
(
  'application.rejected', 'Demande non retenue', 'Envoyé au candidat quand sa demande est refusée.',
  array['prenom', 'reference', 'motif'], 4,
  'Votre demande d''adhésion {{reference}}',
  E'Bonjour {{prenom}},\n\nNous vous remercions de l''intérêt que vous portez au réseau. Après examen attentif de votre dossier, nous ne sommes pas en mesure de donner une suite favorable à votre demande d''adhésion.\n\n{{motif}}\n\nPour toute question, le secrétariat reste à votre disposition. Vous pourrez, le cas échéant, déposer une nouvelle demande depuis votre espace.'
),
(
  'member.suspended', 'Compte suspendu', 'Envoyé au membre quand son compte est suspendu.',
  array['prenom', 'numero', 'motif'], 5,
  'Votre compte REPTIC.CM est suspendu',
  E'Bonjour {{prenom}},\n\nNous vous informons que votre compte membre a été suspendu. L''accès aux contenus et services réservés aux membres est interrompu pendant la durée de la suspension.\n\n{{motif}}\n\nPour en savoir plus ou régulariser votre situation, contactez le secrétariat.'
),
(
  'member.reactivated', 'Compte réactivé', 'Envoyé au membre quand son compte est réactivé.',
  array['prenom', 'numero'], 6,
  'Votre compte REPTIC.CM est de nouveau actif',
  E'Bonjour {{prenom}},\n\nBonne nouvelle : votre compte membre est de nouveau actif. Vous retrouvez dès à présent l''accès à l''ensemble des services du réseau depuis votre espace.'
),
(
  'event.registered', 'Inscription à un événement', 'Confirmation envoyée au membre après son inscription à un événement.',
  array['prenom', 'evenement', 'date', 'lieu', 'statut'], 7,
  'Inscription confirmée : {{evenement}}',
  E'Bonjour {{prenom}},\n\nVotre inscription est bien enregistrée. Nous vous remercions et serons ravis de vous accueillir.\n\nVous pouvez consulter le programme et gérer votre inscription depuis votre espace. En cas d''empêchement, merci d''annuler votre inscription afin de libérer votre place.'
),
(
  'contact.received', 'Nouveau message de contact (secrétariat)', 'Alerte interne envoyée à l''adresse du secrétariat à chaque message du formulaire de contact.',
  array['nom', 'email', 'telephone', 'objet', 'message'], 8,
  'Nouveau message de contact : {{objet}}',
  E'Un nouveau message a été envoyé depuis le formulaire de contact du site.\n\n{{message}}\n\nRépondez directement à cet e-mail pour écrire à l''expéditeur.'
)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  variables = excluded.variables,
  position = excluded.position,
  subject = excluded.subject,
  body = excluded.body;
