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
