"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";

const STEP_LABELS: Record<string, string> = {
  ARRIVEE_PORT: "Arrivée port",
  ADMISSION_TEMPORAIRE: "Admission temporaire",
  DECLARATION_DOUANE: "Déclaration douane",
  MAINLEVEE: "Mainlevée",
  SCELLES_POSES: "Scellés posés",
  EN_ACHEMINEMENT: "En acheminement",
  LIVRE: "Livré",
};

interface StepCount {
  step: string;
  count: number;
}

export default function TransitPage() {
  const [steps, setSteps] = useState<StepCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiGet<{ steps?: StepCount[] }>("/transit/steps/summary");
      setSteps((res as { steps?: StepCount[] })?.steps ?? []);
    } catch {
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transit international</h1>
        <p className="mt-1 text-slate-600">Corridor Bénin — Burkina Faso. Vue par étape.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <p className="text-slate-500">Chargement…</p>
        ) : (
          steps.map((s) => (
            <Card key={s.step} className="border-l-4 border-l-blue-500">
              <p className="text-sm font-medium text-slate-500">{STEP_LABELS[s.step] ?? s.step}</p>
              <p className="text-2xl font-semibold text-slate-900">{s.count ?? 0}</p>
            </Card>
          ))
        )}
      </div>
      <Card title="Actions">
        <Link href="/transit/suivi" className="text-primary-600 hover:underline">Voir le suivi détaillé</Link>
      </Card>
    </div>
  );
}
