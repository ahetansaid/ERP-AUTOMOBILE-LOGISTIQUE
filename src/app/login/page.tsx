"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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
    <div className="flex min-h-screen bg-mesh">
      {/* Panneau gauche : branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 p-12 text-white lg:flex">
        <div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
            P
          </span>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            ParcAuto Manager
          </h2>
          <p className="max-w-sm text-primary-200/90">
            Solution professionnelle pour la gestion de votre parc automobile. Pilotage, transit et comptabilité en un seul endroit.
          </p>
        </div>
        <p className="text-xs text-primary-300/70">
          © ParcAuto Manager — Tous droits réservés
        </p>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-soft-lg">
          {twoFactorToken ? (
            <>
              <h1 className="mb-2 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Vérification 2FA
              </h1>
              <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                Entrez le code à 6 chiffres de votre application d&apos;authentification.
              </p>
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
                  <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                  disabled={code.length !== 6}
                >
                  Vérifier
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setTwoFactorToken(null);
                    setCode("");
                    setError(null);
                  }}
                >
                  ← Retour
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Connexion
              </h1>
              <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                Accédez à votre espace ParcAuto Manager
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Input
                  type="password"
                  label="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                {error && (
                  <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" loading={loading}>
                  Se connecter
                </Button>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link
              href="/mot-de-passe-oublie"
              className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
