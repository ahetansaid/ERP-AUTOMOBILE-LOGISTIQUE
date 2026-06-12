"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";

type LoginResponse = {
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    first_name?: string;
    last_name?: string;
    role: string;
    companyId?: number;
    company_id?: number;
  };
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

export default function LoginPage() {
  const { loginSuccess } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const finishLogin = (d: LoginResponse) => {
    if (!d.user || !d.accessToken || !d.refreshToken || d.expiresIn == null) return;
    loginSuccess({
      user: {
        id: d.user.id,
        email: d.user.email,
        firstName: d.user.firstName ?? d.user.first_name,
        lastName: d.user.lastName ?? d.user.last_name,
        role: d.user.role as import("@/types").UserRole,
        companyId: d.user.companyId ?? d.user.company_id,
      },
      accessToken: d.accessToken,
      refreshToken: d.refreshToken,
      expiresIn: d.expiresIn,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>(
        "/auth/login",
        { email, password },
        { skipAuth: true }
      );
      if (data?.requiresTwoFactor && data.twoFactorToken) {
        setTwoFactorToken(data.twoFactorToken);
      } else if (data) {
        finishLogin(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>(
        "/auth/2fa/verify",
        { twoFactorToken, code },
        { skipAuth: true }
      );
      if (data) finishLogin(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {twoFactorToken ? (
        <>
          <div className="mb-6">
            <span className="mb-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:ring-brand-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Vérification 2FA
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Entrez le code à 6 chiffres de votre application d&apos;authentification.
            </p>
          </div>
          <form onSubmit={handleVerify2FA} className="space-y-5">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              label="Code à 6 chiffres"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoComplete="one-time-code"
              placeholder="123456"
            />
            {error && (
              <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={loading} disabled={code.length !== 6}>
              Vérifier
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => { setTwoFactorToken(null); setCode(""); setError(null); }}
            >
              ← Retour
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-7">
            <h2 className="animate-fade-up text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Bon retour 👋
            </h2>
            <p className="mt-1 animate-fade-up text-sm text-neutral-500 [animation-delay:60ms] dark:text-neutral-400">
              Connectez-vous à votre espace ParcAuto Manager
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-up [animation-delay:120ms]">
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="vous@entreprise.com"
              />
            </div>
            <div className="animate-fade-up [animation-delay:180ms]">
              <Input
                type="password"
                label="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="animate-fade-in rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300" role="alert">
                {error}
              </p>
            )}
            <div className="animate-fade-up [animation-delay:240ms]">
              <Button type="submit" className="w-full" loading={loading}>
                Se connecter
              </Button>
            </div>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link
          href="/mot-de-passe-oublie"
          className="font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline dark:text-brand-400"
        >
          Mot de passe oublié ?
        </Link>
      </p>
    </AuthShell>
  );
}
