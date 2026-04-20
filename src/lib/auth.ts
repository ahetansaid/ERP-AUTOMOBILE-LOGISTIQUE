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

export function setStoredTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  if (!token) return false;
  if (expiresAt && Date.now() >= Number(expiresAt)) return false;
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
