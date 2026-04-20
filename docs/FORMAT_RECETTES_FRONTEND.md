# POST /receipts — Format attendu par le backend

Ce document décrit le body JSON à envoyer depuis le formulaire « Nouveau reçu » pour éviter un **400 Bad Request**.

## Règles communes

1. **Un seul type de reçu par requête** : envoyer **soit** `invoiceId` (facture) **soit** `devisId` (devis), jamais les deux.
2. **Montant** : toujours un **nombre** (ex. `75000`), pas une chaîne.
3. **Date** : format **YYYY-MM-DD** (ex. `"2026-03-07"`). Le backend accepte aussi une chaîne ISO.
4. **Headers** : `Content-Type: application/json` et `Authorization: Bearer <token>` (géré par le client API).

---

## Reçu lié à une facture (vente)

| Champ   | Clé(s) acceptées              | Type   | Obligatoire | Exemple        |
|--------|--------------------------------|--------|-------------|----------------|
| Facture | `invoiceId`, `invoice_id`      | number | **Oui**     | `1`            |
| Montant | `amount`                       | number | **Oui**     | `150000`       |
| Méthode | `paymentMethod`, `payment_method` | string | Non (défaut: `"ESPECES"`) | `"VIREMENT"` |
| Date   | `paymentDate`, `payment_date`  | string | Non (défaut: aujourd’hui) | `"2026-03-07"` |
| Référence | `reference`                  | string | Non         | `"REF-001"`    |

**Exemple de body :**
```json
{
  "invoiceId": 1,
  "amount": 150000,
  "paymentMethod": "ESPECES",
  "paymentDate": "2026-03-07",
  "reference": "Virement du 07/03"
}
```

---

## Reçu lié à un devis (maintenance / atelier)

| Champ   | Clé(s) acceptées              | Type   | Obligatoire | Exemple        |
|--------|--------------------------------|--------|-------------|----------------|
| Devis  | `devisId`, `devis_id`, `quoteId`, `quote_id` | number | **Oui**     | `2`            |
| Montant | `amount`                       | number | **Oui**     | `75000`        |
| Méthode | `paymentMethod`, `payment_method` | string | Non (défaut: `"ESPECES"`) | `"ESPECES"` |
| Date   | `paymentDate`, `payment_date`  | string | Non (défaut: aujourd’hui) | `"2026-03-07"` |
| Référence | `reference`                  | string | Non         | —              |
| Type   | `source_type`, `sourceType`     | string | Non         | `"DEVIS"`      |

**Important :** ne pas envoyer `invoiceId` ni `invoice_id` pour un reçu devis.

**Exemple de body :**
```json
{
  "devisId": 2,
  "amount": 75000,
  "paymentMethod": "ESPECES",
  "paymentDate": "2026-03-07",
  "reference": ""
}
```

---

## Réponse 201 (succès)

Le backend renvoie l’objet reçu créé (ex. `id`, `invoice_id` ou `workshop_quote_id`, `amount`, `payment_method`, `payment_date`, `reference`, `created_at`).

## En cas de 400

Lire `response.json()` : le champ **`message`** indique la cause (ex. « amount requis (nombre) », « invoiceId ou devisId requis »). Le frontend affiche ce message dans le formulaire.

---

Voir aussi : `docs/BRIEFING_BACKEND.md` pour l’ensemble de l’API.
