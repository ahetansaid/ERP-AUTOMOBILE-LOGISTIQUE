"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import {
  getStoredUser,
  setStoredUser,
  setStoredTokens,
  clearAuth,
  isAuthenticated,
  startInactivityTimer,
} from "@/lib/auth";
import { setOnUnauthorized } from "@/lib/api";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
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
    (data: { user: User; accessToken: string; refreshToken: string; expiresIn: number }) => {
      const u = data.user;
      setStoredUser({
        id: u.id,
        email: u.email,
        firstName: u.firstName ?? (u as User & { first_name?: string }).first_name,
        lastName: u.lastName ?? (u as User & { last_name?: string }).last_name,
        role: u.role,
        companyId: u.companyId ?? (u as User & { company_id?: number }).company_id,
      });
      setStoredTokens(data.accessToken, data.refreshToken, data.expiresIn);
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
