/**
 * Types pour le tableau de bord (alignement backend)
 */

export interface DashboardStats {
  stockDisponible?: number;
  stockNonRegulier?: number;
  stockRegularise?: number;
  nombreClients?: number;
  caSemaine?: number;
  caMois?: number;
  vehiclesEnMaintenance?: number;
  vehiclesEnTransit?: number;
  currency?: string;
}
