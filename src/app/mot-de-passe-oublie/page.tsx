"use client";

import { useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost("/auth/forgot-password", { email }, { skipAuth: true });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-6">
        <span className="mb-3 inline-grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:ring-brand-500/20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
        </span>
        <h2 className="animate-fade-up text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Mot de passe oublié
        </h2>
        <p className="mt-1 animate-fade-up text-sm text-neutral-500 [animation-delay:60ms] dark:text-neutral-400">
          Saisissez l&apos;email de votre compte. Nous vous enverrons un lien pour définir un nouveau mot de passe.
        </p>
      </div>

      {sent ? (
        <div className="animate-fade-up rounded-2xl border border-accent-200 bg-accent-50 p-4 text-sm text-accent-800 dark:border-accent-900 dark:bg-accent-950/40 dark:text-accent-200">
          <p className="font-semibold">Email envoyé (si le compte existe).</p>
          <p className="mt-1 text-accent-700 dark:text-accent-300">
            Vérifiez votre boîte de réception et suivez les instructions. Le lien expire dans 60 minutes.
          </p>
        </div>
      ) : (
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
          {error && (
            <p className="animate-fade-in rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300" role="alert">
              {error}
            </p>
          )}
          <div className="animate-fade-up [animation-delay:180ms]">
            <Button type="submit" className="w-full" loading={loading} disabled={!email || loading}>
              Envoyer le lien
            </Button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link
          href="/login"
          className="font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline dark:text-brand-400"
        >
          ← Retour à la connexion
        </Link>
      </p>
    </AuthShell>
  );
}
