/**
 * Types partagés — ParcAuto Manager
 * Alignement avec les réponses backend (snake_case possible).
 */

/**
 * Miroir exact de l'enum Prisma `UserRole` (backend `prisma/schema.prisma`).
 * Toute valeur ajoutée côté backend doit l'être ici, et inversement :
 * le JWT transporte cette valeur brute et le RBAC backend l'utilise telle quelle.
 */
export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "SALES"
  | "ACCOUNTING"
  | "WORKSHOP"
  | "LOGISTICS"
  | "USER"
  | "READ_ONLY";

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
