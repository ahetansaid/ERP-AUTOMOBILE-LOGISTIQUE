"use client";

import { useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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
      await apiPost(
        "/auth/forgot-password",
        { email },
        { skipAuth: true }
      );
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh px-4 py-12">
      <Card className="w-full max-w-md border-0 shadow-soft-lg">
        <h1 className="mb-2 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Mot de passe oublié
        </h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Saisissez l'email de votre compte. Nous vous enverrons un lien pour
          définir un nouveau mot de passe.
        </p>

        {sent ? (
          <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm text-accent-800 dark:border-accent-900 dark:bg-accent-950/40 dark:text-accent-200">
            <p className="font-medium">Email envoyé (si le compte existe).</p>
            <p className="mt-1 text-accent-700 dark:text-accent-300">
              Vérifiez votre boîte de réception et suivez les instructions. Le
              lien expire dans 60 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="vous@example.com"
            />
            {error && (
              <p
                className="rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!email || loading}
            >
              Envoyer le lien
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </Card>
    </div>
  );
}
