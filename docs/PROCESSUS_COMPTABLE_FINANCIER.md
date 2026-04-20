# Processus comptable et financier — ParcAuto Manager

Document de référence pour le cahier des charges et les développeurs.  
Décrit les 4 processus principaux et leurs sous-processus.

---

## 1. Gestion des devis atelier (réparations)

Lorsqu’un véhicule est envoyé en atelier, le système doit permettre de **créer un ou plusieurs devis** liés au véhicule. Un devis peut être lié à **un ou plusieurs prestataires** (ex. mécanique, électricité, carrosserie, peinture).

### 1. Création du devis

Chaque devis doit contenir :

| Champ | Description |
|-------|-------------|
| Véhicule concerné | Référence au véhicule en maintenance |
| Prestataire(s) | Un ou plusieurs prestataires |
| Description des travaux | Libellé / détail |
| Montant total du devis | En FCFA (ou devise avec équivalent) |
| Date | Date du devis / validité |
| Statut | En cours, Non clôturé, Clôturé |

**Statuts possibles :** **En cours** | **Non clôturé** | **Clôturé**

### 2. Paiement des devis (reçus atelier)

Les paiements des réparations se font avec des **reçus liés au devis**. À chaque reçu émis, le système calcule le **solde restant** du devis.

### 3. Calcul du solde restant

**Premier paiement :** Solde restant = max(0, montant du devis − montant payé)

*Exemple :* Devis 500 000 FCFA, paiement 200 000 → Solde = 300 000. Devis reste **Non clôturé**.

### 4. Paiements suivants

On utilise le **solde restant précédent**. Nouveau solde = Solde restant précédent − nouveau montant payé.

*Exemple :* Devis 500 000 — Paiement 1 : 200 000 → Solde 300 000. Paiement 2 : 100 000 → Solde 200 000. Paiement 3 : 200 000 → Solde 0.

### 5. Clôture automatique du devis

Lorsque **solde restant = 0** :

- le statut du devis → **Clôturé** ;
- la date de clôture est enregistrée ;
- **blocage** de l’émission de nouveaux reçus pour ce devis.

### 6. Cas paiement partiel

Si **solde restant > 0** : le reçu est émis, le montant restant apparaît, le devis reste **Non clôturé**.

### 7. Consultation du devis

La fiche devis affiche : **véhicule concerné**, **prestataire**, **montant total**, **liste des reçus**, **montants payés**, **solde restant**, **statut**, **date de clôture** (si clôturé).

### 8. Règle de sécurité

Le système **empêche** l’émission de reçu si **solde restant = 0**. Message : *« Ce devis est entièrement réglé. »*

### 9. Différence devis / facture

| Élément | Devis | Facture |
|--------|--------|---------|
| Concerne | Réparations (atelier) | Vente véhicule |
| Lié à | Prestataire | Client |
| Impact | Charges | Revenus |
| Module | Atelier | Vente |

### 10. Cycle complet réparation

Véhicule → Atelier → Création devis → Paiement(s) → Solde restant → Clôture devis (solde = 0) → Historique réparation.

---

## 2. Émission des reçus liés aux devis

Les paiements des réparations se font via des **reçus liés aux devis**. Seuls les devis avec **solde restant > 0** peuvent recevoir un nouveau reçu. Si solde = 0 (devis clôturé), message *« Ce devis est entièrement réglé. »* et blocage de l’émission.

### Logique de calcul

Pour chaque reçu :

- **Montant restant** = Montant du devis − Total des reçus déjà émis

#### Cas 1 : Paiement total

**Si** : montant restant = 0 (après émission du reçu)

**Alors** :

- le devis passe au statut : **Clôturé** ;
- le système enregistre :
  - date de clôture ;
  - informations du paiement.

#### Cas 2 : Paiement partiel

**Si** : montant restant > 0

**Alors** :

- le reçu est émis ;
- le montant restant apparaît sur le reçu ;
- le devis reste au statut : **Non clôturé**.

### Fiche du devis

La fiche du devis doit afficher : **véhicule concerné**, **prestataire**, **description**, **montant total**, **liste des reçus** (date, montant), **montants payés**, **solde restant**, **statut**, **date de clôture** (si clôturé).

### Règle de sécurité devis

Bloquer l’émission de reçu si **solde restant = 0**. Message : *« Ce devis est entièrement réglé. »*

### Différence devis / facture

| Élément | Devis | Facture |
|--------|--------|---------|
| Concerne | Réparations (atelier) | Vente véhicule |
| Lié à | Prestataire | Client |
| Impact | Charges | Revenus |
| Module | Atelier | Vente |

### Cycle réparation

Véhicule → Atelier → Création devis → Paiement(s) → Solde restant → Clôture devis (si solde = 0) → Historique réparation.

---

## 3. Facturation des véhicules (stock non régulier)

Ce processus concerne les véhicules du **stock non régulier** (en vente).

**Architecture : 1 véhicule = 1 facture.** Une seule facture par véhicule ; les paiements se font via des reçus sur cette facture. Le système empêche de créer une nouvelle facture si le véhicule a déjà une facture. Solde = prix de vente − somme(reçus).

- Lorsqu’un véhicule est vendu : on crée **une** facture (si le véhicule n'a pas déjà de facture), basée sur le **prix de vente** du véhicule. **Règle : 1 véhicule = 1 facture** ; les paiements suivants se font via des reçus sur cette facture.

### Logique de calcul du solde d’une vente de véhicule

Le système suit le **solde restant à payer** après chaque paiement (paiement échelonné avec solde cumulatif).

#### 1. Calcul initial du solde (premier paiement)

**Formule :** Solde restant = max(0, prix de vente − montant payé)

**Exemple :** Prix 5 000 000 FCFA, paiement 2 000 000 → Solde restant = 3 000 000. La facture reste **non clôturée**.

#### 2. Paiements suivants

On ne reprend plus le prix de vente : on utilise le **solde restant précédent**.

**Formule :** Nouveau solde restant = Solde restant précédent − nouveau montant payé

(Équivalent à : Solde = prix de vente − total des reçus émis.)

**Exemple :** Solde précédent 3 000 000, paiement 1 000 000 → Nouveau solde = 2 000 000. Puis paiement 2 000 000 → Solde = 0.

#### 3. Cas où le solde restant = 0

**Alors :**

- la facture passe au statut : **Clôturée** ;
- la date de clôture est enregistrée ;
- le bouton **Clôturer la vente** devient actif ;
- **Aucune nouvelle facture ni nouveau reçu** ne doit être émis pour ce véhicule.

**Règle système :** Si solde restant = 0 → blocage de toute nouvelle émission de facture ou de reçu pour cette facture. Message possible : *« La facture de ce véhicule est entièrement réglée. »*

#### 4. Logique complète

| Solde restant | Action |
|---------------|--------|
| > 0 | Autoriser émission de reçu ; recalculer le solde après chaque paiement. |
| = 0 | Bloquer nouvelle facture et nouveau reçu ; statut facture = Clôturée. |

#### 5. Historique des paiements (fiche facture)

La facture doit afficher : **prix de vente**, **liste des paiements** (date + montant de chaque paiement), **solde restant**, **statut facture**.

#### 6. Résumé du flux

Prix de vente → Paiement 1 → Solde restant → Paiement 2 → Nouveau solde → … → Solde = 0 → Facture clôturée → Activation bouton « Clôturer la vente ».

---

### Émission des reçus de facture

Lorsqu’un paiement est reçu :

- **Solde restant** = Prix de vente − Total des reçus émis (ou : solde précédent − montant du reçu).

#### Cas 1 : Paiement total (solde = 0)

**Alors** : facture **Clôturée**, date de clôture enregistrée, bouton « Clôturer la vente » actif. **Aucun nouveau reçu** possible pour cette facture.

#### Cas 2 : Paiement partiel (solde > 0)

**Alors** : reçu émis, solde restant affiché sur le reçu, facture reste **non clôturée**.

### Contenu de la facture

La facture doit afficher :

- prix de vente ;
- liste des reçus (date, montant) ;
- montant payé (total des reçus) ;
- solde restant ;
- statut facture.

---

## 4. Gestion des paiements échelonnés

Si la vente est **échelonnée** :

- la facture doit contenir :
  - liste des paiements ;
  - montant de chaque paiement ;
  - date de chaque paiement.

### Paiement final

**Lorsque** le dernier paiement est effectué **et que** : montant restant = 0

**Alors** le système :

- active un bouton : **Générer facture définitive**.

### Facture définitive

Cette facture doit contenir :

- prix total du véhicule ;
- liste des paiements ;
- dates des paiements ;
- total payé.

Elle peut être :

- téléchargée ;
- consultée.

---

## 5. Clôture de la vente du véhicule

Une fois la facture **totalement payée** :

- le bouton **Clôturer la vente** devient actif.

### Lors du clic sur « Clôturer la vente »

Le système :

1. **change le statut du véhicule** ;
2. **déplace le véhicule** : **Stock non régulier** → **Stock régulier** ;
3. le véhicule devient : **Statut : Vendu**.

### Historique véhicule

La fiche véhicule doit contenir :

- achat ;
- réparations ;
- devis ;
- ventes ;
- paiements ;
- factures ;
- reçus.

### Sortie du parc

Un bouton doit permettre : **Marquer sortie du parc**.

Cela signifie que le véhicule est **physiquement livré au client**.

---

## 6. Processus de trésorerie

Le module trésorerie doit générer des **rapports financiers** :

- hebdomadaire ;
- mensuel ;
- annuel.

### Décaissements (dépenses)

#### 1. Achats de véhicules

Chaque achat doit afficher :

- liste des véhicules achetés ;
- prix d’achat ;
- fournisseur.

Un champ doit permettre d’ajouter : **Prix de transport global**.

Le système calcule :

- **Coût total achat** = Somme (véhicules) + transport.

#### 2. Frais de réparation

Pour chaque véhicule, le système récupère automatiquement :

- devis ;
- réparations ;
- paiements atelier.

#### 3. Charges diverses

Exemples : salaires, location, carburant, frais administratifs.

---

## 7. Encaissements

Les encaissements proviennent :

- des factures de vente ;
- des reçus clients.

Chaque reçu doit contenir :

- client ;
- véhicule ;
- montant ;
- date.

Le système calcule : **Total encaissé**.

---

## 8. Calcul du bénéfice

Le système doit calculer **automatiquement** :

**Bénéfice** = Total encaissements − Total décaissements

### Décaissements

- achats véhicules ;
- transport ;
- réparations ;
- charges.

### Encaissements

- ventes véhicules ;
- paiements clients.

---

## 9. Résultat financier

Le système doit afficher :

- bénéfice **hebdomadaire** ;
- bénéfice **mensuel** ;
- bénéfice **annuel**.

---

## Synthèse des statuts et boutons

| Contexte | Condition | Action système / bouton |
|----------|-----------|-------------------------|
| Devis | Montant restant = 0 après reçu | Devis → **Clôturé** ; enregistrer date et infos paiement |
| Facture | Montant restant = 0 après reçu | Facture → **Clôturée** ; **activer** « Clôturer la vente » |
| Vente | Utilisateur clique « Clôturer la vente » | Véhicule : EN_VENTE → **VENDU** ; Stock non régulier → Stock régulier |
| Véhicule vendu | Livraison physique | Bouton **Marquer sortie du parc** |

---

*Document aligné avec le CDC et les processus métier ParcAuto Manager. À mettre à jour en cas d’évolution des règles.*
