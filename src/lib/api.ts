const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/** Gestion 401 : tente un refresh puis redirige vers login si échec */
async function handle401(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { getRefreshToken, setAuth, clearAuth } = await import("@/lib/auth");
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuth();
    window.location.href = "/login";
    return false;
  }
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.accessToken) {
      clearAuth();
      window.location.href = "/login";
      return false;
    }
    setAuth(data.accessToken, data.refreshToken ?? refreshToken, data.user ?? {});
    return true;
  } catch {
    clearAuth();
    window.location.href = "/login";
    return false;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !retried) {
    const refreshed = await handle401();
    if (refreshed) return api<T>(path, options, true);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Erreur API");
  }
  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string) => api<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) =>
  api<T>(path, { method: "DELETE" });

/** Upload fichier (multipart). Ne pas passer Content-Type pour laisser le navigateur définir le boundary. */
export async function apiPostForm<T>(path: string, formData: FormData, retried = false): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401 && !retried) {
    const refreshed = await handle401();
    if (refreshed) return apiPostForm<T>(path, formData, true);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Erreur API");
  }
  return res.json() as Promise<T>;
}
