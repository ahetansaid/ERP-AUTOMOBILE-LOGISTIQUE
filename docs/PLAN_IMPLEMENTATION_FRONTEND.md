# Plan d'implémentation frontend — ParcAuto Manager

**Référence** : CDC Partie II (périmètre fonctionnel) + Cartographie des processus  
**Périmètre** : 6 modules métier + 3 modules transversaux — **frontend uniquement**  
**Version** : 1.0 · **Date** : 2026

---

## Principes directeurs

- **Stack recommandée** : Next.js (App Router), TypeScript, Tailwind CSS, état global minimal (Context / Zustand si besoin).
- **Contrat API** : Toutes les données viennent du backend (snake_case en réponse) ; le frontend normalise pour l’affichage (helper `pick` / mappers).
- **Règle métier à respecter partout** : les transitions de statuts véhicule/achat/transit sont **conditionnées** ; le frontend désactive les actions (boutons) lorsque les conditions ne sont pas remplies et affiche des messages explicites.
- **RBAC** : afficher/masquer menus et actions selon le rôle (Admin, Commercial, Comptable, Responsable Stock, Transitaire, Technicien).

---

## Vue d’ensemble des phases

| Phase | Contenu | Priorité |
|-------|---------|----------|
| **0** | Fondations (projet, auth, layout, design system) | P0 |
| **1** | Module 0 — Authentification & Tableau de bord | P0 |
| **2** | Module 1 — Supply Chain (achats → stocks → atelier) | P0 |
| **3** | Module 2 — Comptabilité | P0 |
| **4** | Module 3 — Transit international | P1 |
| **5** | Modules 4, 5, 6 — CRM, Utilisateurs, Paramètres | P1 |
| **6** | Reporting, alertes, timeline véhicule, exports | P2 |

---

## Phase 0 — Fondations (frontend)

### 0.1 Initialisation projet

- Créer projet Next.js 14+ (App Router), TypeScript, ESLint, Tailwind.
- Configurer path aliases (`@/components`, `@/lib`, `@/types`).
- Définir structure de dossiers :
  - `src/app/(auth)/` : login, oubli mot de passe.
  - `src/app/(main)/` : layout authentifié (sidebar, header), routes métier.
  - `src/components/ui/` : boutons, inputs, cartes, modales, tables.
  - `src/components/layout/` : Sidebar, Header.
  - `src/lib/` : client API (axios/fetch), auth (stockage token, refresh), constants (statuts, rôles).
  - `src/types/` : interfaces (Vehicle, Purchase, Invoice, Client, etc.).
  - `src/hooks/` : useAuth, useDashboardStats, etc.

### 0.2 Client API & authentification

- **Client HTTP** : instance dédiée (baseURL backend), intercepteur pour ajout `Authorization: Bearer <accessToken>`, intercepteur 401 → refresh token puis retry, ou redirection vers `/login`.
- **Auth** : stocker `accessToken`, `refreshToken`, `expiresIn`, `user` (id, email, firstName, lastName, role, companyId) en mémoire + localStorage/sessionStorage (choix selon besoin sécurité). Déconnexion automatique après 30 min d’inactivité (timer + vérif sur focus).
- **Routes protégées** : middleware ou HOC/layout qui vérifie la présence du token et redirige vers `/login` sinon.
- **2FA (optionnel)** : écran après login si 2FA activé (SMS ou TOTP) ; envoi code vers backend, puis complétion du login.

### 0.3 Design system & layout

- **Thème** : couleurs, typo, espacements cohérents (Tailwind). FCFA toujours affiché avec séparateur de milliers (ex. `toLocaleString('fr-FR')`).
- **Layout principal** : Sidebar (navigation par module), Header (utilisateur, déconnexion). Sidebar pliable sur mobile.
- **Composants UI** : Button, Input, Select, Card, Badge (statuts), Table (tri, pagination), Modal, Dropdown (actions), Toast (notifications). Pas de fallbacks texte inutiles ; champs vides = affichage sobre (ex. « — ») si le CDC l’exige.
- **RBAC** : composant ou hook `usePermission(module, action)` ; cacher liens sidebar et boutons selon rôle.

---

## Phase 1 — Module 0 : Authentification & Tableau de bord

### 1.1 Authentification

- **Page `/login`** : formulaire email + mot de passe, bouton « Connexion », lien « Mot de passe oubli ». Appel `POST /auth/login`. En cas de succès : stocker tokens + user, rediriger vers `/` (tableau de bord). Afficher erreur si `message` + `statusCode` retournés.
- **Déconnexion** : appel `POST /auth/logout` (ou équivalent), suppression tokens/user, redirection `/login`.
- **Refresh token** : avant expiration, appeler `POST /auth/refresh` avec `refreshToken` et mettre à jour `accessToken` en mémoire/storage.

### 1.2 Tableau de bord principal (« Parc Automobile »)

- **Route** : `/` ou `/dashboard` (première page après connexion).
- **Source données** : `GET /dashboard/stats` (ou `/api/dashboard/stats`). Champs à afficher (alignement backend) :
  - `stockDisponible` — Stocks Disponible
  - `stockNonRegulier` — Stocks Non Régulier
  - `stockRegularise` — Stocks Régulier
  - `nombreClients` ou équivalent — Clients actifs
  - `caSemaine` — CA semaine (FCFA)
  - `caMois` — CA mois (FCFA)
  - `vehiclesEnMaintenance` — Véhicules en maintenance
  - `vehiclesEnTransit` — Véhicules en transit
  - `alertesActives` (optionnel selon CDC) — Alertes actives
- **Affichage** : cartes (cards) par indicateur avec libellé + valeur. Mise à jour : refetch au focus ou polling léger (ex. 60 s).
- **Actions rapides** : liens/boutons vers listes métier :
  - « Voir stock disponible » → `/supply-chain/stock-disponible`
  - « Voir stock non régulier » → `/supply-chain/stock-non-regulier`
  - « Voir stock régulier » → `/supply-chain/stock-regulier`
  - « Véhicules en maintenance » → `/supply-chain/atelier`
  - « Véhicules en transit » → `/transit` ou `/transit/suivi`
- **Graphiques (optionnel)** : si backend expose `GET /dashboard/charts/status` et `/dashboard/charts/monthly`, afficher camembert + courbe CA.

---

## Phase 2 — Module 1 : Supply Chain

### 2.1 Gestion des achats

- **Liste** : `GET /purchases` (avec `companyId` en query ou déduit JWT). Colonnes : Fournisseur, Date achat, Conteneur, Navire, Nombre véhicules, Statut, Actions. Utiliser les clés backend (snake_case) : `supplier_name`, `purchase_date`, `container_reference`, `vessel`, `vehicle_count`, `status`. Filtre/recherche par fournisseur, conteneur, navire.
- **Création** : formulaire « Nouvel achat » (modal ou page dédiée). Champs : fournisseur (select fournisseurs `GET /suppliers`), date achat, type achat (vrac / conteneur), conteneur, navire, devise, taux indicatif (USD/EUR → FCFA), liste de véhicules (VIN*, marque*, modèle, couleur, année*, type véhicule [occasion/neuf/accidenté], prix devise, montant FCFA calculé). Envoi `POST /purchases` avec body aligné backend (alias acceptés : `fournisseurNom`, `dateAchat`, `conteneur`, `navire`, `vehicules[]`, etc.). Après 201 : refetch liste ou ajout de `response.purchase` en tête de liste (avec `vehicle_count`, `total_sale_value`).
- **Détail / Fiche achat** : `GET /purchases/:id`. Afficher récap fournisseur, véhicules, coût, date arrivée. Bouton « Valider arrivée » si statut = EN_COURS → appel `PATCH /purchases/:id/arrive` (backend met véhicules en DISPONIBLE).
- **Modification** : possible uniquement si statut = EN_COURS. Formulaire pré-rempli, `PUT` ou `PATCH /purchases/:id`.
- **Suppression** : possible uniquement si statut = EN_COURS ; modal avec motif obligatoire → `DELETE /purchases/:id` avec body `{ reason }`. Utiliser l’`id` dans l’URL (ne pas appeler `DELETE /purchases/` sans id).
- **Statuts affichés** : EN_COURS, ARRIVE (libellés « En cours », « Arrivé »).

### 2.2 Fiche véhicule (données maîtres)

- **Route** : `/vehicules/:id` ou `/supply-chain/vehicules/:id`. Données : `GET /vehicles/:id`. Champs : VIN, marque, modèle, année, couleur, carrosserie, kilométrage, pays d’origine, prix d’achat (FCFA), prix de vente (FCFA), documents joints, photos (min 4 recommandé), **statut courant** (disponible / en_vente / en_maintenance / vendu / en_transit).
- **Édition** : selon statut et rôle ; formulaire avec champs modifiables (prix de vente quand DISPONIBLE ou EN_VENTE, etc.). `PATCH /vehicles/:id`.

### 2.3 Vue globale du parc

- **Route** : `/supply-chain/vue-globale` ou `/parc-auto`. Liste : `GET /vehicles` avec query params (marque, modèle, châssis/VIN, statut, date arrivée, fourchette prix, fournisseur, pays). Recherche rapide par VIN ou immatriculation. Table avec colonnes pertinentes + pagination. Boutons Export Excel / PDF (appel backend d’export ou génération côté client si API renvoie les données).
- **Indicateurs** : valeur totale du stock (FCFA), délai moyen de rotation (si backend les fournit).

### 2.4 Stocks disponible

- **Route** : `/supply-chain/stock-disponible`. Liste : `GET /vehicles?status=DISPONIBLE`. Colonnes : VIN, marque, modèle, année, prix achat, prix vente (éditable), statut. Actions par véhicule :
  - Voir fiche détaillée
  - Modifier prix de vente (champ ou modal) → `PATCH /vehicles/:id` (price_sale)
  - **Envoyer vers atelier** → passage statut EN_MAINTENANCE (`PATCH /vehicles/:id/status` ou équivalent)
  - **Débuter la vente** → passage EN_VENTE (modal : sélection client CRM, confirmation prix) puis `PATCH /vehicles/:id/status` + liaison client/vente selon API

### 2.5 Stocks non régulier

- **Route** : `/supply-chain/stock-non-regulier`. Liste : `GET /vehicles?status=EN_VENTE`. Afficher véhicule, client, prix vente, **solde restant dû** (données facture/reçus depuis API). Action **Clôturer la vente** : bouton **actif uniquement si** solde = 0 (vérifier via `remaining_amount` ou indicateur backend). Si actif → appel API de clôture (ex. `PATCH /vehicles/:id/status` → VENDU) ; backend doit refuser si facture non soldée (409). Historique paiements : lien vers fiche véhicule ou modal listant factures + reçus.

### 2.6 Stocks régulier

- **Route** : `/supply-chain/stock-regulier`. Liste : `GET /vehicles?status=VENDU`. Lecture seule : fiche véhicule, historique paiements, option archivage (si paramétrable et exposé en API).

### 2.7 Garage / Maintenance

- **Route** : `/supply-chain/atelier`. Liste : `GET /vehicles?status=EN_MAINTENANCE` (ou endpoint dédié atelier). Colonnes : VIN, marque, modèle, devis associés (lien vers Comptabilité → Devis). Actions :
  - Voir fiche véhicule
  - Consulter devis (lien vers `/comptabilite/devis` filtré par véhicule)
  - **Créer un devis** (lien vers création devis avec véhicule pré-sélectionné)
  - **Clôturer la maintenance** : bouton **actif uniquement si** un reçu lié au devis a été émis (devis clôturé). Appel API passage EN_MAINTENANCE → DISPONIBLE ; backend refuse si condition non remplie (409).

---

## Phase 3 — Module 2 : Comptabilité

### 3.1 Charges

- **Liste** : `GET /charges`. Filtres : période, catégorie, montant. Colonnes : libellé, catégorie, montant FCFA, date, pièce jointe. Création : formulaire (libellé, catégorie, montant, date, fichier). Modification / suppression avec motif si requis. Export Excel / PDF (si API fournie).

### 3.2 Devis (maintenance)

- **Liste** : `GET /devis`. Filtre par véhicule, statut (EN_ATTENTE, ACCEPTE, REFUSE, TERMINE). Création : **uniquement pour véhicule en EN_MAINTENANCE** ; sélection véhicule (liste véhicules atelier), prestataire, montant FCFA, description, date validité. Un seul devis actif par véhicule (backend peut refuser sinon). Édition tant que non clôturé. **Émettre un reçu** : bouton depuis la fiche devis → ouvre formulaire reçu lié au devis ; à l’enregistrement, backend clôture le devis. Pas de fallbacks inutiles.

### 3.3 Factures

- **Liste** : `GET /invoices`. Liées à véhicule EN_VENTE + client. Création : sélection véhicule (stock non régulier), client, montant (partiel ou total), date d’échéance. Numérotation auto côté backend (ex. FAV-2026-0001). Téléchargement PDF après création. Modification tant que vente non clôturée ; suppression avec motif + audit.

### 3.4 Reçus

- **Liste** : `GET /receipts`. Reçu lié à facture ou à devis. Création depuis facture (saisie montant, date, méthode paiement, référence) ou depuis devis (reçu maintenance). Affichage solde restant après chaque reçu. Quand total reçus = montant facture → déverrouillage « Clôturer vente » (côté stock non régulier).

### 3.5 Trésorerie

- **Route** : `/comptabilite/tresorerie`. Données : `GET /treasury` ou endpoint synthèse. Afficher : total recettes période, total charges période, solde net (recettes − charges), encours clients, valeur stock. Graphiques si API fournit séries.

### 3.6 Factures pro forma

- **Liste** : `GET /proformas`. Création liée véhicule/client (transit). Numérotation PF-2026-0001. Génération PDF conforme douane. Lien MeCeF si paramétré (lien ou statut vérification).

### 3.7 Rapports

- **Route** : `/comptabilite/rapports`. Liste des rapports générés (hebdo, personnalisés). Consulter, télécharger PDF, archiver. Rapport stock valorisé (valeur parc à une date). Bouton « Générer rapport » avec choix période/catégorie si API le permet.

---

## Phase 4 — Module 3 : Transit international

### 4.1 Périmètre

- Véhicules issus de Stocks Régulier (vente soldée) ou Non Régulier (cas particuliers). Entrée dans le module = ouverture d’un dossier/étape transit pour le véhicule.

### 4.2 Workflow & statuts

- Statuts affichés : ARRIVEE_PORT → ADMISSION_TEMPORAIRE → DECLARATION_DOUANE → MAINLEVEE → SCELLES_POSES → EN_ACHEMINEMENT → LIVRE. Liste des véhicules en transit : `GET /transit/vehicles` ou équivalent. Résumé par étape : `GET /transit/steps/summary` → `{ steps: [ { step, count } ] }` pour indicateurs ou filtre.

### 4.3 Dossiers / étapes

- **Liste** : `GET /transit/steps` (ou opérations). Pour chaque véhicule : étape courante, dates, documents. Détail : formulaire ou fiche par véhicule avec mise à jour de l’étape (avancement) et upload de documents (BL, DTI, quittance, PV scellés, PV livraison).

### 4.4 Documents

- Types : Connaissement, Facture Pro Forma, DTI, Certificat Immatriculation origine, Quittance douane, PV Scellés, PV Livraison. Upload + liste par dossier transit. Affichage des documents manquants (alerte).

### 4.5 Alertes transit

- Affichage des alertes : J-7 admission temporaire, véhicule bloqué > N jours, document manquant. Liste ou bandeau sur la page transit. Notifications in-app si backend les envoie (websocket ou polling).

---

## Phase 5 — Modules transversaux

### 5.1 Module 4 — CRM Clients

- **Liste** : `GET /clients`. Filtres, recherche. **Fiche client** : `GET /clients/:id` (client + purchaseHistory, paymentHistory, transitHistory). Formulaire création/édition : nom, type (Particulier/Professionnel), téléphone(s), email, adresse, pays, NIF/RCCM. Export fiche client PDF (si API).

### 5.2 Module 5 — Utilisateurs & RBAC

- **Liste** : `GET /users` (réservé Admin). Colonnes : email, nom, prénom, rôle, actif. Création : email, mot de passe, rôle, société. Modification : rôle, activation/désactivation. Journal d’audit : page ou modal listant les actions sensibles (si API expose `/audit` ou équivalent).

### 5.3 Module 6 — Paramètres

- **Route** : `/parametres`. Sous-pages ou onglets :
  - Devises et taux de change (FCFA, USD, EUR ; taux éditables).
  - Numérotation des documents (factures, reçus, devis, pro forma : format + compteur).
  - Taxes / TVA.
  - MeCeF (connexion, paramètres).
  - Tableau de bord : indicateurs affichés, ordre, seuils d’alerte.
  - Catégories de charges.
  - Notifications (email/SMS) et seuils d’alerte transit.

---

## Phase 6 — Reporting, alertes, timeline

### 6.1 Rapports automatiques

- Affichage des rapports hebdomadaires dans Comptabilité → Rapports. Téléchargement PDF. Rapports personnalisés (période, catégorie) si l’API le permet.

### 6.2 Alertes système

- Zone dédiée (header ou page Notifications) : liste des alertes (impayés, échéances douane, maintenances en retard, vente clôturable). Données : endpoint alertes ou dérivées des listes (factures non soldées, transit J-7, etc.).

### 6.3 Timeline véhicule

- **Route** : `/vehicules/:id/historique` ou onglet dans fiche véhicule. Affichage chronologique : enregistrement achat, validation arrivée, mise en vente, paiements, envoi maintenance, fin maintenance, clôture vente, transit, livraison. Données : `GET /vehicles/:id/timeline` ou agrégation des événements (si backend expose).

### 6.4 Exports

- Excel / PDF pour listes (achats, véhicules, clients, factures, charges, etc.) : soit endpoint dédié (ex. `GET /purchases/export?format=xlsx`), soit génération côté client à partir des données déjà chargées (librairie type xlsx, jsPDF).

---

## Récapitulatif des routes frontend (suggestion)

| Route | Module | Description |
|-------|--------|-------------|
| `/login` | 0 | Connexion |
| `/` ou `/dashboard` | 0 | Tableau de bord Parc Automobile |
| `/supply-chain/achats` | 1 | Liste + création achats |
| `/supply-chain/achats/:id` | 1 | Fiche achat, valider arrivée |
| `/supply-chain/vue-globale` | 1 | Vue globale parc |
| `/supply-chain/stock-disponible` | 1 | Stock disponible |
| `/supply-chain/stock-non-regulier` | 1 | Stock non régulier |
| `/supply-chain/stock-regulier` | 1 | Stock régulier |
| `/supply-chain/atelier` | 1 | Garage / maintenance |
| `/vehicules` | 1 | Liste véhicules (optionnel doublon vue globale) |
| `/vehicules/:id` | 1 | Fiche véhicule |
| `/vehicules/:id/historique` | - | Timeline véhicule |
| `/comptabilite/charges` | 2 | Charges |
| `/comptabilite/devis` | 2 | Devis maintenance |
| `/comptabilite/factures` | 2 | Factures |
| `/comptabilite/recus` | 2 | Reçus |
| `/comptabilite/tresorerie` | 2 | Trésorerie |
| `/comptabilite/proforma` | 2 | Pro forma |
| `/comptabilite/rapports` | 2 | Rapports |
| `/transit` | 3 | Vue transit (liste / résumé) |
| `/transit/suivi` | 3 | Suivi véhicules, étapes, documents |
| `/crm` | 4 | Liste clients |
| `/crm/:id` | 4 | Fiche client 360° |
| `/utilisateurs` | 5 | Gestion utilisateurs (Admin) |
| `/parametres` | 6 | Paramètres système |
| `/notifications` | - | Alertes / notifications |

---

## Règles métier frontend (rappel)

1. **Clôture vente** : bouton actif **uniquement si** solde restant = 0 (données facture/reçus). Sinon désactivé + tooltip explicatif.
2. **Clôture maintenance** : bouton actif **uniquement si** devis clôturé (reçu émis). Sinon désactivé + message.
3. **Modification / suppression achat** : uniquement si statut = EN_COURS.
4. **Création devis** : véhicule doit être EN_MAINTENANCE ; liste véhicules = ceux en atelier.
5. **Facture** : liée à véhicule EN_VENTE + client.
6. **Transitions de statut** : toujours via API ; en cas d’erreur 409, afficher le `message` backend (condition non remplie).

---

## Ordre de réalisation recommandé

1. Phase 0 + Phase 1 (auth + dashboard).  
2. Module 1 : achats (liste, création, détail, validation arrivée) → puis stocks disponible / non régulier / régulier → atelier.  
3. Module 2 : charges, devis, factures, reçus, trésorerie, pro forma, rapports.  
4. Module 3 : transit (étapes, documents, alertes).  
5. CRM, Utilisateurs, Paramètres.  
6. Timeline véhicule, exports, alertes in-app, polish.

---

*Document de référence pour l’implémentation frontend ParcAuto Manager — aligné CDC et cartographie.*
