/**
 * Types comptabilité — alignement backend (snake_case)
 */

export type ChargeCategory =
  | "CARBURANT"
  | "PEAGE"
  | "REPARATION"
  | "TRANSPORT"
  | "DOUANE"
  | "AUTRE";

export interface ChargeListItem {
  id: number;
  label?: string;
  category?: string;
  amount?: number;
  charge_date?: string;
  company_id?: number;
}

export interface DevisListItem {
  id: number;
  vehicle_id?: number;
  prestataire?: string;
  amount?: number;
  currency?: string;
  description?: string;
  valid_until?: string;
  status?: string;
  vin?: string;
  brand?: string;
  model?: string;
}

export interface InvoiceListItem {
  id: number;
  vehicle_id?: number;
  client_id?: number;
  /** Prix de vente du véhicule (référence pour le solde restant). */
  price_sale?: number;
  amount?: number;
  total_amount?: number;
  due_date?: string;
  status?: string;
  invoice_number?: string;
  client_name?: string;
  vin?: string;
  /** Montant payé (somme des reçus). Solde restant = price_sale − paid_amount. */
  paid_amount?: number;
  remaining_amount?: number;
}

export type ReceiptSourceType = "FACTURE" | "DEVIS";

export interface ReceiptListItem {
  id: number;
  invoice_id?: number;
  devis_id?: number;
  source_type?: ReceiptSourceType;
  amount?: number;
  payment_method?: string;
  payment_date?: string;
  reference?: string;
  invoice_number?: string;
  client_name?: string;
  /** Pour reçu lié à un devis : prestataire ou libellé devis */
  devis_prestataire?: string;
  devis_vin?: string;
  /** Solde restant (facture) après ce paiement. Affiché sur le reçu téléchargeable si > 0. */
  remaining_amount?: number | null;
}

export interface TreasurySummary {
  total_entrees?: number;
  total_sorties?: number;
  solde?: number;
  transactions?: unknown[];
}

export interface ProformaListItem {
  id: number;
  vehicle_id?: number;
  client_id?: number;
  amount?: number;
  total_amount?: number;
  proforma_number?: string;
  status?: string;
  client_name?: string;
  vin?: string;
  brand?: string;
  model?: number;
}
