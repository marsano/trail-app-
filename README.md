# Trail Plan

Web app Next.js 14 : plan d’entraînement trail (76 km / 5000 D+), calendrier drag & drop, stats, sync Garmin (API route).

## Développement

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) : page d’accueil avec le choix du programme (**Matthieu** 76 km ou **Loïc** 33 km). Les URLs sont `/matthieu`, `/matthieu/calendar`, `/loic`, etc.

- **Navigation** : barre du haut fixe au défilement.
- **Calendrier ↔ plan** : les dates déplacées dans le calendrier s’appliquent au plan ; le plan est regroupé par **semaines calendaires** (lundi) selon les dates effectives.
- **Édition** : chaque séance peut être modifiée (contenu, km, D+, type…) ou retirée du plan localement ; les courses ne sont plus verrouillées dans le calendrier.
- **Structure Garmin** : les séances sont découpées en **3 blocs** (échauffement, intervalles, récupération) avec **allure cible** chacun ; la description structurée est envoyée à Garmin Connect. Sans `blocks` dans le JSON du plan, le texte `content` est **découpé automatiquement** sur les séparateurs `|` (échauffement, cœur, RAC / retour).
- **Volume** : chaque carte affiche **km / D+** indicatifs et une **durée estimée** (≈) à partir des durées dans le texte (35', 1h30, séries…), avec repli sur km × min/km si peu de signal temporel.
- **Mise à jour des plans** : `node scripts/sync-plans-from-downloads.mjs` régénère `lib/plans/loic.ts` et `matthieu.ts` depuis les fichiers `plan-*-corrige (3).js` du dossier Téléchargements (adapter les chemins dans le script si besoin).

### Garmin Connect

La sync repose sur le package npm [`garmin-connect`](https://www.npmjs.com/package/garmin-connect).

- **Pas de bouton « Se connecter avec Garmin » (OAuth public)** : Garmin ne propose pas ce flux pour les applications web tierces comme pour Google ou Strava. La 1re connexion utilise **email + mot de passe** ; l’API établit ensuite une **session OAuth** (jetons) renvoyés au navigateur et **stockés localement** (par programme) pour les prochaines syncs **sans redemander le mot de passe** tant que la session reste valide.
- **MFA / 2FA** : non géré par la lib — si ton compte impose une double authentification, la connexion peut échouer (message explicite renvoyé par l’API).
- **Hébergement** : Garmin peut parfois bloquer ou limiter les IP de datacenters ; en cas d’échec uniquement en production, tester en local (`npm run dev`) aide à isoler le problème.

## Déploiement Vercel

1. Pousse ce dépôt sur GitHub (ou GitLab / Bitbucket).
2. Sur [vercel.com](https://vercel.com) : **Add New Project** → importe le repo.
3. Framework : **Next.js** (détecté automatiquement). Build : `npm run build`, output par défaut.
4. Aucune variable d’environnement obligatoire pour l’app (données locales + POST Garmin depuis le client).

Les routes API Garmin utilisent le runtime **Node.js** (`app/api/garmin/connect`).

## Licence

Projet personnel.
