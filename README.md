# Trail Plan

Web app Next.js 14 : plan d’entraînement trail (76 km / 5000 D+), calendrier drag & drop, stats, sync Garmin (API route).

## Développement

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) : page d’accueil avec le choix du programme (**Matthieu** 76 km ou **Loïc** 33 km). Les URLs sont `/matthieu`, `/matthieu/calendar`, `/loic`, etc.

### Garmin Connect

La sync repose sur le package npm [`garmin-connect`](https://www.npmjs.com/package/garmin-connect). Limites connues :

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
