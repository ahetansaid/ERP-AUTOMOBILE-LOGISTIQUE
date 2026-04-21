"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type Status = { enabled: boolean };
type SetupResponse = {
  secret: string;
  otpAuthUrl: string;
  qrDataUrl: string;
  issuer: string;
};

type Mode = "idle" | "setup" | "confirm" | "disable";

export function TwoFactorPanel() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiGet<Status>("/auth/2fa/status");
      setEnabled(!!res?.enabled);
    } catch {
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const startSetup = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await apiPost<SetupResponse>("/auth/2fa/setup", {});
      setSetup(res);
      setMode("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const confirmEnable = async () => {
    if (!code) return;
    setError(null);
    setLoading(true);
    try {
      await apiPost("/auth/2fa/enable", { code });
      setSuccess("Authentification 2FA activée avec succès.");
      setEnabled(true);
      setSetup(null);
      setCode("");
      setMode("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code incorrect");
    } finally {
      setLoading(false);
    }
  };

  const confirmDisable = async () => {
    if (!code) return;
    setError(null);
    setLoading(true);
    try {
      await apiPost("/auth/2fa/disable", { code });
      setSuccess("Authentification 2FA désactivée.");
      setEnabled(false);
      setCode("");
      setMode("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Authentification à deux facteurs"
      description="Protégez votre compte avec un code temporaire via une application d'authentification (Google Authenticator, Authy, 1Password…)."
      action={
        enabled === true ? (
          <Badge variant="success" dot>
            Activée
          </Badge>
        ) : enabled === false ? (
          <Badge variant="outline" dot>
            Désactivée
          </Badge>
        ) : null
      }
    >
      {success && (
        <p className="mb-4 rounded-lg bg-accent-50 px-3 py-2 text-sm font-medium text-accent-800 dark:bg-accent-950/40 dark:text-accent-200">
          {success}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm font-medium text-danger-700">
          {error}
        </p>
      )}

      {mode === "idle" && enabled === false && (
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={startSetup} loading={loading}>
            Activer la 2FA
          </Button>
          <p className="text-sm text-neutral-500">
            Recommandé pour les comptes administrateurs.
          </p>
        </div>
      )}

      {mode === "idle" && enabled === true && (
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setMode("disable")}>
            Désactiver la 2FA
          </Button>
          <p className="text-sm text-neutral-500">
            Saisissez un code pour désactiver.
          </p>
        </div>
      )}

      {mode === "confirm" && setup && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
            <ol className="ml-5 list-decimal space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>
                Ouvrez votre application d'authentification (Google Authenticator,
                Authy, 1Password…)
              </li>
              <li>Scannez le QR code ci-dessous ou saisissez le secret manuellement</li>
              <li>Entrez le code à 6 chiffres généré</li>
            </ol>
          </div>

          <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
            <img
              src={setup.qrDataUrl}
              alt="QR code 2FA"
              className="h-60 w-60 rounded-xl border border-neutral-200 bg-white p-2 dark:border-neutral-800"
            />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Secret manuel
                </p>
                <code className="mt-1 block break-all rounded-lg bg-neutral-100 px-3 py-2 font-mono text-sm dark:bg-neutral-800">
                  {setup.secret}
                </code>
              </div>
              <div>
                <Input
                  label="Code à 6 chiffres"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={confirmEnable}
                  loading={loading}
                  disabled={code.length !== 6}
                >
                  Activer
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMode("idle");
                    setSetup(null);
                    setCode("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "disable" && (
        <div className="space-y-3">
          <Input
            label="Code à 6 chiffres"
            hint="Entrez le code courant pour confirmer la désactivation."
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            autoComplete="one-time-code"
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={confirmDisable}
              loading={loading}
              disabled={code.length !== 6}
            >
              Désactiver la 2FA
            </Button>
            <Button variant="ghost" onClick={() => { setMode("idle"); setCode(""); }}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
