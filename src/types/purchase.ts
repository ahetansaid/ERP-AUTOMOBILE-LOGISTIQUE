/**
 * Types achats — alignement backend (snake_case)
 */

export type PurchaseStatus = "EN_COURS" | "ARRIVE";
export type TypeAchat = "VRAC" | "CONTENEUR";
export type TypeVehiculeAchat = "OCCASION" | "NEUF" | "ACCIDENTE";

export interface PurchaseVehicleItem {
  id?: string;
  vin: string;
  marque: string;
  modele?: string;
  couleur?: string;
  annee: number;
  typeVehicule: TypeVehiculeAchat;
  prix: number;
  devise: string;
  montantFCFA: number;
}

export interface PurchaseListItem {
  id: number;
  supplier_name?: string;
  purchase_date?: string;
  container_reference?: string;
  vessel?: string;
  vehicle_count?: number;
  status?: PurchaseStatus;
  supplier_id?: number;
}

export interface PurchaseDetail {
  id: number;
  supplier_name?: string;
  purchase_date?: string;
  arrival_date?: string | null;
  container_reference?: string;
  vessel?: string;
  purchase_price?: number;
  currency?: string;
  amount_fcfa?: number;
  type_achat?: string;
  status?: PurchaseStatus;
  vehicles?: PurchaseVehicleInDetail[];
}

export interface PurchaseVehicleInDetail {
  id: number;
  vin: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  purchase_id?: number;
  status?: string;
}

export interface SupplierOption {
  id: number;
  name?: string;
}
