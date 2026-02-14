import { apiGet, apiPost, apiPatch, apiDelete, apiPostForm } from "@/lib/api";
import type {
  User,
  Vehicle,
  Client,
  ClientWithVehicles,
  VehicleDocument,
  TransitOperation,
  Receipt,
  ReportingCompta,
  CompanyInfo,
} from "@/types";

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
  /** Stock disponible (régularisé), optionnel nature = DEPOT | TRANSIT | AUTRES */
  stockDisponible: (params?: { nature?: string }) => {
    const sp = new URLSearchParams();
    if (params?.nature) sp.set("nature", params.nature);
    const q = sp.toString();
    return apiGet<VehiclesResponse>(q ? `/vehicles/stock/disponible?${q}` : "/vehicles/stock/disponible");
  },
  /** Stock non régularisé */
  stockNonRegularise: () => apiGet<VehiclesResponse>("/vehicles/stock/non-regularise"),
  getByVin: (vin: string) =>
    apiGet<Vehicle>(`/vehicles/vin/${encodeURIComponent(vin)}`),
  getById: (id: string) => apiGet<Vehicle>(`/vehicles/${id}`),
  create: (body: VehicleCreateBody) => apiPost<Vehicle>("/vehicles", body),
  update: (id: string, body: Partial<Vehicle>) =>
    apiPatch<Vehicle>(`/vehicles/${id}`, body),
  delete: (id: string) => apiDelete<{ success?: boolean }>(`/vehicles/${id}`),
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
  getById: (id: string) => apiGet<ClientWithVehicles>(`/clients/${id}`),
  /** Export liste clients : format=json (défaut) ou format=csv (téléchargement direct) */
  export: (format: "json" | "csv" = "json") => {
    if (format === "csv") {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      return fetch(`${base}/clients/export?format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => {
        if (!r.ok) throw new Error("Export failed");
        return r.blob();
      });
    }
    return apiGet<Client[]>(`/clients/export?format=json`);
  },
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

// Transit operations (CRUD)
export interface TransitOperationsResponse {
  data: TransitOperation[];
  total: number;
}

export const transitOperationsApi = {
  list: (params?: { vehicleId?: string; clientId?: string; operationType?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.vehicleId) sp.set("vehicleId", params.vehicleId);
    if (params?.clientId) sp.set("clientId", params.clientId);
    if (params?.operationType) sp.set("operationType", params.operationType);
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    const q = sp.toString();
    return apiGet<TransitOperationsResponse>(q ? `/transit/operations?${q}` : "/transit/operations");
  },
  get: (id: string) => apiGet<TransitOperation>(`/transit/operations/${id}`),
  create: (body: Partial<TransitOperation> & { operationType: TransitOperation["operationType"] }) =>
    apiPost<TransitOperation>("/transit/operations", body),
  update: (id: string, body: Partial<TransitOperation>) =>
    apiPatch<TransitOperation>(`/transit/operations/${id}`, body),
  delete: (id: string) => apiDelete<{ success?: boolean }>(`/transit/operations/${id}`),
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

// ——— Comptabilité ———

export interface ChargeApi {
  id: string;
  vehicleId: string | null;
  label: string;
  amount: number;
  currency: string;
  chargeType: string;
  createdAt: string;
  vehicleVin?: string;
  vehicleLabel?: string;
}

export interface ChargesListResponse {
  data: ChargeApi[];
  total: number;
}

export interface InvoiceLineApi {
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceApi {
  id: string;
  vehicleId?: string | null;
  vehicleVin?: string;
  vehicleLabel?: string;
  status: "DEVIS" | "FACTURE";
  typeFacture?: "TEMPORAIRE" | "COMPLETE";
  clientId: string | null;
  clientName?: string;
  amount: number;
  currency?: string;
  tvaRate?: number;
  lines?: InvoiceLineApi[] | null;
  invoiceNumber?: string | null;
  createdAt: string;
  sentAt?: string | null;
}

export interface InvoicesListResponse {
  data: InvoiceApi[];
  total: number;
}

export interface PaymentApi {
  id: string;
  vehicleId?: string | null;
  invoiceId?: string | null;
  amount: number;
  currency: string;
  paymentType: string;
  paidAt: string;
  reference?: string | null;
  createdAt: string;
}

export interface PaymentsListResponse {
  data: PaymentApi[];
  total: number;
}

export interface TreasuryByCurrency {
  currency: string;
  encaissements: number;
  decaissements: number;
  solde: number;
}

export interface TreasurySummaryResponse {
  encaissements: number;
  decaissements: number;
  solde: number;
  currency?: string;
  byCurrency: TreasuryByCurrency[];
  multipleCurrencies: boolean;
}

export const comptaApi = {
  charges: {
    list: (params?: { page?: number; limit?: number; vehicleId?: string; currency?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page != null) searchParams.set("page", String(params.page));
      if (params?.limit != null) searchParams.set("limit", String(params.limit));
      if (params?.vehicleId) searchParams.set("vehicleId", params.vehicleId);
      if (params?.currency) searchParams.set("currency", params.currency);
      const q = searchParams.toString();
      return apiGet<ChargesListResponse>(q ? `/charges?${q}` : "/charges");
    },
    create: (vehicleId: string, body: { label: string; amount: number; currency?: string; chargeType?: string }) =>
      apiPost<ChargeApi>(`/vehicles/${vehicleId}/charges`, body),
    update: (vehicleId: string, chargeId: string, body: Partial<{ label: string; amount: number; currency: string; chargeType: string }>) =>
      apiPatch<ChargeApi>(`/vehicles/${vehicleId}/charges/${chargeId}`, body),
    delete: (vehicleId: string, chargeId: string) =>
      apiDelete<{ success?: boolean }>(`/vehicles/${vehicleId}/charges/${chargeId}`),
  },
  invoices: {
    list: (params?: { page?: number; limit?: number; vehicleId?: string; status?: "DEVIS" | "FACTURE" }) => {
      const searchParams = new URLSearchParams();
      if (params?.page != null) searchParams.set("page", String(params.page));
      if (params?.limit != null) searchParams.set("limit", String(params.limit));
      if (params?.vehicleId) searchParams.set("vehicleId", params.vehicleId);
      if (params?.status) searchParams.set("status", params.status);
      const q = searchParams.toString();
      return apiGet<InvoicesListResponse>(q ? `/invoices?${q}` : "/invoices");
    },
    get: (id: string) => apiGet<InvoiceApi>(`/invoices/${id}`),
    create: (body: {
      vehicleId?: string;
      amount?: number;
      status?: "DEVIS" | "FACTURE";
      typeFacture?: "TEMPORAIRE" | "COMPLETE";
      clientId?: string;
      lines?: InvoiceLineApi[];
      tvaRate?: number;
      invoiceNumber?: string;
      generatePdf?: boolean;
    }) => apiPost<InvoiceApi>("/invoices", body),
    update: (id: string, body: Partial<{ status: string; typeFacture: string; clientId: string; lines: InvoiceLineApi[]; tvaRate: number; invoiceNumber: string }>) =>
      apiPatch<InvoiceApi>(`/invoices/${id}`, body),
  },
  payments: {
    list: (params?: { page?: number; limit?: number; vehicleId?: string; invoiceId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page != null) searchParams.set("page", String(params.page));
      if (params?.limit != null) searchParams.set("limit", String(params.limit));
      if (params?.vehicleId) searchParams.set("vehicleId", params.vehicleId);
      if (params?.invoiceId) searchParams.set("invoiceId", params.invoiceId);
      const q = searchParams.toString();
      return apiGet<PaymentsListResponse>(q ? `/payments?${q}` : "/payments");
    },
    create: (body: {
      vehicleId?: string;
      invoiceId?: string;
      amount: number;
      currency?: string;
      paymentType?: string;
      paidAt?: string;
      reference?: string;
    }) => apiPost<PaymentApi>("/payments", body),
  },
  treasury: {
    summary: () => apiGet<TreasurySummaryResponse>("/treasury/summary"),
  },
};

// Documents (par véhicule)
export const documentsApi = {
  listByVehicle: (vehicleId: string) =>
    apiGet<{ data: VehicleDocument[] }>(`/vehicles/${vehicleId}/documents`),
  upload: (vehicleId: string, file: File, type?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (type) form.append("type", type);
    return apiPostForm<VehicleDocument>(`/vehicles/${vehicleId}/documents`, form);
  },
};

// Reçus prestataires externes (CRUD)
export interface ReceiptsListResponse {
  data: Receipt[];
  total: number;
}

export const receiptsApi = {
  list: (params?: { vehicleId?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.vehicleId) sp.set("vehicleId", params.vehicleId);
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.limit != null) sp.set("limit", String(params.limit));
    const q = sp.toString();
    return apiGet<ReceiptsListResponse>(q ? `/receipts?${q}` : "/receipts");
  },
  get: (id: string) => apiGet<Receipt>(`/receipts/${id}`),
  create: (body: {
    prestataireName: string;
    amount: number;
    currency?: string;
    documentPath?: string;
    operationReference?: string;
    vehicleId?: string;
    notes?: string;
    receivedAt?: string;
  }) => apiPost<Receipt>("/receipts", body),
  update: (id: string, body: Partial<Receipt>) => apiPatch<Receipt>(`/receipts/${id}`, body),
  delete: (id: string) => apiDelete<{ success?: boolean }>(`/receipts/${id}`),
};

// Rapports compta (synthèse + notes)
export const reportingComptaApi = {
  get: () => apiGet<ReportingCompta>("/reporting/compta"),
  addNote: (body: { content: string; extraData?: string }) =>
    apiPost<{ id: string; content: string; createdAt: string }>("/reporting/compta/notes", body),
  updateNote: (id: string, body: { content?: string; extraData?: string }) =>
    apiPatch<{ id: string; content: string }>(`/reporting/compta/notes/${id}`, body),
};

// Infos société (logo, PDF)
export const companyInfoApi = {
  get: () => apiGet<CompanyInfo>("/company-info"),
  update: (body: Partial<CompanyInfo>) => apiPatch<CompanyInfo>("/company-info", body),
};
