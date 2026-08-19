"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import {
  getStoredUser,
  setStoredUser,
  setSessionHint,
  clearAuth,
  isAuthenticated,
  startInactivityTimer,
} from "@/lib/auth";
import { setOnUnauthorized, apiPost } from "@/lib/api";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    // Les cookies sont `httpOnly` : le front ne peut PAS les effacer lui-même.
    // Seul le serveur le peut, en reposant des cookies expirés. On n'attend pas
    // la réponse — l'utilisateur doit sortir de l'écran immédiatement, et une
    // session résiduelle côté serveur expirera d'elle-même.
    void apiPost("/auth/logout", {}, { skipRefresh: true }).catch(() => {});
    clearAuth();
    setUser(null);
    setOnUnauthorized(() => {});
    router.push("/login");
  }, [router]);

  useEffect(() => {
    setUser(getStoredUser());
    setOnUnauthorized(logout);
    const stop = startInactivityTimer(logout);
    setLoading(false);
    return stop;
  }, [logout]);

  const loginSuccess = useCallback(
    (data: { user: User; expiresIn: number }) => {
      const u = data.user;
      setStoredUser({
        id: u.id,
        email: u.email,
        firstName: u.firstName ?? (u as User & { first_name?: string }).first_name,
        lastName: u.lastName ?? (u as User & { last_name?: string }).last_name,
        role: u.role,
        companyId: u.companyId ?? (u as User & { company_id?: number }).company_id,
      });
      // Les jetons du corps ne sont plus utilisés : le serveur a déjà posé
      // les cookies. On ne garde qu’un indice de durée pour l’interface.
      setSessionHint(data.expiresIn);
      setUser(getStoredUser());
      router.push("/");
    },
    [router]
  );

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    logout,
    loginSuccess,
  };
}
