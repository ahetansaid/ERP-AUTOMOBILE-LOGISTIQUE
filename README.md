# ERP Automobile & Logistique

Plateforme SaaS de gestion complète : Transit • Import-Export • Concessionnaires • Afrique (Bénin).

**Ce dossier = frontend uniquement** (Next.js). Le backend est dans un dossier séparé.

## Stack technique

| Couche | Technologies |
|--------|--------------|
| **Frontend** (ce dossier) | React.js + Next.js, Tailwind CSS, Recharts |
| **Backend** (dossier à part) | Node.js + Express + MySQL (sans Prisma) |

## Démarrage — Frontend (ce dossier)

```bash
npm install
npm run dev
```

Ouvrir **http://localhost:3000**

Copier `.env.local.example` en `.env.local` et définir `NEXT_PUBLIC_API_URL=http://localhost:3001` pour le backend. Compte par défaut (après seed backend) : `admin@erp.bj` / `Admin123!`

## Backend (dossier séparé)

Le backend se trouve dans : **`ERP-AUTOMOBILE-LOGISTIQUE-BACKEND`** (même niveau que ce dossier).

```bash
cd ../ERP-AUTOMOBILE-LOGISTIQUE-BACKEND
cp .env.example .env
# Éditer .env (MySQL : user, mot de passe, base erp_automobile)
npm install
npm run dev
```

API : **http://localhost:3001** — `GET /health`, `GET /api/ping-db`

## Documentation

- **[Cahier des charges](docs/)** — Cadrage général, spécifications fonctionnelles, roadmap.
- **[Spec VIN 360°](docs/SPEC-VIN360.md)** — Gestion 360° centrée sur le VIN.
- **[Rapport API backend attendu](docs/API-BACKEND-ATTENDU.md)** — Endpoints et formats attendus par le frontend.
- **[Point Frontend](docs/POINT-FRONTEND.md)** — Alignement backend ↔ frontend, checklist, Phase 2/3.
