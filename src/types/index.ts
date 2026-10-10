/**
 * Types partagés — ParcAuto Manager
 * Alignement avec les réponses backend (snake_case possible).
 */

/**
 * Miroir exact de l'enum Prisma `UserRole` (backend `prisma/schema.prisma`),
 * dans le même ordre. Toute valeur ajoutée là-bas doit l'être ici, et
 * inversement : le JWT transporte cette valeur brute et le RBAC backend s'en
 * sert telle quelle.
 *
 * Ce tableau est la source du type — pas l'inverse : un libellé oublié côté
 * interface devient une erreur de compilation, plus un rôle qui affiche « — ».
 *
 * Deux rôles ne s'attribuent pas depuis l'écran Utilisateurs :
 * `PLATFORM_ADMIN` (l'éditeur de la plateforme) et `PARTNER` (accès externe,
 * inerte tant que le filtrage par tiers n'existe pas). Voir `ASSIGNABLE_ROLES`.
 */
export const USER_ROLES = [
  "PLATFORM_ADMIN",
  "ADMIN",
  "MANAGER",
  "SALES",
  "ACCOUNTING",
  "WORKSHOP",
  "LOGISTICS",
  "USER",
  "READ_ONLY",
  "PARTNER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: number;
  email: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  role: UserRole;
  companyId?: number;
  company_id?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  message?: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export const VEHICLE_STATUSES = [
  "ACHETE",
  "EN_TRANSIT",
  "DISPONIBLE",
  "EN_VENTE",
  "RESERVE",
  "VENDU",
  "EN_MAINTENANCE",
  "LIVRE",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const PURCHASE_STATUSES = ["EN_COURS", "ARRIVE"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];
