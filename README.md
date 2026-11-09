# Portail REPTIC.CM

Portail institutionnel avec espace membre et gestion des adhésions : **Next.js 16.4** (App Router, Cache Components), **Supabase** (Postgres, Auth, Storage, RLS), **Tailwind CSS v4**, **zod**.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner l'URL et la clé anon Supabase
npm run dev
```

Sans `.env.local`, le site tourne en **mode démonstration** : il affiche les contenus de repli de `src/content/site.ts` et un bandeau d'avertissement.

## Base de données

1. Créer un projet sur supabase.com.
2. Dans le **SQL Editor**, exécuter dans l'ordre :
   - `supabase/migrations/20261109000001_schema.sql` : tables, types, triggers (historique des statuts, garde des transitions, audit)
   - `supabase/migrations/20261109000002_rls.sql` : politiques Row Level Security
   - `supabase/migrations/20261109000003_storage.sql` : buckets `public-media` (public) et `private-documents` (privé)
   - `supabase/seed.sql` : rôles, permissions, catégories, pages et contenus provisoires
3. Auth > URL Configuration : `Site URL` = URL du site, ajouter `<site>/auth/callback` aux Redirect URLs.
4. Premier administrateur : créer l'utilisateur (Auth > Users), puis :
   ```sql
   update public.profiles set role_key = 'admin', status = 'active' where email = 'admin@exemple.cm';
   ```
5. (Optionnel) Générer les types : `npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`

## Rôles

| Rôle | Droits principaux |
|---|---|
| `candidate` | Créer et suivre sa demande d'adhésion |
| `member` | Espace membre, contenus et documents réservés, annuaire |
| `editor` | Pages, actualités, événements, médias |
| `manager` | Instruction des demandes, gestion et export des membres, contact |
| `admin` | Toutes les permissions (comptes, rôles, paramètres, audit) |

Les permissions sont en base (`permissions`, `role_permissions`) et sont vérifiées par `has_permission()` dans les politiques RLS.

## Organisation du code

```
src/
  app/(site)/        pages publiques (header + footer)
  app/(auth)/        connexion, mot de passe oublié, réinitialisation
  app/espace/        espace membre (socle)
  app/auth/callback  retour des liens e-mail Supabase
  app/actions/       Server Actions (contact, newsletter, auth)
  lib/data/public.ts lecture des contenus publics, mise en cache ("use cache" + tags)
  lib/auth.ts        couche d'accès session / utilisateur courant
  lib/supabase/      clients serveur, navigateur, anonyme et proxy
  content/site.ts    navigation, missions, données de repli
  proxy.ts           rafraîchissement de session et protection de /espace et /admin
supabase/            migrations SQL et seed
```

**Cache Components** est activé : toute lecture de cookies ou de `searchParams` doit se trouver derrière un `<Suspense>`. Les contenus publics passent par un client anonyme sans cookies, dans des fonctions `"use cache"`. Le back-office les invalide avec `revalidateTag()` (tags dans `lib/data/public.ts`).

## Avancement (phasage du cahier des charges)

- [x] Socle : projet, schéma complet, RLS, stockage, rôles et permissions, auth
- [x] Phase 2 : site public (accueil, pages institutionnelles, acteurs, adhésion, actualités, événements, contact, newsletter, SEO)
- [ ] Phase 3 : parcours d'adhésion en 5 étapes, dépôt des pièces, espace membre complet
- [ ] Phase 4 : back-office (dossiers, membres, contenus, rôles, statistiques, journal)
- [ ] Phase 5 : e-mails transactionnels, recette, documentation, déploiement

Points encore à valider avec le commanditaire : voir §10 du cahier des charges (charte, champs et pièces, cotisations, annuaire, langues).
