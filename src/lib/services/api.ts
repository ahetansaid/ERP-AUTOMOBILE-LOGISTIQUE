import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type { User, Vehicle, Client } from "@/types";

// Auth
export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export const authApi = {
  login: (body: LoginBody) => apiPost<AuthResponse>("/auth/login", body),
  refresh: (refreshToken: string) =>
    apiPost<AuthResponse>("/auth/refresh", { refreshToken }),
  logout: (refreshToken: string) =>
    apiPost<{ success: boolean }>("/auth/logout", { refreshToken }),
  me: () => apiGet<User>("/auth/me"),
};

// Vehicles
export interface VehiclesResponse {
  data: Vehicle[];
  total: number;
}

export interface VehiclesQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface VehicleCreateBody {
  vin: string;
  chassisNumber?: string;
  brand: string;
  model: string;
  year: number;
  vehicleType?: string;
}

export const vehiclesApi = {
  list: (params?: VehiclesQuery) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page != null) searchParams.set("page", String(params.page));
    if (params?.limit != null) searchParams.set("limit", String(params.limit));
    const q = searchParams.toString();
    return apiGet<VehiclesResponse>(q ? `/vehicles?${q}` : "/vehicles");
  },
  getByVin: (vin: string) =>
    apiGet<Vehicle>(`/vehicles/vin/${encodeURIComponent(vin)}`),
  getById: (id: string) => apiGet<Vehicle>(`/vehicles/${id}`),
  create: (body: VehicleCreateBody) => apiPost<Vehicle>("/vehicles", body),
  update: (id: string, body: Partial<Vehicle>) =>
    apiPatch<Vehicle>(`/vehicles/${id}`, body),
};

// Clients
export interface ClientsResponse {
  data: Client[];
  total: number;
}

export interface ClientCreateBody {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const clientsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page != null) searchParams.set("page", String(params.page));
    if (params?.limit != null) searchParams.set("limit", String(params.limit));
    const q = searchParams.toString();
    return apiGet<ClientsResponse>(q ? `/clients?${q}` : "/clients");
  },
  getById: (id: string) => apiGet<Client>(`/clients/${id}`),
  create: (body: ClientCreateBody) => apiPost<Client>("/clients", body),
  update: (id: string, body: Partial<Client>) =>
    apiPatch<Client>(`/clients/${id}`, body),
};

// Dashboard
export interface DashboardStats {
  vehiclesInStock: number;
  vehiclesInTransit: number;
  vehiclesSoldThisMonth: number;
  revenueThisMonth: number;
  currency?: string;
}

export interface ChartStatusItem {
  name: string;
  count: number;
}

export interface ChartMonthlyItem {
  month: string;
  achats: number;
  ventes: number;
}

export const dashboardApi = {
  stats: () => apiGet<DashboardStats>("/dashboard/stats"),
  chartStatus: () =>
    apiGet<{ data: ChartStatusItem[] }>("/dashboard/charts/status"),
  chartMonthly: (params?: { year?: number; months?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.year != null) searchParams.set("year", String(params.year));
    if (params?.months != null)
      searchParams.set("months", String(params.months));
    const q = searchParams.toString();
    return apiGet<{ data: ChartMonthlyItem[] }>(
      q ? `/dashboard/charts/monthly?${q}` : "/dashboard/charts/monthly"
    );
  },
};

// Transit
export interface TransitStepCount {
  step: string;
  count: number;
}

export interface TransitStepsResponse {
  steps: TransitStepCount[];
}

export const transitApi = {
  steps: () => apiGet<TransitStepsResponse>("/transit/steps"),
  vehicles: (params?: { step?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.step) searchParams.set("step", params.step);
    if (params?.page != null) searchParams.set("page", String(params.page));
    if (params?.limit != null) searchParams.set("limit", String(params.limit));
    const q = searchParams.toString();
    return apiGet<VehiclesResponse>(
      q ? `/transit/vehicles?${q}` : "/transit/vehicles"
    );
  },
};

// Reporting
export interface ReportingEvolutionItem {
  month: string;
  ca: number;
  marge: number;
}

export const reportingApi = {
  evolution: (params?: { year?: number; months?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.year != null) searchParams.set("year", String(params.year));
    if (params?.months != null)
      searchParams.set("months", String(params.months));
    const q = searchParams.toString();
    return apiGet<{ data: ReportingEvolutionItem[] }>(
      q ? `/reporting/evolution?${q}` : "/reporting/evolution"
    );
  },
};
