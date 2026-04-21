# Guide migration Prisma — ParcAuto Manager

> Basculer le backend de SQL brut (`mysql2`) vers Prisma ORM sans perdre les données existantes.
> Créé le 2026-04-20 dans le cadre de la Phase 0 de la feuille de route.

## Pourquoi Prisma ?

- Type-safety complète (TypeScript)
- Migrations versionnées automatiques
- Studio intégré (explorateur de BDD)
- Fin des requêtes SQL concaténées (risque d'injection)
- Remplace progressivement les queries `pool.query(...)` dans les routes

## État actuel

- ✅ `prisma/schema.prisma` créé, mappant toutes les tables existantes + enums Prisma
- ✅ Ajouts Phase 0 : `Permission`, `UserPermission`, `Session`, `PasswordResetToken`, `AuditLog`, `EmailEvent`, `Upload`
- ✅ `DATABASE_URL` ajouté au `.env`
- ✅ `@prisma/client` installé, client généré (`postinstall`)
- ✅ Schema validé par `prisma validate`
- ✅ Baseline SQL généré : `prisma/migrations/0_init/migration.sql` (560 lignes)
- ✅ Singleton Prisma : `src/lib/prisma.js`
- ✅ Middleware `tenantScope` : `src/middleware/tenant.js` (expose `req.companyId`, `req.tenantWhere()`)
- ✅ Middleware `authorize(module, action)` : `src/middleware/rbac.js` (rôles macro + permissions fines avec cache 60s)
- ✅ Seed permissions : `prisma/seed.js` (16 modules × 5 actions = 80 permissions)
- ✅ Route pilote `clients.js` migrée vers Prisma + middlewares
- ✅ `tenantScope` branché sur `/clients` et `/api/clients` uniquement (progressif)

## Procédure baseline (base existante avec données)

Prisma Migrate refuse de créer une première migration si la base contient déjà des tables. Il faut marquer l'état actuel comme « baseline ».

### Étape 1 — Générer le SQL de baseline

```bash
cd C:/xampp/htdocs/ERP-AUTOMOBILE-LOGISTIQUE-BACKEND
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

> Le script npm `prisma:migrate:baseline` fait exactement ça.

### Étape 2 — Marquer la migration comme appliquée

```bash
npx prisma migrate resolve --applied 0_init
```

À partir de là, toutes les modifications du schéma devront passer par :

```bash
npx prisma migrate dev --name description_du_changement
```

### Étape 3 — Vérifier

```bash
npx prisma migrate status
```

Doit afficher « Database schema is up to date ».

## Intégration progressive dans le code

Les routes actuelles utilisent `pool.query(...)` de `mysql2`. On peut les remplacer progressivement, route par route, sans tout casser.

### Singleton du client Prisma

Créer `src/lib/prisma.js` :

```js
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;
const prisma = globalForPrisma.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;

module.exports = { prisma };
```

### Exemple migration d'une route (clients.js)

**Avant** :
```js
const [rows] = await pool.query('SELECT * FROM clients WHERE company_id = ?', [companyId]);
```

**Après** :
```js
const { prisma } = require('../lib/prisma');
const rows = await prisma.client.findMany({ where: { companyId } });
```

### Ordre de migration recommandé

1. **clients, suppliers** (CRUD simple, peu de relations)
2. **vehicles, purchases** (relations + business rules)
3. **invoices, receipts** (agrégations, balance)
4. **workshop_quotes, charges, treasury** (chaînes de transactions auto)
5. **dashboard** (remplacer les agrégations SQL par des `groupBy` Prisma)

## Différences notables schéma SQL ↔ Prisma

| Changement | Motivation |
|---|---|
| `VARCHAR(50) status` → `enum` Prisma | Typage strict, auto-complétion, validation |
| Pas de FK SQL → `@relation` Prisma | Intégrité référentielle forcée par le client |
| Colonnes `snake_case` → champs `camelCase` | Convention JS/TS, `@map` assure la compat SQL |
| Ajout `onDelete: Cascade / SetNull / Restrict` | Règles explicites de suppression |
| Ajout tables Phase 0 | Pré-requis commercialisation |

## Tables ajoutées (Phase 0)

| Table | Rôle |
|---|---|
| `permissions` | Catalogue des permissions (ex: `invoices.create`) |
| `user_permissions` | Assignation fine au-delà du rôle |
| `sessions` | Refresh tokens révocables |
| `password_reset_tokens` | Flow « mot de passe oublié » |
| `audit_logs` | Traçabilité complète (qui, quand, quoi, avant/après) |
| `email_events` | Traçabilité envois email (statut, ouverture, bounce) |
| `uploads` | Index des fichiers MinIO/S3 (photos, PDF, docs) |

## Extensions apportées aux tables existantes

| Table | Ajouts |
|---|---|
| `companies` | `logo_url`, `primary_color`, `secondary_color`, `invoice_template`, `legal_number`, `country`, `default_currency` |
| `users` | `two_fa_enabled`, `two_fa_secret`, `last_login_at`, `avatar_url` |
| `vehicles` | `mileage`, `registration`, `country_origin` |
| `notifications` | `link` (URL cible) |

> Ces ajouts nécessitent une migration `prisma migrate dev --name phase0_additions` après la baseline.

## Procédure d'activation sur ta machine locale

1. **Créer les nouvelles tables Phase 0** (permissions, sessions, audit_logs, etc.) :
   ```bash
   cd C:/xampp/htdocs/ERP-AUTOMOBILE-LOGISTIQUE-BACKEND
   npx prisma migrate dev --name phase0_rbac_audit
   ```
   Prisma comparera le schéma à la BDD existante et générera + appliquera la migration pour les tables manquantes uniquement.

2. **Seeder le catalogue de permissions** :
   ```bash
   node prisma/seed.js
   ```
   Crée les 80 permissions (`clients.create`, `invoices.read`, etc.).

3. **Redémarrer le backend** :
   ```bash
   npm run dev
   ```
   Vérifier que `/clients` répond toujours correctement.

## Prochaines étapes

1. ✅ Route pilote `clients.js` migrée — valider en conditions réelles
2. Migrer `suppliers.js`, `vehicles.js` (plus de logique), `invoices.js`
3. Ajouter middleware `auditLog` pour tracer create/update/delete automatiquement
4. Remplacer `authMiddleware` par une version Prisma (utilise `Session` pour refresh tokens révocables)
5. Supprimer `src/config/database.js` et la dépendance `mysql2` quand toutes les routes sont migrées

## Commandes utiles

```bash
npm run prisma:validate   # valider le schéma
npm run prisma:format     # reformater
npm run prisma:generate   # regénérer le client
npm run prisma:studio     # ouvrir l'explorateur web
npm run prisma:db:pull    # réintrospection si la DB a été modifiée manuellement
```
