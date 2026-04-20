/**
 * Client API — ParcAuto Manager
 * Base URL depuis env, intercepteur 401 → refresh puis retry ou redirection login.
 */

const getBaseUrl = () =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type RequestConfig = RequestInit & {
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("parcauto_access_token");
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("parcauto_refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return null;
  const base = getBaseUrl();
  const res = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const newToken = data.accessToken ?? data.access_token;
  if (newToken && typeof window !== "undefined") {
    localStorage.setItem("parcauto_access_token", newToken);
    const expiresIn = data.expiresIn ?? data.expires_in ?? 3600;
    localStorage.setItem(
      "parcauto_token_expires_at",
      String(Date.now() + expiresIn * 1000)
    );
  }
  return newToken ?? null;
}

export async function api<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, ...init } = config;
  const base = getBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401 && !skipAuth && !skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...init, headers });
    }
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
      throw new Error("Unauthorized");
    }
  }

  if (!res.ok) {
    let body: { message?: string; statusCode?: number } = {};
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const err = new Error(
      (body as { message?: string }).message ?? `HTTP ${res.status}`
    ) as Error & { statusCode?: number };
    (err as Error & { statusCode?: number }).statusCode = res.status;
    throw err;
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as Promise<T>;
}

export const apiGet = <T = unknown>(path: string, config?: RequestConfig) =>
  api<T>(path, { ...config, method: "GET" });
export const apiPost = <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
  api<T>(path, { ...config, method: "POST", body: body ? JSON.stringify(body) : undefined });
export const apiPut = <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
  api<T>(path, { ...config, method: "PUT", body: body ? JSON.stringify(body) : undefined });
export const apiPatch = <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
  api<T>(path, { ...config, method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T = unknown>(path: string, config?: RequestConfig) =>
  api<T>(path, { ...config, method: "DELETE" });
