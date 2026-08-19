/**
 * Gestion authentification — stockage tokens + user, déconnexion 30 min inactivité
 */

import type { User } from "@/types";
import { STORAGE_KEYS, AUTO_LOGOUT_AFTER_MS } from "./constants";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.USER);
}

/**
 * Les jetons ne sont plus stockés : ils vivent dans des cookies `httpOnly` que
 * le navigateur gère seul et qu'aucun script ne peut lire.
 *
 * On ne garde qu'une date d'expiration indicative, pour que l'interface sache
 * quand la session est probablement finie sans avoir à interroger l'API. Ce
 * n'est qu'un indice : l'autorité reste le 401.
 */
export function setSessionHint(expiresIn: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEYS.TOKEN_EXPIRES_AT,
    String(Date.now() + expiresIn * 1000)
  );
  // Purge des jetons de l'ancien mode, s'ils traînent d'une session antérieure.
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
}

/**
 * Session probablement ouverte ?
 *
 * Ne peut plus être une certitude : le cookie est illisible par script. On se
 * fonde sur l'utilisateur en mémoire et sur la date indicative. Une réponse
 * fausse-positive n'est pas grave — l'API renverra 401 et l'intercepteur
 * redirigera. L'inverse le serait : déconnecter quelqu'un qui a une session
 * valide.
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  if (!localStorage.getItem(STORAGE_KEYS.USER)) return false;
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  // Le jeton d'accès dure 30 min, celui de rafraîchissement 30 jours : passé
  // l'expiration de l'accès, la session peut encore être renouvelée
  // silencieusement. On ne déconnecte donc pas sur cette seule base.
  if (expiresAt && Date.now() >= Number(expiresAt) + 30 * 24 * 3600 * 1000) {
    return false;
  }
  return true;
}

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

function resetInactivityTimer(callback: () => void): void {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(callback, AUTO_LOGOUT_AFTER_MS);
}

export function startInactivityTimer(onLogout: () => void): () => void {
  const handleActivity = () => resetInactivityTimer(onLogout);
  resetInactivityTimer(onLogout);
  if (typeof window === "undefined") return () => {};
  window.addEventListener("mousemove", handleActivity);
  window.addEventListener("keydown", handleActivity);
  window.addEventListener("focus", handleActivity);
  return () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    window.removeEventListener("mousemove", handleActivity);
    window.removeEventListener("keydown", handleActivity);
    window.removeEventListener("focus", handleActivity);
  };
}
