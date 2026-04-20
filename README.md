# ParcAuto Manager

Solution SaaS — Parc Automobile d'occasion (frontend).

## Phase 0 — Fondations (branche `main`)

- **Stack** : Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Auth** : page login, stockage JWT (localStorage), refresh token, déconnexion 30 min inactivité
- **Layout** : Sidebar (navigation par module), Header (utilisateur, déconnexion)
- **Client API** : `src/lib/api.ts` (baseURL via `NEXT_PUBLIC_API_URL`), intercepteur 401 → refresh puis retry ou redirection login
- **Pages** : `/login`, `/` (redirige vers dashboard ou login), `/dashboard` (Parc Automobile avec placeholders), routes placeholder pour Supply Chain, Comptabilité, Transit, CRM, Utilisateurs, Paramètres

## Développement

```bash
cp .env.local.example .env.local
# Éditer .env.local : NEXT_PUBLIC_API_URL=http://localhost:3001

npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Sans backend, la connexion échouera ; les écrans protégés redirigent vers `/login`.

## Branche `dev`

Les phases suivantes (tableau de bord avec stats réelles, Supply Chain, Comptabilité, etc.) sont à implémenter sur la branche **dev**.

## Référence

- `docs/PLAN_IMPLEMENTATION_FRONTEND.md` — plan d'implémentation détaillé
