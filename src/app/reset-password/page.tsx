"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Lien invalide : token manquant.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await apiPost(
        "/auth/reset-password",
        { token, newPassword: password },
        { skipAuth: true }
      );
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
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
          Nouveau mot de passe
        </h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Choisissez un mot de passe fort — au moins 8 caractères.
        </p>

        {success ? (
          <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm text-accent-800 dark:border-accent-900 dark:bg-accent-950/40 dark:text-accent-200">
            <p className="font-medium">Mot de passe mis à jour.</p>
            <p className="mt-1 text-accent-700 dark:text-accent-300">
              Redirection vers la connexion…
            </p>
          </div>
        ) : !token ? (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-200">
            Lien invalide : aucun token fourni. Demandez un nouveau lien via la
            page « Mot de passe oublié ».
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="password"
              label="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              hint="Minimum 8 caractères"
            />
            <Input
              type="password"
              label="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
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
              disabled={!password || !confirm || loading}
            >
              Enregistrer le nouveau mot de passe
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-mesh">
          <p className="text-sm text-neutral-500">Chargement…</p>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
