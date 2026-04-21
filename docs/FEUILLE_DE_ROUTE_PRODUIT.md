# Feuille de route produit — ParcAuto Manager SaaS

> Document de référence pour la transformation du projet ERP-AUTOMOBILE-LOGISTIQUE en produit SaaS commercialisable.
> Dernière mise à jour : 2026-04-20

---

## 1. Vision & positionnement

**Produit** : ParcAuto Manager — ERP SaaS spécialisé pour importateurs et concessionnaires de véhicules.

**Marché cible** : Afrique de l'Ouest (Bénin, Togo, Burkina Faso, Côte d'Ivoire, Sénégal, Mali).

**Différenciateurs** :
- Workflow end-to-end : VIN → achat → transit/douane → atelier → vente → livraison.
- Trésorerie FCFA native + multi-devises.
- GED intelligente (OCR cartes grises, BL, factures fournisseurs) en upsell.
- Paiements mobile money (CinetPay) natifs.

**Anti-positionnement** : ne pas viser un ERP généraliste (Odoo, SAP Business One). Rester niche, profond, adapté aux flux d'importation.

---

## 2. État actuel (audit 2026-04-20)

### Stack
- **Front** : Next.js 14 (App Router) + TypeScript + Tailwind
- **Back** : Express 4 + MySQL 2 (sans ORM) + JWT
- **GED** : projet séparé Django + Postgres + MinIO + Elasticsearch (non intégré)

### Maturité des modules

| Module | Maturité | Commentaire |
|---|---|---|
| Achats / Véhicules / Stock | 85-90% | Logique métier solide, status machine OK |
| Factures / Reçus / Trésorerie | 75-85% | CRUD complet, ledger auto |
| CRM clients | 85% | Référentiel intégrité OK |
| Charges / Devis atelier | 70-75% | Fonctionnel |
| Transit international | 45% | Squelette, workflow incomplet |
| Rapports / Notifications / Proforma | 20-40% | Stubs backend |
| Utilisateurs / Paramètres | 60-65% | Pas de RBAC réel |
| GED intelligent | Séparé | Non intégré à l'ERP |

### Blockers commerciaux identifiés

1. Isolation multi-tenant faible (`company_id` non forcé par middleware)
2. RBAC absent (rôle JWT ignoré en pratique)
3. Aucun audit log (bloquant compta/conformité)
4. Pas d'upload fichiers (photos véhicules, BL, cartes grises)
5. Pas d'emails transactionnels (factures, relances)
6. Pas de reset mot de passe ni 2FA
7. SQL brut + validation absente (risque injection sur WHERE concaténés)
8. Zéro tests, zéro observabilité

---

## 3. Feuille de route (16 semaines)

```
Phase 0  — Fondations techniques       (S1-S4)   : rendre vendable
Phase 1  — Produit & expérience        (S5-S10)  : rendre désirable
Phase 2  — Commercialisation SaaS      (S11-S16) : rendre scalable
Post-launch — Croissance & GED         (S17+)    : différencier
```

### PHASE 0 — Fondations (S1-S4)

#### Semaine 1 — Architecture & sécurité socle

| Tâche | Livrable | Effort |
|---|---|---|
| Migration Prisma depuis MySQL existant | `backend/prisma/schema.prisma` + migrations | 2j |
| Middleware `tenantScope` (filtre `company_id` auto) | `backend/src/middleware/tenant.js` | 1j |
| RBAC : tables `permissions`, `role_permissions` + middleware `authorize(module, action)` | `backend/src/middleware/rbac.js` | 2j |
| Validation Zod sur toutes les routes | `backend/src/schemas/*.ts` | 2j |

#### Semaine 2 — Auth complète

- Reset mot de passe (email + token à durée limitée)
- 2FA TOTP optionnel
- Rate limiting `express-rate-limit` sur `/auth`
- Session management (refresh token en DB, révocation)
- Audit log middleware : table `audit_logs` (user, action, resource, before/after, IP, user_agent)

#### Semaine 3 — Fichiers & emails

- **Stockage** : MinIO (self-host) en dev, S3 en prod
  - Photos véhicules (galerie), documents achats, factures PDF archivées
  - Versioning des documents
- **Emails transactionnels** : Resend ou Brevo
  - Template engine : React Email
  - Templates : bienvenue, reset password, facture envoyée, relance impayé (J+7, J+15, J+30), devis prêt

#### Semaine 4 — Qualité & observabilité

- Tests Vitest/Jest sur routes critiques (purchases, invoices, vehicles, receipts)
- Logger structuré Pino + rotation
- Sentry front + back
- Docker + docker-compose (dev)
- CI GitHub Actions (lint + test + build)

**Livrable S4** : backend production-ready, multi-tenant sécurisé, testé, observable.

---

### PHASE 1 — Produit & UX (S5-S10)

#### S5-S6 — Design system moderne
- Tokens design (couleurs, typo, ombres, rayons) — cf. section 4
- Refonte composants UI : `Button`, `Card`, `Input`, `Table`, `Badge`, `Modal`, `Toast`
- Navigation repensée : sidebar rétractable + command palette ⌘K (style Notion)
- Dark mode propre
- Animations Framer Motion ciblées (pages, modals, toasts)

#### S7 — Documents PDF
- Génération via `@react-pdf/renderer` côté backend
- 4 templates (Classique, Minimal, Gradient, Compact) — cf. section 5
- Envoi email automatique avec PDF joint
- Archivage MinIO avec versioning
- Preview live dans l'app avant envoi

#### S8 — Finition modules
- **Transit** : workflow 7 étapes complet (devis → réservé → embarqué → en transit → dédouanement → livré → archivé), alertes retard, upload BL/documents douane
- **Atelier** : devis → ordre de travail → pièces → main d'œuvre → clôture
- **Rapports** : P&L, aging clients, valeur stock, CA par période/client/marque/pays, exports Excel/PDF

#### S9 — Dashboard & notifications
- Widgets configurables (drag & drop façon Notion)
- Notifications in-app (cloche + toast)
- Règles d'alerte paramétrables : impayés > 30j, devis non approuvés > 7j, transit > X jours, échéances proches

#### S10 — Mobile & PWA
- Audit responsive complet (toutes les pages)
- PWA installable (tablette showroom/port)
- Scan VIN via caméra (`qr-scanner` + fallback OCR mobile)

**Livrable S10** : produit fini, moderne, utilisable en mobilité.

---

### PHASE 2 — Commercialisation SaaS (S11-S16)

#### S11-S12 — Billing & onboarding
- Abonnement : **Stripe + CinetPay** (mobile money MTN/Orange/Wave/Moov indispensable)
- 3 plans :
  - **Essential** (~50-150k FCFA/mois) : Achats, véhicules, CRM, factures, reçus, trésorerie, 3 users
  - **Professional** (~+50%) : + devis atelier, transit complet, rapports avancés, notifications, upload documents, 10 users
  - **Enterprise** (sur devis) : + GED intégrée, multi-société, API publique, SSO, audit complet, support dédié
- Essai gratuit 14 jours sans CB
- Onboarding wizard : société → logo → utilisateurs → 1er achat → 1er véhicule

#### S13 — i18n & localisation
- `next-intl` (FR, EN) — extensible AR, PT plus tard
- Formats dates/monnaies par pays
- Numérotation factures conforme par pays (ex. Bénin : FAC-ANNEE-NNNN normalisée)
- Mentions légales paramétrables (IFU, RCCM, TVA selon pays)

#### S14 — Site marketing & docs
- Landing page sur **Framer** (voir section 4.3)
- Documentation utilisateur : Notion public ou Mintlify
- Blog SEO (douane, VIN, importation Cotonou, fleet management, etc.)

#### S15 — Support & success
- Chat intégré (Crisp ou Chatwoot self-host)
- Base de connaissances
- Webhooks outbound (intégrations clients)

#### S16 — Beta fermée → GA
- 5-10 clients pilotes (3 mois gratuits contre feedback)
- Corrections P0/P1
- **Go-live public**

---

### POST-LAUNCH (S17+)

- **Intégration GED intelligent** : OCR cartes grises, BL, factures fournisseurs (upsell Enterprise)
- API publique + SDK Node/PHP
- Marketplace intégrations (comptable externe, transporteurs, douane)
- IA : prévision trésorerie, pricing optimal véhicules, détection anomalies
- Apps mobiles natives (React Native)

---

## 4. Design system

### 4.1 Inspiration hybride

| Source | Ce qu'on prend |
|---|---|
| **Framer** | Landing marketing, animations, typo bold (Inter Tight), sections fullscreen, gradients subtils, scroll parallax |
| **Notion** | Interface app : densité info, command palette ⌘K, sidebar latérale, typographie calme, blocs modulaires |
| **Magic Chat / Magic UI** | Micro-interactions : shimmer loading, AnimatedList, BorderBeam sur CTA, gradient orbs en fond, glassmorphism ciblé |

### 4.2 Tokens (tailwind.config.ts)

```
Colors
  brand.50-950   : indigo/violet (500: #6366F1)  → CTA, liens, éléments actifs
  accent.500     : #10B981 (vert)  → succès, paiements encaissés
  warning.500    : #F59E0B         → échéances proches
  danger.500     : #EF4444         → impayés, erreurs
  neutral.0-1000 : échelle de gris chaude (zinc/slate mix)

Typography
  Display : "Cal Sans" ou "Inter Tight"  (titres, marketing)
  UI      : "Inter" (app)
  Mono    : "JetBrains Mono" (VIN, numéros factures)

Radius   : 8 / 12 / 16 / 24
Shadows  : xs / sm / md / lg + "glow-brand" pour CTA
Spacing  : grille 4px
Motion   : 150ms ease-out (défaut), 300ms spring (modals)
```

### 4.3 Layout app (inspiration Notion)

```
┌─────────────────────────────────────────────────────┐
│ Sidebar    │  Topbar (breadcrumb · ⌘K · notif · user)│
│ 260px      │─────────────────────────────────────────│
│            │                                         │
│ Logo       │   Contenu principal                     │
│ Recherche  │   - cards avec subtle shadow            │
│ ─────      │   - tables denses, lignes 40px          │
│ Nav module │   - empty states illustrés              │
│ Collapsed  │                                         │
│ Companies  │                                         │
└─────────────────────────────────────────────────────┘
```

Points clés :
- **Command palette ⌘K** : navigation + actions rapides (nouvelle facture, nouveau client…)
- **Sidebar rétractable** avec favoris/épinglés
- **Breadcrumb intelligent** avec actions contextuelles à droite

### 4.4 Landing marketing (Framer)

```
Hero fullscreen : gradient mesh + "Gérez votre import auto de A à Z"
                  démo vidéo/animation Lottie à droite
Trust bar       : logos clients
Features        : 3-column cards avec icônes animées au scroll
Produit         : screenshots app avec effet device-mockup + parallax
Pricing         : 3 plans, Pro en avant avec BorderBeam
Témoignages     : carousel horizontal
FAQ             : accordion
CTA final       : "Essayez 14 jours — sans carte"
```

Construction : **Framer direct** (rapide, no-code, export possible) pour v1. Migrer Next.js + Framer Motion plus tard si besoin d'intégration poussée.

---

## 5. Design des documents (factures · reçus · devis · proforma)

4 templates configurables par société (logo, couleurs, pied de page, mentions légales locales).

### Template 1 — "Classique Pro" (sobre, corporate)

```
┌──────────────────────────────────────────────┐
│ [LOGO]                    FACTURE N°FAC-2026-0042│
│                           Date : 20/04/2026     │
│                           Échéance : 20/05/2026 │
│──────────────────────────────────────────────│
│ Émetteur                  Destinataire          │
│ MdSC Import               SARL Kofi Motors      │
│ Cotonou, Bénin            Lomé, Togo            │
│ IFU 1234567               Tél +228 90 00 00 00  │
│──────────────────────────────────────────────│
│ Désignation         Qté   PU HT    Montant HT   │
│ Toyota RAV4 2022    1     15M      15 000 000   │
│ VIN : JTMBFREV...                               │
│──────────────────────────────────────────────│
│                        Total HT : 15 000 000    │
│                        TVA 18% :   2 700 000    │
│                        TOTAL TTC : 17 700 000   │
│──────────────────────────────────────────────│
│ Mentions légales · RIB · cachet · signature    │
└──────────────────────────────────────────────┘
```
**Usage** : clients B2B traditionnels, exports comptables.

### Template 2 — "Moderne Minimal" (Notion-like)

```
┌──────────────────────────────────────────────┐
│                                              │
│   FACTURE                                    │
│   FAC-2026-0042 · 20 avril 2026              │
│                                              │
│──────────────────────────────────────────────│
│                                              │
│   À                         De               │
│   Kofi Motors              MdSC Import       │
│   Lomé · Togo              Cotonou · Bénin   │
│                                              │
│   ─────────────                              │
│                                              │
│   Toyota RAV4 2022                15 000 000 │
│   VIN · JTMBFREV7...                         │
│                                              │
│   ─────────────                              │
│                                              │
│                      Sous-total  15 000 000  │
│                      TVA 18%      2 700 000  │
│                      ───────────             │
│                      Total      17 700 000 F │
│                                              │
│   À régler avant le 20 mai 2026              │
│                                              │
└──────────────────────────────────────────────┘
```
**Usage** : moderne, élégant, valorise le service. Inter, espace blanc généreux, accent coloré sur total.

### Template 3 — "Gradient Brand" (Magic UI / Stripe-like)

```
┌──────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓ bande gradient brand ▓▓▓▓▓▓▓▓▓▓▓│
│ LOGO                                FAC-0042 │
│──────────────────────────────────────────────│
│ Facturé à                Statut              │
│ Kofi Motors              ● En attente        │
│                                              │
│ Détail                                       │
│ ┌──────────────────────────────────────────┐ │
│ │ Toyota RAV4 2022              15 000 000 │ │
│ │ JTMBFREV7N...                            │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│    ╭────────────────────────────╮           │
│    │  Total à payer             │           │
│    │  17 700 000 FCFA           │           │
│    │  [Payer en ligne →]        │           │
│    ╰────────────────────────────╯           │
│                                              │
│ ▓▓▓▓▓▓▓ bande footer sombre ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────────────────────┘
```
**Usage** : factures envoyées par email avec lien de paiement (Stripe/CinetPay). Brand-forward.

### Template 4 — "Reçu compact" (A5 / thermique)

```
┌──────────────────────┐
│      MdSC IMPORT     │
│   Cotonou · Bénin    │
│──────────────────────│
│ REÇU N° REC-0128     │
│ 20/04/2026 · 14:32   │
│──────────────────────│
│ Reçu de : Kofi Motors│
│ Mode : Virement      │
│ Réf  : VIR-Ecobank-  │
│        20260420-001  │
│──────────────────────│
│ Montant :            │
│    5 000 000 FCFA    │
│                      │
│ Sur facture FAC-0042 │
│ Solde restant :      │
│   12 700 000 FCFA    │
│──────────────────────│
│   Merci de votre     │
│    confiance.        │
└──────────────────────┘
```
**Usage** : reçus imprimés, caisse, livraison. Impression thermique 58/80mm supportée.

### Variantes

- **Devis** : même base facture, bandeau "DEVIS", date de validité, CTA "Accepter" (lien signé)
- **Proforma** : similaire devis, mention "Proforma — non comptabilisé"
- **Bon de livraison** : focus VIN, état véhicule, signature destinataire, photos

### Implémentation

- Lib : `@react-pdf/renderer` (même JSX/CSS que le front)
- Templates : `backend/src/pdf/templates/{classic,minimal,gradient,compact}.tsx`
- Preview live dans l'app avant envoi
- Personnalisation par société : logo, 2 couleurs, pied de page, mentions légales
- Langue selon destinataire (FR/EN)
- Lien de paiement signé intégré (Stripe/CinetPay) sur templates 2 et 3

---

## 6. Packaging commercial

| Plan | Cible | Prix indicatif | Inclus |
|---|---|---|---|
| **Essential** | PME 1-3 users | 50-150k FCFA/mois | Achats, véhicules, CRM, factures, reçus, trésorerie |
| **Professional** | Importateurs confirmés 5-10 users | ~+50% | + devis atelier, transit complet, rapports avancés, notifications, documents |
| **Enterprise** | Groupes, multi-société | Sur devis | + GED intégrée, multi-société, API, SSO, audit, support dédié |

Essai gratuit 14 jours sans CB sur tous les plans.

---

## 7. Décisions techniques à valider

| # | Sujet | Recommandation | À valider par |
|---|---|---|---|
| 1 | ORM | **Prisma** (écosystème + Studio + migrations) | Tech lead |
| 2 | Stockage objet | **MinIO** en dev/early, **S3** en prod | Tech lead |
| 3 | Email provider | **Resend** (DX) ou **Brevo** (délivrabilité Afrique) | Tech lead |
| 4 | Landing page | **Framer** pour v1, Next.js plus tard | Produit |
| 5 | Billing | **Stripe + CinetPay** (les deux, non négociable) | Produit |
| 6 | Chat support | **Crisp** (hébergé) ou **Chatwoot** (self-host) | Support |
| 7 | Docs utilisateur | **Mintlify** ou **Notion public** | Produit |

---

## 8. Indicateurs de réussite

### Pré-launch (S16)
- 0 vulnérabilité critique (audit sécurité)
- Couverture tests > 60% sur routes métier
- 5-10 clients pilotes en beta
- NPS pilotes > 30

### Post-launch (M3)
- 20 clients payants
- MRR > 2M FCFA
- Churn < 5%/mois
- Temps moyen résolution support < 24h

### M12
- 100+ clients payants
- MRR > 15M FCFA
- Expansion 3+ pays
- GED activée sur > 30% des clients Enterprise

---

## 9. Prochaines étapes immédiates

Sélectionner le premier chantier parmi :

1. **Schéma Prisma complet** à partir du MySQL existant (base Phase 0)
2. **Middleware tenant + RBAC** (sécurité critique)
3. **Refonte design system** (Button, Card, Sidebar, tokens)
4. **Maquette React d'un template de facture** (validation visuelle)
5. **Landing page Framer** (structure + copy FR)

> Ce document est vivant — à mettre à jour à chaque décision structurante ou jalon atteint.
