// Types de véhicule (CDC §5)
export const VEHICLE_TYPES = [
  { id: "BERLINE", label: "Berline" },
  { id: "SUV", label: "SUV" },
  { id: "PICK_UP", label: "Pick-up" },
  { id: "UTILITAIRE", label: "Utilitaire" },
  { id: "POIDS_LOURD", label: "Poids lourd" },
] as const;

// Natures de stock (dépôt, transit, consommation, autres)
export const STOCK_NATURES = [
  { id: "DEPOT", label: "Dépôt" },
  { id: "TRANSIT", label: "Transit" },
  { id: "CONSOMMATION", label: "Consommation" },
  { id: "AUTRES", label: "Autres" },
] as const;

// Statuts véhicule (CDC §5)
export const VEHICLE_STATUSES = [
  { id: "ACHETE", label: "Acheté", color: "slate" },
  { id: "EN_TRANSIT", label: "En transit", color: "blue" },
  { id: "ARRIVE_PORT", label: "Arrivé port", color: "cyan" },
  { id: "EN_DOUANE", label: "En douane", color: "amber" },
  { id: "DEDOUANE", label: "Dédouané", color: "emerald" },
  { id: "LIVRE", label: "Livré", color: "green" },
  { id: "VENDU", label: "Vendu", color: "violet" },
] as const;

// Étapes transit (CDC §6)
export const TRANSIT_STEPS = [
  "Achat",
  "Embarquement",
  "Transit maritime",
  "Arrivée port",
  "Dédouanement",
  "Livraison client",
] as const;

// Rôles RBAC (CDC §4)
export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "COMPTABLE",
  "AGENT_TRANSIT",
  "COMMERCIAL",
  "CLIENT",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  COMPTABLE: "Comptable",
  AGENT_TRANSIT: "Agent Transit",
  COMMERCIAL: "Commercial",
  CLIENT: "Client",
};

/** Taux de change vers FCFA (1 unité devise = X FCFA). À configurer ou remplacer par API. */
export const DEVISE_TO_FCFA: Record<string, number> = {
  USD: 600,
  EUR: 655,
  FCFA: 1,
};

/** Libellé du taux pour affichage (ex. "1 USD = 600 FCFA") */
export function getTauxIndicatifLibelle(devise: string): string {
  const taux = DEVISE_TO_FCFA[devise] ?? 1;
  if (devise === "FCFA") return "Devise FCFA (pas de conversion)";
  return `Taux indicatif : 1 ${devise} = ${taux.toLocaleString("fr-FR")} FCFA`;
}
