# Trail Plan

Web app Next.js 14 : plan d’entraînement trail (76 km / 5000 D+), calendrier drag & drop, stats, sync Garmin (API route).

## Développement

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Déploiement Vercel

1. Pousse ce dépôt sur GitHub (ou GitLab / Bitbucket).
2. Sur [vercel.com](https://vercel.com) : **Add New Project** → importe le repo.
3. Framework : **Next.js** (détecté automatiquement). Build : `npm run build`, output par défaut.
4. Aucune variable d’environnement obligatoire pour l’app (données locales + POST Garmin depuis le client).

Les routes API Garmin utilisent le runtime **Node.js** (`app/api/garmin/connect`).

## Licence

Projet personnel.
