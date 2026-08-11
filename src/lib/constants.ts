/**
 * Constantes applicatives — ParcAuto Manager
 */

import type { UserRole } from "@/types";

export const APP_NAME = "ParcAuto Manager";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "parcauto_access_token",
  REFRESH_TOKEN: "parcauto_refresh_token",
  USER: "parcauto_user",
  TOKEN_EXPIRES_AT: "parcauto_token_expires_at",
} as const;

/** Inactivité avant déconnexion automatique (ms) */
export const AUTO_LOGOUT_AFTER_MS = 30 * 60 * 1000;

/**
 * Rôles ayant accès à tous les modules.
 * Aligné sur `ROLE_PERMISSIONS` du backend (`src/middleware/rbac.js`) :
 * seul ADMIN y a le wildcard '*'.
 */
export const ADMIN_ROLES: readonly UserRole[] = ["ADMIN"];

/** Libellés FR des rôles, pour l'affichage (le backend renvoie l'enum brut). */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  SALES: "Commercial",
  ACCOUNTING: "Comptable",
  WORKSHOP: "Atelier",
  LOGISTICS: "Logistique",
  USER: "Utilisateur",
  READ_ONLY: "Lecture seule",
};

export const roleLabel = (role?: string | null) =>
  (role && ROLE_LABELS[role as UserRole]) || "—";

export const isAdmin = (role?: string | null) =>
  ADMIN_ROLES.includes(role as UserRole);

export const MODULES = {
  DASHBOARD: "dashboard",
  SUPPLY_CHAIN: "supply_chain",
  COMPTABILITE: "comptabilite",
  TRANSIT: "transit",
  CRM: "crm",
  USERS: "users",
  PARAMETRES: "parametres",
} as const;
