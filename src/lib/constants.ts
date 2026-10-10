/**
 * Constantes applicatives — ParcAuto Manager
 */

import { USER_ROLES, type UserRole } from "@/types";

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
 * Aligné sur `ROLE_PERMISSIONS` du backend (`src/middleware/rbac.js`) : `ADMIN`
 * (le gérant d'une société) et `PLATFORM_ADMIN` (l'éditeur) y portent le
 * wildcard '*'. Le second ne sort jamais de l'exploitation de la plateforme.
 */
export const ADMIN_ROLES: readonly UserRole[] = ["ADMIN", "PLATFORM_ADMIN"];

/** Libellés FR des rôles, pour l'affichage (le backend renvoie l'enum brut). */
export const ROLE_LABELS: Record<UserRole, string> = {
  PLATFORM_ADMIN: "Éditeur de la plateforme",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  SALES: "Commercial",
  ACCOUNTING: "Comptable",
  WORKSHOP: "Atelier",
  LOGISTICS: "Logistique",
  USER: "Utilisateur",
  READ_ONLY: "Lecture seule",
  PARTNER: "Accès externe",
};

/**
 * Rôles attribuables depuis l'écran Utilisateurs.
 *
 * Miroir de `ROLES_ATTRIBUABLES` côté backend (`src/lib/accounts.js`), lui-même
 * déduit du schéma Prisma. Deux exclusions, et elles sont des décisions :
 *   - PLATFORM_ADMIN : donnerait à un gérant la main sur les sociétés des autres
 *     clients ;
 *   - PARTNER : le rôle n'ouvre volontairement rien tant que l'accès par tiers
 *     n'est pas filtré — créer un tel compte, ce serait faire croire à un
 *     transitaire qu'il a un espace.
 */
export const ASSIGNABLE_ROLES: readonly UserRole[] = USER_ROLES.filter(
  (role) => role !== "PLATFORM_ADMIN" && role !== "PARTNER"
);

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
