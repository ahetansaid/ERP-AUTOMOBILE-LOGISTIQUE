"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setAuth } from "@/lib/auth";
import { authApi } from "@/lib/services/api";
import { IconParc } from "@/components/icons/NavIcons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setAuth(data.accessToken, data.refreshToken, data.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion refusée");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-surface-dark p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/20 text-accent-400">
            <IconParc />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              ERP Auto
            </span>
            <span className="block text-sm text-slate-400">
              Logistique & Transit
            </span>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            Gestion complète
            <br />
            <span className="text-accent-400">automobile & logistique</span>
          </h2>
          <p className="mt-4 max-w-sm text-slate-400">
            Parc véhicules, transit, douane, comptabilité et CRM — une seule plateforme pour piloter votre activité.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Afrique • Bénin • Conformité MECeF
        </p>
      </div>
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white">
                <IconParc />
              </div>
              <span className="text-xl font-bold text-slate-800">ERP Auto</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Connexion
          </h1>
          <p className="mt-2 text-slate-500">
            Utilisez vos identifiants pour accéder à la plateforme.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
              required
              className="rounded-xl border-slate-200"
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="rounded-xl border-slate-200"
            />
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>
          <p className="mt-8 text-center text-xs text-slate-400">
            Compte démo : admin@erp.bj / Admin123!
          </p>
        </div>
      </div>
    </div>
  );
}
