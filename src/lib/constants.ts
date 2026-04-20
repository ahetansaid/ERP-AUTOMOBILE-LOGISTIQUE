/**
 * Constantes applicatives — ParcAuto Manager
 */

export const APP_NAME = "ParcAuto Manager";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "parcauto_access_token",
  REFRESH_TOKEN: "parcauto_refresh_token",
  USER: "parcauto_user",
  TOKEN_EXPIRES_AT: "parcauto_token_expires_at",
} as const;

/** Inactivité avant déconnexion automatique (ms) */
export const AUTO_LOGOUT_AFTER_MS = 30 * 60 * 1000;

/** Rôles ayant accès à tous les modules (Admin) */
export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRIGEANT"] as const;

export const MODULES = {
  DASHBOARD: "dashboard",
  SUPPLY_CHAIN: "supply_chain",
  COMPTABILITE: "comptabilite",
  TRANSIT: "transit",
  CRM: "crm",
  USERS: "users",
  PARAMETRES: "parametres",
} as const;
