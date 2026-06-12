"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const HERO_IMAGE =
  "https://images.pexels.com/photos/395537/pexels-photo-395537.jpeg?auto=compress&cs=tinysrgb&w=1400";

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

/* Petites icônes inline (pas de dépendance) */
const IconCar = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
    <path d="M3 17h18v-2.5a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 14.5V17z" />
    <circle cx="7" cy="17.5" r="1.5" />
    <circle cx="17" cy="17.5" r="1.5" />
  </svg>
);
const IconShip = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 15l1.6 4.2a1 1 0 0 0 .94.65h12.9a1 1 0 0 0 .94-.65L21 15" />
    <path d="M5 15V9l7-3 7 3v6" />
    <path d="M12 6V3" />
  </svg>
);
const IconChart = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);

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
    <div className="relative grid min-h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 lg:grid-cols-[1.1fr_1fr]">
      {/* ──────────────── Panneau gauche : hero visuel ──────────────── */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* Photo + ken burns */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="Parc automobile vu du ciel"
          className="absolute inset-0 h-full w-full origin-center animate-ken-burns object-cover"
        />
        {/* Dégradés de marque par-dessus la photo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/95 via-brand-900/70 to-brand-700/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-neutral-950/30" />

        {/* Halo lumineux animé */}
        <div className="absolute -left-24 top-1/3 h-72 w-72 animate-blob rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 animate-blob rounded-full bg-accent-500/20 blur-3xl [animation-delay:4s]" />

        {/* Contenu */}
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-up">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur-md ring-1 ring-white/20">
              P
            </span>
            <span className="text-lg font-semibold tracking-tight">ParcAuto Manager</span>
          </div>

          {/* Accroche */}
          <div className="max-w-lg space-y-6">
            <div className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20 backdrop-blur [animation-delay:80ms]">
              <span className="text-base leading-none">🇧🇯</span>
              Pensé pour le Bénin & l&apos;Afrique de l&apos;Ouest
            </div>
            <h1 className="animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight [animation-delay:140ms] xl:text-5xl">
              Pilotez votre parc auto,
              <span className="block bg-gradient-to-r from-white via-brand-200 to-accent-300 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-pan">
                du port à la livraison.
              </span>
            </h1>
            <p className="max-w-md animate-fade-up text-base leading-relaxed text-white/80 [animation-delay:200ms]">
              Stock, achats, transit douanier, facturation et trésorerie —
              tout votre métier de concessionnaire et importateur, réuni sur une
              seule plateforme.
            </p>

            {/* Cartes flottantes (features) */}
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { icon: IconCar, label: "Stock & véhicules", sub: "VIN, photos, statuts" },
                { icon: IconShip, label: "Transit douane", sub: "Port de Cotonou" },
                { icon: IconChart, label: "Compta & trésorerie", sub: "Temps réel" },
              ].map((f, i) => (
                <div
                  key={f.label}
                  className="animate-float-y rounded-2xl border border-white/15 bg-white/10 p-3 pr-4 backdrop-blur-md [animation-delay:var(--d)]"
                  style={{ ["--d" as string]: `${i * 1.2}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-white">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{f.label}</div>
                      <div className="text-[11px] text-white/60">{f.sub}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="animate-fade-up text-xs text-white/50 [animation-delay:260ms]">
            © {new Date().getFullYear()} ParcAuto Manager — Tous droits réservés
          </p>
        </div>
      </div>

      {/* ──────────────── Panneau droit : formulaire ──────────────── */}
      <div className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        {/* Décor de fond (mobile + desktop) */}
        <div className="pointer-events-none absolute inset-0 bg-mesh" />
        <div className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 animate-blob rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative w-full max-w-md">
          {/* Bandeau hero mobile */}
          <div className="mb-6 overflow-hidden rounded-3xl lg:hidden">
            <div className="relative h-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 to-brand-700/30" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur">P</span>
                <span className="font-semibold tracking-tight">ParcAuto Manager</span>
              </div>
            </div>
          </div>

          <div className="animate-fade-up rounded-3xl border border-neutral-200/70 bg-white/80 p-7 shadow-soft-lg backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70 sm:p-9">
            {twoFactorToken ? (
              <>
                <div className="mb-6 animate-fade-up">
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
          </div>

          <p className="mt-6 text-center text-xs text-neutral-400">
            Plateforme sécurisée · Données chiffrées · Hébergé sur Neon & Vercel
          </p>
        </div>
      </div>
    </div>
  );
}
