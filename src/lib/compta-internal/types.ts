/** Charge (décaissement) — comptabilité interne */
export interface ChargeInterne {
  id: string;
  label: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  vehicleVin?: string;
  createdAt: string;
}

/** Facture ou devis — comptabilité interne */
export type TypeFactureDevis = "devis" | "facture";
export type StatutFactureDevis = "brouillon" | "envoye" | "paye";

/** Facture : temporaire = avance client, complète = à solder */
export type FactureNature = "temporaire" | "complet";

export interface FactureDevisInterne {
  id: string;
  type: TypeFactureDevis;
  /** Pour type facture : temporaire (avance) ou complet (à solder) */
  factureNature?: FactureNature;
  clientName: string;
  amount: number;
  currency: string;
  date: string;
  status: StatutFactureDevis;
  createdAt: string;
  /** Devis uniquement : véhicule concerné */
  vehicleId?: string;
  vehicleVin?: string;
  /** Devis uniquement : prestataire (atelier, etc.) */
  prestataire?: string;
  /** Devis uniquement : précision du service */
  service?: string;
}

/** Paiement (encaissement) — comptabilité interne */
export type MethodePaiement = "especes" | "virement" | "mobile_money" | "cheque";

export interface PaiementInterne {
  id: string;
  amount: number;
  currency: string;
  date: string;
  method: MethodePaiement;
  reference?: string;
  factureId?: string;
  createdAt: string;
}

export interface ComptaInterneState {
  charges: ChargeInterne[];
  facturesDevis: FactureDevisInterne[];
  paiements: PaiementInterne[];
}
