export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

/** Étape transit (réponse backend VIN 360°) */
export interface TransitStepItem {
  id: string;
  vehicleId: string;
  step: string;
  date?: string;
  status?: string;
  details?: string;
}

/** Document lié véhicule */
export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: string;
  name?: string;
  url?: string;
  createdAt?: string;
}

/** Charge véhicule (rentabilité) */
export interface VehicleCharge {
  id: string;
  vehicleId: string;
  category: string;
  amount: number;
  currency?: string;
  description?: string;
}

/** Événement historique véhicule */
export interface VehicleHistoryItem {
  id: string;
  action: string;
  createdAt: string;
  userId?: string;
  details?: string;
}

/** Nature du stock (spec parc) */
export type StockNature = "depot" | "transit" | "autres";

export interface Vehicle {
  id: string;
  vin: string;
  chassisNumber?: string;
  brand: string;
  model: string;
  year: number;
  vehicleType?: string;
  status: string;
  clientId?: string;
  clientName?: string;
  purchasePrice?: number;
  salePrice?: number;
  currency?: string;
  createdAt: string;
  /** Spec: Numéro BL (Connaissement / Bon de livraison) */
  blNumber?: string;
  /** Spec: Date d'entrée sur le Port */
  dateEntryPort?: string;
  /** Spec: Date d'entrée sur le Parc */
  dateEntryParc?: string;
  /** Spec: Nature du stock (dépôt, transit, autres) — backend peut renvoyer natureStock (DEPOT|TRANSIT|AUTRES) */
  stockNature?: StockNature;
  /** Alias backend: numeroBl, dateEntreePort, dateEntreeParc, natureStock, joursSurParc */
  numeroBl?: string;
  dateEntreePort?: string;
  dateEntreeParc?: string;
  natureStock?: string;
  joursSurParc?: number;
  /** Spec: Régularisé = situation compta clôturée pour ce véhicule */
  regularise?: boolean;
  /** Enrichi par GET /vehicles/vin/:vin ou /vehicles/:id */
  transitSteps?: TransitStepItem[];
  documents?: VehicleDocument[];
  charges?: VehicleCharge[];
  history?: VehicleHistoryItem[];
  totalCost?: number;
  margin?: number;
  marginRate?: number;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

/** Véhicule minimal (liste client) */
export interface VehicleSummary {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year?: number;
  status?: string;
}

/** Facture liée à un client (GET /clients/:id) */
export interface ClientInvoice {
  id: string;
  vehicleId?: string;
  amount: number;
  status?: string;
  createdAt: string;
}

/** Paiement lié (GET /clients/:id) */
export interface ClientPayment {
  id: string;
  amount: number;
  paymentType?: string;
  paidAt: string;
  invoiceId?: string;
  vehicleId?: string;
}

/** Opération transit liée au client (GET /clients/:id) */
export interface ClientTransitOperation {
  id: string;
  operationType?: string;
  reference?: string;
  blNumber?: string;
  dateArriveePort?: string;
  createdAt: string;
}

/** Client avec véhicules et opérations (GET /clients/:id) */
export interface ClientWithVehicles extends Client {
  vehicles?: VehicleSummary[];
  invoices?: ClientInvoice[];
  payments?: ClientPayment[];
  transitOperations?: ClientTransitOperation[];
}

/** Types d'opération transit (backend) */
export type TransitOperationType = "MARITIME" | "VEHICULE" | "DEDOUANEMENT" | "ACHAT" | "IMPORT" | "EXPORT";

export interface TransitOperation {
  id: string;
  operationType: TransitOperationType;
  reference?: string;
  vehicleId?: string;
  clientId?: string;
  lieuExpedition?: string;
  portLoading?: string;
  portUnloading?: string;
  dateEmbarquement?: string;
  dateArriveePort?: string;
  vesselName?: string;
  vesselFlag?: string;
  containerNumber?: string;
  blNumber?: string;
  declarantName?: string;
  customsReference?: string;
  details?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Reçu prestataire externe (spec compta) */
export interface Receipt {
  id: string;
  prestataireName: string;
  amount: number;
  currency: string;
  documentPath?: string;
  operationReference?: string;
  vehicleId?: string;
  notes?: string;
  receivedAt: string;
  createdAt?: string;
}

/** Synthèse + notes (GET /reporting/compta) */
export interface ReportingCompta {
  summary?: {
    invoicesByStatus?: Record<string, number>;
    totalInvoiced?: number;
    totalPayments?: number;
  };
  notes?: { id: string; content: string; extraData?: string; createdAt: string; updatedAt?: string }[];
}

/** Infos société (logo, PDF) */
export interface CompanyInfo {
  logoPath?: string;
  raisonSociale?: string;
  adresse?: string;
  ifu?: string;
  phone?: string;
  email?: string;
  siteWeb?: string;
}

/** Document rattaché à une entité (spec) */
export interface AppDocument {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
  entityType: "vehicle" | "client" | "transit" | "invoice" | "other";
  entityId: string;
  uploadedBy?: string;
  createdAt: string;
}
