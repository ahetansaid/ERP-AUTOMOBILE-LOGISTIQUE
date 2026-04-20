/**
 * Types véhicules — alignement backend (snake_case)
 */

export interface VehicleListItem {
  id: number;
  vin: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  status?: string;
  purchase_price?: number;
  /** Équivalent du prix d'achat en FCFA (si achat en devise étrangère). */
  purchase_price_fcfa?: number;
  price_sale?: number;
  client_id?: number | null;
  client_name?: string | null;
  /** Montant total de la facture (quand une facture existe). API : total_amount, invoice_total. */
  total_amount?: number | null;
  /** Montant déjà payé (somme des reçus liés à la facture). API : paid_amount, paidAmount, montant_paye. */
  paid_amount?: number | null;
  /** Solde restant = montant total facture − montant payé. Bouton « Clôturer la vente » actif uniquement si = 0. API : remaining_amount, remainingAmount, solde_restant. */
  remaining_amount?: number | null;
  /** Date d'arrivée au parc (date du passage au statut Arrivé de l'achat). Pour calcul "nbre de jours". */
  arrival_date?: string | null;
}
