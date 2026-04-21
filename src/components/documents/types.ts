export type DocumentKind = "FACTURE" | "DEVIS" | "PROFORMA" | "RECU";

export type Party = {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  legalNumber?: string; // IFU / RCCM
};

export type DocumentLine = {
  label: string;
  sublabel?: string; // ex: VIN
  quantity: number;
  unitPrice: number;
  /** Montant total (calculé) — si absent, quantity × unitPrice */
  total?: number;
};

export type DocumentBrand = {
  /** Nom commercial affiché en en-tête */
  name?: string;
  logoUrl?: string;
  /** Couleur primaire (hex) utilisée sur les templates Gradient / Minimal */
  color?: string;
};

export type DocumentData = {
  kind: DocumentKind;
  number: string;
  issuedAt: string | Date;
  dueDate?: string | Date;
  validUntil?: string | Date;
  currency: string; // ex: "FCFA"
  /** TVA en % (0 si non applicable) */
  vatRate?: number;
  /** Notes ou CGV en bas de document */
  notes?: string;
  lines: DocumentLine[];
  /** Émetteur (notre société) */
  from: Party;
  /** Destinataire (client) */
  to: Party;
  brand?: DocumentBrand;
  /** Pour les reçus : référence de la facture liée */
  invoiceRef?: string;
  /** Pour les reçus : mode + référence paiement */
  paymentMethod?: string;
  paymentReference?: string;
  /** Pour les reçus : solde restant sur la facture après ce paiement */
  remainingBalance?: number;
  /** Statut humain (ex: "En attente", "Payée") */
  statusLabel?: string;
  /** Lien de paiement en ligne (affiché sur templates Minimal / Gradient) */
  payUrl?: string;
};

export const KIND_LABEL: Record<DocumentKind, string> = {
  FACTURE: "Facture",
  DEVIS: "Devis",
  PROFORMA: "Pro forma",
  RECU: "Reçu",
};

export function computeTotals(data: DocumentData) {
  const lines = data.lines.map((l) => ({
    ...l,
    total: l.total ?? l.quantity * l.unitPrice,
  }));
  const subtotal = lines.reduce((s, l) => s + (l.total ?? 0), 0);
  const vat = ((data.vatRate ?? 0) / 100) * subtotal;
  const total = subtotal + vat;
  return { lines, subtotal, vat, total };
}

export function formatAmount(n: number, currency = "FCFA") {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  return `${formatted} ${currency}`;
}

export function formatDate(d?: string | Date) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
