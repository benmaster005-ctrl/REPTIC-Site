# Modèles d'e-mails Supabase (authentification)

Générés par `node scripts/email-templates.mjs` à partir de `src/lib/email/layout.ts` : ne pas les modifier à la main.

Dans le tableau de bord Supabase : **Authentication > Emails > Templates**. Pour chaque modèle, coller le **sujet** puis le contenu du fichier (onglet *Source*).

| Modèle Supabase | Sujet | Fichier |
|---|---|---|
| Confirm signup | Confirmez votre adresse e-mail | REPTIC.CM | `confirmation.html` |
| Reset password | Réinitialisation de votre mot de passe | REPTIC.CM | `recovery.html` |
| Invite user | Votre invitation à rejoindre REPTIC.CM | `invite.html` |
| Magic link | Votre lien de connexion | REPTIC.CM | `magic_link.html` |
| Change email address | Confirmez votre nouvelle adresse e-mail | REPTIC.CM | `email_change.html` |
| Reauthentication | Votre code de vérification | REPTIC.CM | `reauthentication.html` |

Réglages liés :
- **Authentication > URL Configuration > Site URL** : l'adresse réelle du site (aperçu Vercel, puis https://reptic.cm). Les liens des e-mails pointent vers `{{ .SiteURL }}/auth/callback`.
- **Authentication > SMTP Settings** : un serveur d'envoi pour expédier depuis `noreply@reptic.cm` avec le nom « REPTIC.CM ».
- **Durée des liens** (Email OTP Expiration) : 3600 s par défaut, ce que disent les textes (« une heure »).
