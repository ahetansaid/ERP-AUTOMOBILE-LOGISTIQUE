/**
 * Client API — ParcAuto Manager
 *
 * LA SESSION VIT DANS UN COOKIE `httpOnly`, PAS DANS `localStorage`.
 *
 * Aucun jeton ne transite plus par ce fichier. `credentials: "include"` suffit :
 * le navigateur joint le cookie, et aucun script ne peut le lire — c'est tout
 * l'objet du changement. Une injection HTML qui parviendrait à s'exécuter
 * n'aurait plus rien à voler.
 *
 * Conséquence à connaître : le front ne peut plus SAVOIR s'il est authentifié
 * en lisant quelque chose. Seule l'API le sait, et elle le dit par un 401.
 * L'utilisateur en mémoire n'est qu'un indice d'affichage.
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

/**
 * Renouvelle la session.
 *
 * Aucun jeton en corps : le cookie de rafraîchissement part tout seul, et le
 * serveur repose un cookie d'accès neuf. Retourne simplement si ça a marché.
 */
async function rafraichirSession(): Promise<boolean> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: "{}",
    });
    return res.ok;
  } catch {
    return false;
  }
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

  // `include` et non `same-origin` : l'API est sur une autre origine, et c'est
  // la seule façon d'y joindre le cookie de session.
  let res = await fetch(url, { ...init, headers, credentials: "include" });

  if (res.status === 401 && !skipAuth && !skipRefresh) {
    const renouvele = await rafraichirSession();
    if (renouvele) {
      res = await fetch(url, { ...init, headers, credentials: "include" });
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
