"use client";

/**
 * Tableau de bord.
 *
 * Grammaire visuelle validée en maquette : bandeau KPI en tête, anomalies
 * immédiatement sous lui, puis les graphiques. La profondeur habille les
 * surfaces ; les données restent plates.
 *
 * Chaque bloc se charge et se dégrade INDÉPENDAMMENT. Les données du grand
 * livre, des tiers et des alertes viennent d'endpoints introduits par les
 * migrations récentes : tant qu'elles ne sont pas appliquées, ces blocs
 * s'effacent au lieu de faire tomber la page.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { DashboardStats } from "@/types/dashboard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { KpiTile } from "@/components/dashboard/KpiTile";
import {
  AreaChart,
  BandChart,
  DonutChart,
  Gauge,
  fmtCompact,
  type AreaPoint,
  type Band,
  type Slice,
} from "@/components/charts/primitives";

const DASH_HERO =
  "https://images.pexels.com/photos/16206733/pexels-photo-16206733.jpeg?auto=compress&cs=tinysrgb&w=1200";

/* ── Formes des réponses ──────────────────────────────────────────────────── */

interface Balances {
  accounts: { id: number; label: string; balance: number }[];
  total: number;
}
interface Resultat {
  revenue: number;
  costOfSales: number;
  grossMargin: number;
  overheads: number;
  result: number;
}
interface LedgerEntry {
  entry_date: string;
  amount_fcfa: number;
  cash_account_id: number | null;
}
interface Alertes {
  resume?: Record<string, number>;
}
interface Partner {
  name: string;
  specialty?: string | null;
  volume: number;
  mouvements: number;
}

/** Charge une ressource sans jamais propager l'échec. */
async function tryGet<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch {
    return null;
  }
}

const icon = (d: string) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d={d} />
  </svg>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [serie, setSerie] = useState<AreaPoint[]>([]);
  const [alertes, setAlertes] = useState<Record<string, number>>({});
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [degrade, setDegrade] = useState(false);

  const fetchAll = useCallback(async () => {
    const [s, b, r, l, a, p] = await Promise.all([
      tryGet<DashboardStats>("/dashboard/stats"),
      tryGet<Balances>("/ledger/balances"),
      tryGet<Resultat>("/ledger/resultat"),
      tryGet<{ entries?: LedgerEntry[] }>("/ledger?limit=400"),
      tryGet<Alertes>("/alertes"),
      tryGet<{ partners?: Partner[] }>("/partners?kind=PRESTATAIRE"),
    ]);

    setStats(s);
    setBalances(b);
    setResultat(r);
    setAlertes(a?.resume ?? {});
    setPartners((p?.partners ?? []).filter((x) => x.volume > 0).slice(0, 8));
    setDegrade(!b || !r);

    // Solde de clôture par jour, reconstitué en cumulant les mouvements de
    // caisse dans l'ordre chronologique.
    const entries = (l?.entries ?? []).filter((e) => e.cash_account_id != null);
    if (entries.length) {
      const parJour = new Map<string, number>();
      for (const e of entries) {
        const jour = String(e.entry_date).slice(0, 10);
        parJour.set(jour, (parJour.get(jour) ?? 0) + Number(e.amount_fcfa));
      }
      let cumul = 0;
      // Array.from plutôt que le spread : la cible TS du projet est antérieure
      // à ES2015 pour l'itération des Map.
      const points = Array.from(parJour.entries())
        .sort((x, y) => x[0].localeCompare(y[0]))
        .map(([jour, delta]) => {
          cumul += delta;
          return {
            label: `${jour.slice(8, 10)}/${jour.slice(5, 7)}`,
            value: cumul,
          };
        });
      setSerie(points.slice(-30));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const onFocus = () => fetchAll();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-36 animate-pulse rounded-3xl bg-neutral-200/70 dark:bg-neutral-800/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/60"
            />
          ))}
        </div>
      </div>
    );
  }

  const stock = stats?.stockDisponible ?? 0;
  const enStock = stock + (stats?.stockNonRegulier ?? 0) + (stats?.stockRegularise ?? 0);
  const treso = balances?.total ?? 0;
  const marge = resultat?.grossMargin ?? 0;
  const produits = resultat?.revenue ?? 0;
  const coutVentes = resultat?.costOfSales ?? 0;

  const evolution =
    serie.length > 1 && serie[0].value !== 0
      ? ((serie[serie.length - 1].value - serie[0].value) / Math.abs(serie[0].value)) * 100
      : 0;

  const compositionResultat: Slice[] = resultat
    ? [
        { label: "Coût des ventes", value: Math.abs(coutVentes) },
        { label: "Charges générales", value: Math.abs(resultat.overheads) },
        { label: "Marge nette", value: Math.max(0, resultat.result) },
      ].filter((s) => s.value > 0)
    : [];

  const bandesComptes: Band[] =
    balances?.accounts.map((a) => ({
      label: a.label,
      value: a.balance,
      danger: a.balance < 0,
    })) ?? [];

  const bandesPrestataires: Band[] = partners.map((p) => ({
    label: p.name,
    value: p.volume,
    hint: `${p.mouvements} mouvement${p.mouvements > 1 ? "s" : ""}${p.specialty ? ` · ${p.specialty}` : ""}`,
  }));

  const criticites =
    (alertes.CRITIQUE ?? 0) + (alertes.ALERTE ?? 0) + (alertes.INFO ?? 0);

  return (
    <div className="space-y-6">
      {/* Bandeau */}
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${DASH_HERO})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/60 to-neutral-950/20" />
        <div className="relative flex flex-col gap-3 p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-white/70">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {enStock > 0 && treso > 0
              ? `${enStock} véhicules en stock, ${fmtCompact(treso)} FCFA en caisse`
              : "Tableau de bord"}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/supply-chain/vue-globale"
              className="inline-flex h-9 items-center rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Vue globale
            </Link>
            {criticites > 0 && (
              <Link
                href="/alertes"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-danger-500/90 px-4 text-sm font-semibold text-white transition-colors hover:bg-danger-500"
              >
                {criticites} anomalie{criticites > 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </div>
      </div>

      {degrade && (
        <p className="rounded-xl border border-warning-200 bg-warning-50/70 px-4 py-3 text-sm text-warning-800 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-200">
          Le grand livre ne répond pas encore. Appliquez les migrations puis
          lancez l&apos;installation — voir <Link href="/installation" className="underline">Installation</Link>.
        </p>
      )}

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          hero
          label="Trésorerie"
          value={treso}
          unit="FCFA"
          ton={treso < 500000 ? "danger" : "brand"}
          icon={icon("M2 6h12v7H2zM2 6l6-3 6 3")}
          spark={serie.length > 1 ? serie.map((p) => p.value) : undefined}
          delta={
            serie.length > 1
              ? { pct: evolution, label: "sur la période", favorable: evolution >= 0 }
              : undefined
          }
          foot={
            balances
              ? `${balances.accounts.length} compte${balances.accounts.length > 1 ? "s" : ""}`
              : null
          }
        />
        <KpiTile
          label="Véhicules en stock"
          value={enStock}
          raw
          ton="brand"
          icon={icon("M2 4h12v8H2zM6 4v8M10 4v8")}
          proportion={[
            { pct: enStock ? (stock / enStock) * 100 : 0, tone: "brand" },
            { pct: enStock ? ((enStock - stock) / enStock) * 100 : 0, tone: "warn" },
          ]}
          foot={`${stock} disponibles`}
        />
        <KpiTile
          label="Marge brute"
          value={marge}
          unit="FCFA"
          ton={marge >= 0 ? "ok" : "danger"}
          icon={icon("M2 12l4-4 3 3 5-6")}
          foot={
            produits > 0
              ? `${((marge / produits) * 100).toFixed(1)} % du chiffre d'affaires`
              : "aucune vente sur la période"
          }
        />
        <KpiTile
          label="Anomalies ouvertes"
          value={criticites}
          raw
          ton={alertes.CRITIQUE ? "danger" : criticites ? "warn" : "ok"}
          icon={icon("M8 2l6 11H2zM8 6v3")}
          foot={
            alertes.CRITIQUE
              ? `dont ${alertes.CRITIQUE} critique${alertes.CRITIQUE > 1 ? "s" : ""}`
              : "aucune critique"
          }
        />
      </div>

      {/* Anomalies, en tête et non reléguées en pied de page */}
      <AlertsPanel />

      {/* Trésorerie et composition */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card
          title="Évolution de la trésorerie"
          action={
            <span className="font-mono text-xs text-neutral-500">
              {serie.length} journée{serie.length > 1 ? "s" : ""}
            </span>
          }
        >
          {serie.length > 1 ? (
            <AreaChart data={serie} emphasizeLast color="var(--chart-3)" />
          ) : (
            <p className="py-10 text-center text-sm text-neutral-500">
              Aucun mouvement enregistré au grand livre.
            </p>
          )}
        </Card>

        <Card title="Composition du résultat">
          {compositionResultat.length > 0 ? (
            <DonutChart
              data={compositionResultat}
              centerValue={fmtCompact(produits)}
              centerLabel="FCFA de produits"
            />
          ) : (
            <p className="py-10 text-center text-sm text-neutral-500">
              Aucun produit sur la période.
            </p>
          )}
        </Card>
      </div>

      {/* Comptes et prestataires */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Soldes par compte">
          {bandesComptes.length > 0 ? (
            <BandChart data={bandesComptes} />
          ) : (
            <p className="py-8 text-center text-sm text-neutral-500">
              Aucun compte de trésorerie. Installez un modèle métier.
            </p>
          )}
        </Card>

        <Card
          title="Volume confié par prestataire"
          action={
            <Link href="/tiers" className="text-xs text-brand-600 hover:underline">
              Voir les tiers
            </Link>
          }
        >
          {bandesPrestataires.length > 0 ? (
            <BandChart data={bandesPrestataires} />
          ) : (
            <p className="py-8 text-center text-sm text-neutral-500">
              Aucune dépense rattachée à un prestataire.
            </p>
          )}
        </Card>
      </div>

      {/* Fiabilité */}
      <Card
        title="Fiabilité des données"
        action={
          <Link href="/installation" className="text-xs text-brand-600 hover:underline">
            Installation
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Gauge
            value={stats?.nombreClients ?? 0}
            total={Math.max(stats?.nombreClients ?? 0, 1)}
            label="Clients référencés"
            sublabel={`${stats?.nombreClients ?? 0}`}
          />
          <Gauge
            value={enStock - (stats?.vehiclesEnMaintenance ?? 0)}
            total={Math.max(enStock, 1)}
            label="Hors atelier"
            sublabel={`${enStock - (stats?.vehiclesEnMaintenance ?? 0)} / ${enStock}`}
          />
          <Gauge
            value={Math.max(0, criticites === 0 ? 1 : 0)}
            total={1}
            label="Aucune anomalie"
            sublabel={criticites === 0 ? "conforme" : `${criticites} à traiter`}
          />
          <Gauge
            value={balances?.accounts.length ?? 0}
            total={Math.max(balances?.accounts.length ?? 0, 3)}
            label="Comptes configurés"
            sublabel={`${balances?.accounts.length ?? 0} / 3`}
          />
        </div>
      </Card>

      <p className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-neutral-400">
        <span>Profondeur sur les surfaces, jamais sur les données</span>
        <span>Rampe séquentielle validée en clair et en sombre</span>
        {stats?.currency && <Badge variant="outline">{stats.currency}</Badge>}
      </p>
    </div>
  );
}
