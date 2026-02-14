# Spécification fonctionnelle globale — ERP Automobile & Logistique

Document de référence pour les évolutions du système. Les clients et opérations sont **liés dynamiquement** : toute opération impliquant un client doit utiliser les **clients enregistrés au CRM** (sauf prestataires externes).

---

## 1. Parc automobile — Gestion du stock (modèle « stock »)

### 1.1 Sous-menus du Parc automobile

| Sous-menu                         | Description                                                                                                                 | Règle métier                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Stock disponible (régularisé)** | Véhicules dont la situation comptable est réglée : client a payé selon la compta **ou** véhicule sans facturation à solder. | **Nature du stock** : Dépôt, Transit, Autres.              |
| **Stock non régularisé**          | Véhicules en attente de régularisation : client a payé **en partie** ou paiement en cours selon la compta.                  | Permet d’identifier les véhicules à solder ou à encaisser. |

### 1.2 Informations obligatoires par véhicule

Pour **tous** les véhicules (liste et détail), les informations suivantes doivent être disponibles :

- Données véhicule existantes (VIN, marque, modèle, année, statut, etc.)
- **Numéro BL** (Connaissement / Bon de livraison)
- **Date d’entrée sur le Port**
- **Date d’entrée sur le Parc**
- **Nombre de jours passés sur le parc** (calculé : aujourd’hui − date d’entrée parc, ou date de sortie − date d’entrée parc)

### 1.3 Lien compta ↔ statut véhicule

- **Régularisé** = situation comptable clôturée pour ce véhicule (facture complète soldée ou pas de facture à solder).
- **Non régularisé** = facture temporaire (avance) ou facture complète non soldée → impacte le statut du/des véhicule(s) concerné(s).

---

## 2. CRM Client

### 2.1 Vue 360° client

- **Respiration de toutes les opérations** liées au client dans le système :
  - Véhicules achetés / vendus / en cours
  - Factures et devis
  - Paiements (avances, soldes)
  - Opérations de transit / douane liées
  - Documents associés

### 2.2 Export

- **Export de la liste des clients** :
  - **PDF**
  - **Excel**

_(Les clients du CRM sont la seule source pour « client » dans les autres modules ; pas de client libre sauf prestataires externes.)_

---

## 3. Transit et douane — Gestion professionnelle

### 3.1 Périmètre

- **CRUD complet** des opérations de douane et de transit.
- **Toutes les informations possibles** pour chaque type d’opération.

### 3.2 Catégorisation des opérations

| Catégorie                        | Contenu                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| **Transit maritime**             | Infos navires ; infos conteneurs ; suivi des mouvements.                             |
| **Transit de véhicules**         | Suivi véhicules en transit (lié au parc).                                            |
| **Dédouanement client**          | Opérations de dédouanement rattachées au client (CRM).                               |
| **Gestion des achats véhicules** | Toutes les informations nécessaires à la déclaration compta ; **lieu d’expédition**. |
| **Imports / Exports**            | Gestion **en amont** et **en aval** (préparation, suivi, clôture).                   |

### 3.3 Lien compta

- Les éléments nécessaires à la **déclaration comptable** doivent être renseignés et disponibles pour la compta (charges, factures, écritures).

---

## 4. Comptabilité — Factures, devis, reçus, rapports

### 4.1 Séparation Factures / Devis

- **Devis** : gestion dédiée (création, modification, conversion en facture).
- **Factures** : deux types distincts.

### 4.2 Types de factures

| Type                            | Description                         | Impact                                                                                                  |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Facture temporaire (avance)** | Client paie une **avance**.         | Impacte le ou les **véhicules concernés** : statut **régularisé** ou **non régularisé** selon le solde. |
| **Facture complète**            | Montant à **solder** par le client. | Une fois soldée → véhicule(s) concerné(s) passent en situation **régularisée**.                         |

### 4.3 Devis

- Gestion complète des devis (CRUD, statut : brouillon, envoyé, accepté, refusé, converti en facture).

### 4.4 Reçus pour prestataires externes

- **Gestion des reçus** émis pour des **prestataires externes** (hors clients CRM).
- Les prestataires externes sont la seule exception au « tout client = CRM ».

### 4.5 Rapports de comptabilité

- **Toutes les informations possibles** doivent figurer dans les rapports :
  - Opérations (charges, encaissements, factures, devis, reçus).
  - Synthèses par période, par client, par véhicule, par type.
- **Saisie d’autres infos** : possibilité d’ajouter des commentaires ou champs complémentaires dans les rapports (notes, références, etc.).

### 4.6 Génération PDF

- **Factures**, **reçus** et **rapports** doivent pouvoir être **générés en PDF** avec :
  - **Logo** de la société
  - **Informations de la société** (nom, adresse, SIRET, etc.)

---

## 5. Gestion des documents

- **Import de documents** : possibilité d’importer **tout type de document** (pas de restriction par nature).
- Rattachement possible aux entités : véhicule, client, opération de transit, facture, etc.
- Stockage sécurisé et traçabilité (qui a déposé, quand).

---

## 6. Règles transversales

### 6.1 Clients

- **Toute opération impliquant un client** (vente, facture, devis, transit, dédouanement, etc.) doit utiliser un **client enregistré au CRM**.
- **Exception** : **prestataires externes** (pour reçus et certaines charges) — pas obligatoirement dans le CRM comme « client ».
- Données **liées dynamiquement** : mise à jour client → cohérence dans tout le système.

### 6.2 Automatisation

- Les liens **client ↔ véhicule ↔ facture ↔ paiement ↔ transit** sont **automatiques** et **dynamiques** dès que les données sont renseignées (pas de double saisie client « libre » côté facture si c’est un client final).

### 6.3 PDF et identité société

- **Factures**, **reçus** et **rapports** : génération PDF avec **logo** et **informations de la société** (paramétrage central : nom, adresse, logo, etc.).

---

## 7. Synthèse des livrables à prévoir

| Module               | Évolutions principales                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Parc automobile**  | Sous-menus Stock disponible (régularisé) / Stock non régularisé ; champs BL, dates Port/Parc, nombre de jours sur parc ; lien statut compta ↔ régularisé.            |
| **CRM**              | Vue 360° opérations par client ; export liste clients PDF + Excel.                                                                                                   |
| **Transit & douane** | CRUD complet ; catégories (maritime, véhicules, dédouanement, achats, import/export amont/aval) ; infos navires/conteneurs ; lieu d’expédition ; lien compta.        |
| **Comptabilité**     | Séparation Factures / Devis ; factures temporaires (avance) vs complètes ; reçus prestataires ; rapports complets + saisie d’infos ; PDF avec logo et infos société. |
| **Documents**        | Import tout type de document ; rattachement aux entités.                                                                                                             |
| **Paramétrage**      | Infos société + logo pour génération PDF.                                                                                                                            |

---

_Document créé pour alignement fonctionnel. À utiliser comme base pour les spécifications techniques et le planning de développement._
