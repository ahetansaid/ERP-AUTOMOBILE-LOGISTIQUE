"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Severity = "info" | "warning" | "danger";

type Alert = {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  link?: string;
  count?: number;
};

type AlertsResponse = {
  alerts: Alert[];
  generatedAt: string;
  total: number;
};

const ICON: Record<Severity, string> = {
  info: "ℹ",
  warning: "⚠",
  danger: "⛔",
};

const SEVERITY_STYLES: Record<
  Severity,
  { card: string; icon: string; badge: "info" | "warning" | "danger" }
> = {
  info: {
    card: "border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/30",
    icon: "text-sky-600 dark:text-sky-400",
    badge: "info",
  },
  warning: {
    card: "border-warning-200 bg-warning-50/60 dark:border-warning-900 dark:bg-warning-950/30",
    icon: "text-warning-600 dark:text-warning-400",
    badge: "warning",
  },
  danger: {
    card: "border-danger-200 bg-danger-50/60 dark:border-danger-900 dark:bg-danger-950/30",
    icon: "text-danger-600 dark:text-danger-400",
    badge: "danger",
  },
};

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiGet<AlertsResponse>("/dashboard/alerts");
        if (!cancelled) setAlerts(data?.alerts ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Erreur alertes");
      }
    }
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (alerts === null && !error) return null; // loading silencieux
  if (error) {
    return (
      <Card variant="outline" className="border-warning-200 bg-warning-50/50">
        <p className="text-sm text-warning-800">Alertes indisponibles : {error}</p>
      </Card>
    );
  }
  if (!alerts || alerts.length === 0) {
    return (
      <Card variant="outline" className="border-accent-200 bg-accent-50/40">
        <div className="flex items-center gap-3">
          <span className="text-lg">✓</span>
          <p className="text-sm font-medium text-accent-800 dark:text-accent-200">
            Aucune alerte active — tout est sous contrôle.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Alertes ({alerts.length})
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {alerts.map((a) => {
          const style = SEVERITY_STYLES[a.severity];
          return (
            <Card
              key={a.id}
              variant="outline"
              className={`${style.card} transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-xl leading-none ${style.icon}`}>
                  {ICON[a.severity]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {a.title}
                    </p>
                    {a.count != null && (
                      <Badge variant={style.badge} size="sm">
                        {a.count}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                    {a.message}
                  </p>
                  {a.link && (
                    <Link
                      href={a.link}
                      className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Voir →
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
