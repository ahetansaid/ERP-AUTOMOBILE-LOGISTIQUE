# Rapport : API Backend attendue par le frontend

**Projet** : ERP Automobile & Logistique  
**Frontend** : Next.js (ce dépôt)  
**Backend** : Node.js + MySQL (dossier séparé)  
**Date** : Février 2025

Ce document décrit **tous les endpoints et formats** que le frontend appelle. Aucune donnée n’est mockée côté frontend : tout doit provenir du backend.

---

## 1. Base URL et authentification

- **Base URL** : configurée via `NEXT_PUBLIC_API_URL` (ex. `http://localhost:3001`).
- **Authentification** : JWT envoyé dans le header `Authorization: Bearer <accessToken>` sur toutes les requêtes (sauf login et refresh).
- **Refresh** : le frontend peut renvoyer le `refreshToken` pour obtenir un nouveau `accessToken` (à implémenter côté front si besoin).

---

## 2. Auth

### 2.1 `POST /auth/login`

**Body (JSON)**  
```json
{
  "email": "string",
  "password": "string"
}
```

**Réponse attendue (200)**  
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 900,
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string | null",
    "lastName": "string | null",
    "role": "SUPER_ADMIN | ADMIN | COMPTABLE | AGENT_TRANSIT | COMMERCIAL | CLIENT"
  }
}
```

**Erreur (4xx)**  
```json
{
  "message": "string",
  "statusCode": 401
}
```

Le frontend stocke `accessToken`, `refreshToken` et `user` (localStorage) et redirige vers `/dashboard`. En cas d’erreur ou d’absence de `accessToken`/`refreshToken`, il affiche le message d’erreur.

---

### 2.2 `POST /auth/refresh`

**Body (JSON)**  
```json
{
  "refreshToken": "string"
}
```

**Réponse attendue (200)**  
Même forme que login : `accessToken`, `refreshToken`, `expiresIn`, optionnellement `user`.

---

### 2.3 `POST /auth/logout`

**Body (JSON)**  
```json
{
  "refreshToken": "string"
}
```

**Réponse attendue (200)**  
```json
{ "success": true }
```

---

### 2.4 `GET /auth/me` (optionnel)

**Headers** : `Authorization: Bearer <accessToken>`

**Réponse attendue (200)**  
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string | null",
  "lastName": "string | null",
  "role": "string"
}
```

Utilisé pour rafraîchir les infos utilisateur sans refaire un login.

---

## 3. Véhicules (Parc automobile)

### 3.1 `GET /vehicles`

Liste des véhicules, avec filtres optionnels en query.

**Query params (tous optionnels)**  
- `search` : string (recherche sur VIN, marque, modèle, nom client)  
- `status` : un des statuts (ex. `EN_TRANSIT`, `VENDU`)  
- `page` : number (pagination)  
- `limit` : number (taille de page)

**Réponse attendue (200)**  
```json
{
  "data": [
    {
      "id": "string",
      "vin": "string",
      "chassisNumber": "string | null",
      "brand": "string",
      "model": "string",
      "year": 2020,
      "vehicleType": "string | null",
      "status": "string",
      "clientId": "string | null",
      "clientName": "string | null",
      "purchasePrice": "number | null",
      "salePrice": "number | null",
      "currency": "string | null",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total": 42
}
```

Statuts attendus côté frontend : `ACHETE`, `EN_TRANSIT`, `ARRIVE_PORT`, `EN_DOUANE`, `DEDOUANE`, `LIVRE`, `VENDU`.

---

### 3.2 `GET /vehicles/:id` ou `GET /vehicles/vin/:vin`

Détail d’un véhicule (pour la vue VIN 360°).

**Réponse attendue (200)**  
Un seul objet véhicule, même structure qu’un élément de `data` ci-dessus, avec champs additionnels possibles (ex. `transitSteps`, `documents`, `charges`) selon votre implémentation.

**Réponse attendue (404)**  
```json
{
  "message": "Véhicule non trouvé",
  "statusCode": 404
}
```

Le frontend utilise soit `id` soit `vin` selon ce que le backend expose (ex. `GET /vehicles/by-vin/JTEBU5JR6D5136791`).

---

### 3.3 `POST /vehicles`

Création d’un véhicule (page « Nouveau véhicule »).

**Body (JSON)**  
```json
{
  "vin": "string",
  "chassisNumber": "string | null",
  "brand": "string",
  "model": "string",
  "year": 2020,
  "vehicleType": "string | null"
}
```

**Réponse attendue (201)**  
Objet véhicule créé (même structure qu’en 3.1).

**Erreur (4xx)**  
```json
{
  "message": "string",
  "statusCode": 400
}
```

---

### 3.4 `PATCH /vehicles/:id` ou `PUT /vehicles/:id`

Mise à jour d’un véhicule (statut, client, prix, etc.).

**Body (JSON)**  
Champs partiels à mettre à jour.

**Réponse attendue (200)**  
Objet véhicule mis à jour.

---

## 4. Clients (CRM)

### 4.1 `GET /clients`

Liste des clients.

**Query params (optionnels)**  
- `search` : string  
- `page`, `limit` : number

**Réponse attendue (200)**  
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string | null",
      "phone": "string | null",
      "address": "string | null",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

---

### 4.2 `GET /clients/:id`

Détail d’un client (fiche CRM).

**Réponse attendue (200)**  
Un objet client (même structure qu’au-dessus). Optionnel : champ `vehicles` (liste des véhicules liés).

**Réponse attendue (404)**  
```json
{
  "message": "Client non trouvé",
  "statusCode": 404
}
```

---

### 4.3 `POST /clients`

Création d’un client.

**Body (JSON)**  
```json
{
  "name": "string",
  "email": "string | null",
  "phone": "string | null",
  "address": "string | null"
}
```

**Réponse attendue (201)**  
Objet client créé.

---

### 4.4 `PATCH /clients/:id` ou `PUT /clients/:id`

Mise à jour d’un client.

**Body (JSON)**  
Champs partiels.

**Réponse attendue (200)**  
Objet client mis à jour.

---

## 5. Dashboard (KPIs et graphiques)

### 5.1 `GET /dashboard/stats`

Indicateurs agrégés pour les cartes du tableau de bord.

**Réponse attendue (200)**  
```json
{
  "vehiclesInStock": 28,
  "vehiclesInTransit": 8,
  "vehiclesSoldThisMonth": 16,
  "revenueThisMonth": 42500000,
  "currency": "FCFA"
}
```

Noms de champs modulables (ex. `revenueThisMonth` → `caMois`) tant que le frontend est aligné.

---

### 5.2 `GET /dashboard/charts/status`

Données pour le graphique « Véhicules par statut » (barres / camembert).

**Réponse attendue (200)**  
```json
{
  "data": [
    { "name": "Achetés", "count": 12 },
    { "name": "En transit", "count": 8 },
    { "name": "Arrivés port", "count": 5 },
    { "name": "Dédouanés", "count": 3 },
    { "name": "Vendus", "count": 24 }
  ]
}
```

`name` peut être le libellé affiché ou un code ; le frontend peut mapper code → libellé si besoin.

---

### 5.3 `GET /dashboard/charts/monthly`

Données pour le graphique « Achats vs ventes » (mensuel).

**Query params (optionnels)**  
- `year` : number  
- `months` : number (ex. 6 pour les 6 derniers mois)

**Réponse attendue (200)**  
```json
{
  "data": [
    { "month": "Jan", "achats": 8, "ventes": 6 },
    { "month": "Fév", "achats": 12, "ventes": 10 }
  ]
}
```

---

## 6. Transit & Douane

### 6.1 `GET /transit/steps`

Nombre (ou liste) de véhicules par étape de transit.

**Réponse attendue (200)**  
```json
{
  "steps": [
    { "step": "Achat", "count": 5 },
    { "step": "Embarquement", "count": 3 },
    { "step": "Transit maritime", "count": 8 },
    { "step": "Arrivée port", "count": 2 },
    { "step": "Dédouanement", "count": 4 },
    { "step": "Livraison client", "count": 0 }
  ]
}
```

---

### 6.2 `GET /transit/vehicles`

Liste des véhicules en transit (statuts EN_TRANSIT, ARRIVE_PORT, EN_DOUANE, etc.).

**Query params (optionnels)**  
- `step` : string (étape)  
- `page`, `limit`

**Réponse attendue (200)**  
Même forme que `GET /vehicles` (liste avec champs véhicule + éventuellement `currentStep`, `portDeparture`, `portArrival`).

---

## 7. Comptabilité (optionnel pour MVP)

- **Charges par véhicule** : `GET /vehicles/:id/charges` ou inclus dans `GET /vehicles/:id`.  
- **Devis / Factures** : `GET /invoices`, `POST /invoices`, `GET /invoices/:id` selon votre modèle.  
- **Paiements** : `GET /payments`, `POST /payments`.  
- **Trésorerie** : `GET /treasury/summary` (encaissements / décaissements).

Le frontend affiche des sections « À brancher sur votre API » ; dès que ces endpoints existent, on pourra les appeler avec les mêmes conventions (JSON, Bearer token).

---

## 8. Reporting (optionnel pour MVP)

### 8.1 `GET /reporting/evolution`

CA et marge dans le temps (pour le graphique ligne).

**Query params (optionnels)**  
- `year`  
- `months`

**Réponse attendue (200)**  
```json
{
  "data": [
    { "month": "Jan", "ca": 28, "marge": 12 },
    { "month": "Fév", "ca": 35, "marge": 15 }
  ]
}
```

Unités (M FCFA, etc.) à définir côté backend et affichage.

---

## 9. VIN 360° (détail véhicule)

La page `/parc-auto/[vin]` affiche un véhicule avec onglets. Elle s’appuie sur :

- **Véhicule** : `GET /vehicles/vin/:vin` ou `GET /vehicles/:id`.
- **Transit** : soit inclus dans la réponse véhicule (`transitSteps`), soit `GET /vehicles/:id/transit` ou `GET /transit/vehicles?vin=xxx`.
- **Documents** : `GET /vehicles/:id/documents` (liste de documents liés).
- **Compta / Rentabilité** : `GET /vehicles/:id/charges` ou champs `totalCost`, `margin`, `marginRate` dans la fiche véhicule.
- **Historique** : `GET /vehicles/:id/history` (timeline des changements).

Vous pouvez tout regrouper dans une seule réponse `GET /vehicles/vin/:vin` avec des sous-objets `transitSteps`, `documents`, `charges`, `history`.

---

## 10. Résumé des endpoints à fournir en priorité

| Priorité | Méthode | Chemin | Usage frontend |
|----------|---------|--------|-----------------|
| 1 | POST | `/auth/login` | Connexion |
| 2 | POST | `/auth/refresh` | Renouveler le token |
| 3 | GET | `/vehicles` | Liste parc auto (filtres search, status) |
| 4 | GET | `/vehicles/vin/:vin` ou `/vehicles/:id` | Vue VIN 360° |
| 5 | POST | `/vehicles` | Nouveau véhicule |
| 6 | GET | `/clients` | Liste CRM |
| 7 | GET | `/clients/:id` | Fiche client |
| 8 | GET | `/dashboard/stats` | KPIs tableau de bord |
| 9 | GET | `/dashboard/charts/status` | Graphique statuts |
| 10 | GET | `/dashboard/charts/monthly` | Graphique achats/ventes |
| 11 | GET | `/transit/steps` | Étapes transit |
| 12 | GET | `/transit/vehicles` | Véhicules en transit |
| 13 | GET | `/reporting/evolution` | Courbe CA / marge |

Toutes les réponses doivent être en **JSON**, et les erreurs au format `{ "message": "string", "statusCode": number }`.  
Le frontend ne consomme **aucune donnée en dur** : tout est chargé depuis ces endpoints. Aucun mock n’est utilisé côté frontend.

---

## Référence frontend

- **Client API** : `src/lib/api.ts` (fetch avec `Authorization: Bearer <token>`).
- **Services** : `src/lib/services/api.ts` (authApi, vehiclesApi, clientsApi, dashboardApi, transitApi, reportingApi).
- **Types** : `src/types/index.ts` (User, Vehicle, Client).
