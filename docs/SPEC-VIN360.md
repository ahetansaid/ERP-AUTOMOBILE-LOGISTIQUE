# Spécification : Gestion 360° centrée sur le VIN (Numéro de Châssis)

**Version** : 1.0  
**Date** : Février 2025  
**Contexte** : ERP Automobile & Logistique — Intégration locale Bénin (Abomey-Calavi)  
**Références** : CDC §5 Parc Auto, §6 Transit & Douane, §7 Compta & Finance, §10 Fonctionnalités avancées (IA)

---

## 1. Vue d’ensemble

La fonctionnalité **VIN 360°** centralise toutes les données et opérations autour du **numéro de châssis (VIN)**. Elle assure une gestion de bout en bout : entrée/sortie stock, proformas internes, facturation normalisée DGI Bénin (MECeF), et gestion des documents liés (stockage, OCR, liaison aux opérations, **génération** de documents type Connaissement Maritime).

### 1.1 Objectifs

| Objectif | Description |
|----------|-------------|
| **Traçabilité** | Une fiche véhicule = un VIN = historique complet (achat → transit → douane → vente) |
| **Documents** | Stockage + OCR + **génération** (BL, proformas, factures MECeF) liés au VIN |
| **Conformité Bénin** | Factures normalisées MECeF (QR code, code fiscal), conformité DGI |
| **Estimations** | Proformas internes pour coûts douane/transit et paiements échelonnés |

### 1.2 Périmètre fonctionnel

- **Entrée/Sortie** : Suivi stock (achat, transit, dédouanement, vente) — aligné CDC §5.
- **Proformas internes** : Génération automatique pour estimations (douane, transit) et paiements échelonnés.
- **Facture normalisée** : Génération factures conformes DGI Bénin (e-MECeF), QR code et code fiscal.
- **Documents liés** : Repository par VIN, OCR automatique, liaison à chaque opération, **génération** de documents (ex. Connaissement Maritime type BL).

---

## 2. VIN comme clé centrale

- **VIN** : champ unique obligatoire (ou numéro châssis en alternative).
- Toute entité métier (opération, document, charge, client) est reliée au **véhicule** identifié par VIN.
- **Vue 360°** = fiche véhicule avec onglets / timeline : Infos véhicule | Transit | Documents | Charges & rentabilité | Facturation | Historique.

---

## 3. Gestion des documents liés au VIN

### 3.1 Types de documents

| Type | Usage | OCR | Génération |
|------|--------|-----|------------|
| **Connaissement Maritime (B/L)** | Preuve embarquement, transit | Oui | Oui (template) |
| Facture achat | Coût d’acquisition | Oui | Non |
| Quittance (ex. IMV SESUR) | Paiement douane / transit | Oui | Non (ou template si standard) |
| Facture normalisée MECeF | Vente client, conformité DGI | — | Oui (obligatoire) |
| Proforma interne | Estimation coûts / échéancier | — | Oui |
| Photos véhicule | État, défauts | Optionnel (IA) | Non |
| Déclaration douane, certificats | Dédouanement | Oui | Optionnel |

### 3.2 Connaissement Maritime (Bill of Lading) — Structure pour OCR et génération

D’après le document type fourni (ex. port Cotonou, BJB01), les champs ci-dessous sont à **extraire par OCR** et à **exposer pour la génération** de BL.

#### En-tête et identification

| Champ | Exemple / Description | OCR | Génération |
|-------|------------------------|-----|------------|
| Office | BJB01 | Oui | Oui (config tenant) |
| Port d’opération | COTONOU-PORT (RP) | Oui | Oui |
| Manifest | 9896 | Oui | Oui |
| Date/Heure d’arrivée | 19/11/2025 02:00 | Oui | Oui (étape transit) |
| Voyage | 2542S | Oui | Oui |
| Type de B/L | CMD | Oui | Oui |
| Référence B/L (B/L ref. no.) | HLCUBSC251066567MC | Oui | Oui (généré ou saisi) |
| Nature | 24 | Oui | Oui |
| Document précédent (Prev. Doc.) | HLCUBSC251 | Oui | Oui |
| UCR | — | Oui | Oui |

#### Parties

| Champ | Exemple | OCR | Génération |
|-------|---------|-----|------------|
| Exportateur / Shipper | WORLD PAC LOGISTICS INC. 186 | Oui | Oui (fiche transit) |
| Consignataire / Consignee | STE KADIE AUTO ILOT 780… COTONOU | Oui | Oui (client / entreprise) |
| Notifier | SAME AS CONSIGNEE | Oui | Oui |

#### Transport

| Champ | Exemple | OCR | Génération |
|-------|---------|-----|------------|
| Lieu de chargement (Place of loading) | MAPTM TANGER MED | Oui | Oui (port embarquement) |
| Lieu de déchargement (Place of unloading) | BJCOO COTONOU | Oui | Oui (port destination) |
| Mode de transport | Maritime | Oui | Oui |
| Identifiant transport | SPIRIT OF SINGAPO | Oui | Oui (compagnie maritime) |
| Nationalité transport | ILE DE MAN | Oui | Oui |
| Transporteur (Carrier) | — | Oui | Oui |

#### Marchandise (véhicule) — cœur VIN 360°

| Champ | Exemple | OCR | Génération |
|-------|---------|-----|------------|
| Marques et n° colis / Packages Marks & nb. | 2013 TOYOTA 4RUNNER **VIN: JTEBU5JR6D5136791** | Oui | Oui (parc auto : marque, modèle, VIN) |
| Type de colis | VN (Véhicule nu) | Oui | Oui |
| Détail supplémentaire | Véhicule nu | Oui | Oui |
| Colis manifestés | 1 | Oui | Oui |
| Masse brute manifestée | 2 121,00 | Oui | Oui (poids véhicule) |
| Volume (CBM) | 2 121,00 | Oui | Oui |
| Description des marchandises | 2013 TOYOTA 4RUNNER VIN: JTEBU5JR6D5136791 | Oui | Oui |

#### Financier / Douane

| Champ | OCR | Génération |
|-------|-----|------------|
| Fret (Freight) | Oui | Oui (module compta) |
| Valeur déclarée pour douanes | Oui | Oui |

#### Annotations

- **Annotations manuscrites** (ex. « G.T.S » sur le document fourni) : stockage en métadonnée (commentaire ou champ « annotation ») après numérisation ; pas de génération automatique.

### 3.3 Flux documentaire

1. **Upload** : Fichier associé au VIN + type (BL, facture, quittance, etc.).
2. **OCR** : Extraction des champs selon le type ; pré-remplissage fiche transit / parc / compta.
3. **Liaison** : Document lié à l’opération (étape transit, achat, dédouanement, vente).
4. **Génération** : Pour BL et proformas/factures, génération à partir des données ERP (parc + transit + compta), avec template conforme au modèle cible (ex. BL type Cotonou).

---

## 4. Proformas internes (paiements échelonnés)

- **Objectif** : Estimations internes (coûts douane, transit, total) et échéancier de paiement (acomptes, échelonnement).
- **Contenu type** : VIN, descriptif véhicule, coûts estimés par catégorie (achat, fret, douane, etc.), total estimé, échéancier (dates + montants), conditions.
- **Génération** : Automatique à partir des données du véhicule et des paramètres de coûts (taux, barèmes).
- **Différence avec facture MECeF** : Document interne ou pré-vente ; pas de transmission DGI. La facture finale (MECeF) est générée à la vente.

---

## 5. Facturation normalisée DGI Bénin (MECeF)

### 5.1 Conformité e-MECeF

- **e-MECeF** : Plateforme DGI (https://e-mecef.impots.bj/) pour factures normalisées.
- **Deux modes** :  
  - **e-SFE** : utilisation du portail DGI sans SFE.  
  - **SFE (Système de Facturation d’Entreprise)** : logiciel agréé DGI (notre ERP) ; intégration API / flux définis par la DGI.
- Pour l’ERP : viser l’**agrément SFE** pour générer les factures depuis l’ERP puis les transmettre à la DGI (code MECeF/DGI, QR code).

### 5.2 Exigences facture normalisée

| Exigence | Description |
|----------|-------------|
| **Format** | Facture normalisée conforme au modèle DGI (PDF éditable, états périodiques si requis). |
| **QR code** | Présent sur la facture ; vérifiable via l’app mobile MECeF (DGI). |
| **Code fiscal / MECeF** | Code retourné par la DGI après transmission (à stocker et afficher). |
| **Identification entreprise** | Numéro IFU et autres informations requises par la DGI. |
| **Articles et taxation** | Groupes de taxation et articles conformes aux règles DGI. |

### 5.3 Lien avec le VIN 360°

- Facture de vente = **une facture par véhicule (VIN)** (ou regroupement explicite si cas particulier).
- À la vente : génération de la facture MECeF depuis la fiche véhicule (client, montant, articles), transmission DGI, enregistrement du code MECeF et du PDF dans les documents liés au VIN.

---

## 6. Intégration dans les modules existants (CDC)

| Module CDC | Extension VIN 360° |
|------------|--------------------|
| **§5 Parc automobile** | VIN clé unique ; vue 360° ; documents et génération BL liés au VIN. |
| **§6 Transit & Douane** | Saisie/OCR BL ; génération BL depuis les données transit ; champs BL alignés sur la structure ci-dessus (ports, navire, consignataire, etc.). |
| **§7 Comptabilité & Finance** | Charges par VIN ; proformas internes ; facture MECeF par VIN à la vente ; relance liée au client/VIN. |
| **§10 Fonctionnalités avancées** | OCR (BL, factures, quittances) ; IA optionnelle pour catégorisation photos / extraction. |

---

## 7. Modèle de données (conceptuel)

- **Vehicle** : `id`, `vin` (unique), `chassisNumber`, marque, modèle, année, type, statut, client_id, etc.
- **Document** : `id`, `vehicle_id` (VIN), `type` (BL, FACTURE_ACHAT, QUITTANCE, FACTURE_MECEF, PROFORMA, …), `fileStoragePath`, `ocrPayload` (JSON des champs extraits), `generatedFromTemplate` (bool), `operation_id` (optionnel).
- **TransitStep** / **Operation** : lié au véhicule ; champs alignés sur le BL (port départ/arrivée, date arrivée, navire, consignataire, etc.) pour alimenter la **génération** du BL.
- **Invoice** (MECeF) : `id`, `vehicle_id`, `mecefCode`, `qrCodePath`, `pdfPath`, `sentAt`, etc.
- **Proforma** : `id`, `vehicle_id`, `estimatedCosts` (JSON ou lignes), `schedule` (échéancier), `pdfPath`.

---

## 8. Roadmap recommandée

| Phase | Périmètre VIN 360° |
|-------|---------------------|
| **MVP** | VIN clé unique ; stockage documents par VIN ; liaison document ↔ opération ; OCR BL (extraction champs essentiels : VIN, ports, dates, consignataire). |
| **Phase 2** | Génération BL (template type Cotonou) ; proformas internes ; préparation facture MECeF (modèle + QR/code fiscal). |
| **Phase 3** | Agrément SFE et intégration API DGI ; facture MECeF pleinement générée et transmise depuis l’ERP. |

---

## 9. Références

- CDC ERP Automobile & Logistique (sections 5, 6, 7, 10).
- Document type : Connaissement Maritime (ex. BJB01, COTONOU-PORT) — champs détaillés en §3.2.
- e-MECeF Bénin : https://e-mecef.impots.bj/ — https://sygmef.impots.bj/emcf.
- Guide facturation normalisée DGI (PDF) : à utiliser pour le format exact et les champs obligatoires.
