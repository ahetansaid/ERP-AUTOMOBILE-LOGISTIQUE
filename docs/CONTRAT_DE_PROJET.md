# Contrat de projet — Plateforme de gestion pour importateurs automobiles

> Document d'engagement, version 2 — 10 août 2026.
> Sans portée juridique ni commerciale : il sert de référence commune pour tenir le cap.
> Version consultable : https://claude.ai/code/artifact/15b60d77-7dcd-4c26-b12f-24217dd9457d

> **État au 10/08/2026** — les neuf phases sont développées et vérifiées, sur la
> branche `feat/socle-saas` des deux dépôts. Rien n'est appliqué en base : neuf
> migrations attendent. Voir la section 06.

---

## 00 — Le cap

> Remplacer une gestion sous tableur par une plateforme où les erreurs mesurées sont
> **structurellement impossibles** — et la rendre adaptable par toute entreprise du
> secteur, sans développeur.

### Les cinq questions auxquelles la plateforme doit répondre

Toute fonctionnalité qui ne sert aucune de ces questions est hors sujet.

| # | Question | État constaté |
|---|---|---|
| 1 | Combien m'a réellement coûté ce véhicule ? | faux sur 61 % |
| 2 | Quelle marge ai-je faite ? | inconnue sur 74 % |
| 3 | Combien de cash ai-je, et pour combien de temps ? | chaîne rompue 6× |
| 4 | Combien de capital dort en stock, et depuis quand ? | jamais calculé |
| 5 | À quel prix puis-je vendre sans perdre d'argent ? | décidé au feeling |

---

## 01 — Ce qui a été mesuré

Relevé sur cinq documents de production : deux classeurs de calcul de revient, un journal
de trésorerie de 45 journées, un connaissement maritime, une facture fiscale MECeF.

Ces chiffres sont un **échantillon**, pas le modèle du produit. Ce qu'ils établissent, ce
sont les **modes de défaillance** — universels à toute gestion sous tableur.

| Constat | Mesure | Portée |
|---|---:|---|
| Véhicules avec marge connue | 15 / 57 | 26 % |
| Coût de revient ignorant les réparations | 35 / 57 | 61 % |
| Écart entre les deux registres de pièces | 7 643 000 FCFA | 12 conteneurs / 12 |
| Écart sur les réparations reportées | 1 744 875 FCFA | 10 / 15 |
| Ruptures de la chaîne de trésorerie | 6 | dont 8 627 000 FCFA |
| Conteneurs à taux de change mixtes | 6 / 15 | 580 · 600 · 500 |
| Véhicule vendu et facturé, absent des coûts | 1 / 1 | sur 1 facture disponible |

---

## 02 — Les cinq engagements

Règles garanties par le noyau, non négociables. Chacune répond à une défaillance mesurée
et se vérifie par un test objectif. Elles se citent par leur identifiant : « cette
décision viole E3 ».

### E1 — Rien de calculable n'est saisi
- **Pourquoi** : le solde de caisse était retapé chaque matin. Six ruptures, dont une
  journée jamais saisie — 8 627 000 FCFA disparus sans trace.
- **Contrôle** : aucun champ de solde, de total ou de coût de revient n'est éditable.
  Ce sont des sommes, calculées à la lecture.

### E2 — Une donnée n'est écrite qu'une seule fois
- **Pourquoi** : les achats de pièces existaient dans deux registres parallèles,
  divergents sur 12 conteneurs sur 12, pour 7 643 000 FCFA.
- **Contrôle** : une dépense d'atelier apparaît simultanément dans la caisse, le coût du
  véhicule et l'historique du prestataire — sans seconde saisie.

### E3 — Rien ne s'efface, tout se contre-passe
- **Pourquoi** : la journée du 11 juin a disparu, solde redémarré le lendemain.
  Aujourd'hui le journal d'audit ne couvre que 23 écritures sur 52.
- **Contrôle** : couverture d'audit à 100 %, appliquée dans la couche d'accès aux données.
  Une correction produit une écriture inverse, jamais une suppression.

### E4 — Le client adapte les libellés, jamais les règles
- **Pourquoi** : un emprunt de 5 900 000 FCFA figurait en « Recettes », des retraits
  personnels en charges d'exploitation. Le résultat affiché était faux.
- **Contrôle** : toute catégorie créée porte une **nature système** issue d'une liste
  fermée. Le calcul raisonne sur la nature, jamais sur le nom.

### E5 — Une société ne voit jamais les données d'une autre
- **Pourquoi** : tout gérant — `ADMIN` de sa société — peut aujourd'hui lire une autre
  société via `?companyId=`.
- **Contrôle** : filtre société appliqué dans le client Prisma, pas dans les routes.
  Une requête non filtrable est refusée. Test de non-régression automatisé.

---

## 03 — Architecture retenue

Un **noyau invariant** qui garantit la justesse, une **couche de configuration** que
chaque entreprise adapte. Trois mécanismes rendent les deux compatibles.

1. **La nature système** — chaque objet créé par un client porte une nature issue d'une
   liste fermée. Le client nomme et organise ; le noyau ne raisonne que sur la nature.
2. **L'écriture à double axe** — tout mouvement est écrit une fois et porte simultanément
   un objet (axe analytique) et un compte de trésorerie (axe financier).
3. **Le point d'interception unique** — une extension du client Prisma applique à chaque
   écriture le filtre société, le journal d'audit et l'index de recherche.

---

## 04 — Périmètre fonctionnel

| Domaine | Contenu |
|---|---|
| Recherche universelle | Un numéro quelconque (VIN complet ou 6 derniers, conteneur, navire, BL, facture, tiers) ouvre le dossier complet |
| Rapports automatisés | Quotidien / hebdo / mensuel · espace de lecture · cycle Généré → En revue → Approuvé → Diffusé · précisions ancrées · instantané figé |
| Alertes | Moteur de règles sans développeur + bibliothèque fournie · in-app, e-mail, WhatsApp |
| Traçabilité | Audit 100 % · `correlationId` par opération · type d'acteur · chronologie lisible par dossier |
| Acteurs | Tiers séparés des accès · 4 niveaux : éditeur / admin société / interne / externe |
| Coûts | Frais conteneur + répartition auditable · taux datés et figés · multi-devises, parité EUR protégée |
| Stock | Coût de revient décomposé · âge · capital immobilisé · prix plancher |
| Vente | Proforma → facture certifiée → encaissements échelonnés · solde calculé |
| Fiscalité | **Hors périmètre** — voir ci-dessous |
| Terrain | Mobile hors-ligne · WhatsApp · extraction documentaire · export tableur partout |

### Décision du 10/08/2026 — la certification fiscale sort du périmètre

La plateforme **ne produit pas de pièce fiscale certifiée**. Elle édite des
factures et des reçus propres à l'entreprise, et **conserve** la pièce normalisée
établie ailleurs, rattachée au document, au véhicule ou au conteneur concerné.

Ce que cela change :

- le connecteur MECeF et les adaptateurs fiscaux par pays sont **supprimés** —
  ils constituaient le seul blocage réglementaire du projet ;
- trois types de pièce sont ajoutés (`FACTURE_NORMALISEE`, `RECU_NORMALISE`,
  `DOCUMENT_DOUANE`), distincts des PDF que la plateforme produit ;
- le numéro de la pièce externe est **exigé** : sans lui, le rapprochement est
  impossible une fois le fichier archivé ;
- un contrôle signale ce qui a été vendu ou encaissé **sans pièce jointe**.

**Contrepartie assumée** : le document produit par la plateforme est un document
commercial, pas la pièce légale. Le rapprochement entre les deux repose sur la
rigueur de l'utilisateur — d'où le contrôle de présence, et la règle d'alerte
`PIECE_FISCALE_MANQUANTE`.

---

## 05 — Ce que nous réutilisons

Stratégie **additive** : le noyau s'installe à côté de l'existant, les champs actuels
deviennent des valeurs recalculées. Aucune bascule brutale, aucun écran perdu.

| Décision | Éléments |
|---|---|
| **Conservé** | Schéma (24 modèles) · 18 routes · ~30 écrans · RBAC · audit · notifications · `EmailEvent` · uploads S3/R2 · 2FA/reset/sessions · PDF + 4 templates · CommandPalette |
| **Étendu** | `GeneratedReport` (statut, instantané, annotations) · CommandPalette → recherche universelle · `Supplier`/`Client` → tiers unifiés |
| **Modifié** | `ExchangeRate` (historisation) · enums figés → configuration · isolation multi-sociétés |
| **Ajouté** | Ledger double axe · extension Prisma · moteurs configuration / rapports / alertes |

**Deux corrections prioritaires** (phase 0) : l'isolation entre sociétés est contournable
par tout `ADMIN` ; le journal d'audit ne couvre que 23 écritures sur 52 — factures,
achats, reçus et connexions ne laissent aucune trace.

---

## 06 — Le plan

Chaque phase se termine par une **démonstration sur données réelles**, jamais sur un jeu
de test. Une phase non recettée n'ouvre pas la suivante.

| # | Phase | État |
|---|---|---|
| 00 | Fondations de sécurité — isolation, audit 100 %, index, séparation des rôles | **livré** |
| 01 | Noyau d'écritures à double axe (additif) + réconciliation | **livré** |
| 02 | Tiers unifiés et accès externes | **livré** |
| 03 | Recherche universelle et dossier 360° | **livré** |
| 04 | Couche de configuration | **livré** — natures, catégories, comptes, règles |
| 05 | Rapports périodiques et espace d'approbation | **livré** |
| 06 | Moteur d'alertes | **livré** |
| 07 | Modèles métier et installation guidée | **livré** |
| 08 | Répartition des frais et taux datés | **livré** |

Hors plan initial, livré en complément : pièces justificatives, trois modèles
PDF manquants, numérotation des reçus.

### Ce qui reste à faire côté exploitation

1. **Appliquer les neuf migrations**, dans l'ordre et **séparément** — plusieurs
   ajoutent des valeurs d'énumération, que PostgreSQL interdit d'utiliser dans
   la transaction qui les crée.
2. **Initialiser**, dans cet ordre :
   `POST /installation/modele {"code":"IMPORT_AUTO"}`, puis `POST /search/rebuild`,
   puis `POST /alertes/evaluer`.
3. **Tenir la double écriture** jusqu'à concordance (voir ci-dessous).

### La coupure de l'ancienne trésorerie

Chaque flux alimente aujourd'hui l'ancienne table **et** le grand livre. L'écran
`/comptabilite/reconciliation` rend un verdict.

Quand il est concordant **une vingtaine de jours d'affilée** : retirer les cinq
appels `createTreasuryTransaction` dans `src/services/treasuryTransactions.js`,
puis supprimer `src/services/ledgerBridge.js`. Un seul fichier à modifier —
c'était le but du montage.

### Ce qui n'est pas fait

- **Habillage du tableau de bord** : la grammaire visuelle validée en maquette
  n'est pas portée sur l'application. Volontairement différé pendant les phases,
  puisque les écrans étaient en cours de refonte fonctionnelle.
- **Phase terrain** : mobile hors-ligne, WhatsApp, extraction documentaire.
- **Tests automatisés** : aucun. C'est le principal risque résiduel sur un
  système qui calcule des marges.

Phase terrain optionnelle (mobile hors-ligne, WhatsApp, extraction documentaire) : +4 sem.,
à engager après recette du socle.

**Bascule client** : double saisie sur la caisse 3-4 semaines. Quand les deux soldes
concordent 20 jours d'affilée, le tableur s'arrête de lui-même. On ne demande jamais son
abandon — on attend qu'il devienne inutile.

---

## 07 — Hors périmètre

Reporté explicitement, pas refusé. Réexaminé après recette du socle.

- Création de nouveaux types d'objets métier par le client
- Prédiction de prix par apprentissage, tant que l'historique reste sous 200 ventes
- Comptabilité générale, plan comptable complet, liasse fiscale
- Reprise à 100 % de l'historique tableur (seuls stock vivant + trésorerie depuis bascule)
- Agent conversationnel client, registre distribué, notation automatique des clients
- Refonte visuelle des écrans existants (refactorisés au fil des phases, pas redessinés)

---

## 08 — Signaux de dérive

Si l'un apparaît, on s'arrête et on réexamine avant d'ajouter la moindre ligne de code.

- Une saisie courante réclame plus de 4 champs obligatoires
- Un chiffre doit être recopié d'un écran à un autre — **E2 tombe**
- Une phase dépasse 130 % de son estimation
- Une fonctionnalité ne sert aucune des cinq questions de la section 00
- Un calcul de coût est dupliqué hors du moteur de coût
- Un écran affiche un total modifiable à la main

---

## 09 — Décisions en attente

| Question | État |
|---|---|
| Certification fiscale sur la plateforme ? | **Tranché** — non, la pièce est uploadée (section 04) |
| Un client peut-il créer de nouveaux types d'objets ? | **Tranché** — non : objets fixes, champs et étapes libres |
| Une facture peut-elle porter plusieurs véhicules ? | **Tranché de fait** — non, `Invoice.vehicleId` reste unique |
| **Les taux 580 / 600 / 500 : erreurs ou taux négociés ?** | **Ouvert** — bloque la reprise de l'historique |
| **EURO / USA : une personne sur deux parcs, ou deux homonymes ?** | **Ouvert** — les fusions sont proposées, non appliquées |
| Une entreprise = une société ou un groupe ? | **Ouvert** — sans impact tant qu'un seul client est en service |

Les deux questions en gras ont un effet concret et attendent un arbitrage.

**Les taux.** Six conteneurs sur quinze mélangent 580, 600 et parfois 500. Si ce
sont des erreurs de copier-coller, la reprise doit les normaliser ; si ce sont
des taux réellement négociés par opération, il faut les conserver tels quels. La
plateforme sait faire les deux — elle ne peut pas deviner lequel est vrai.

**EURO / USA.** « Jean · Peintre EURO » et « Jean · Peintre USA » sont suivis
séparément, avec des volumes distincts. Le rapprochement des noms a été rendu
volontairement conservateur : deux tiers qu'on peut fusionner d'un clic valent
mieux qu'un seul qu'on ne peut plus séparer.
