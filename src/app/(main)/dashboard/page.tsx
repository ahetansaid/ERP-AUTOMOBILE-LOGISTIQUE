"use client";

/**
 * Tableau de bord.
 *
 * Composition épurée : un en-tête typographique, le bandeau de KPI, ce qui
 * demande une action, puis les graphiques. Aucune image d'illustration — un
 * tableau de bord se lit, il ne se décore pas.
 *
 * Ce qui a été retiré, et pourquoi :
 *
 *   · la photo d'accroche. Elle mangeait un tiers du premier écran, dépendait
 *     d'un hébergeur externe, et ne portait aucune information.
 *   · les quatre jauges de « fiabilité ». Chacune se comparait à son propre
 *     maximum : `value={clients} total={max(clients,1)}` affiche 100 % que la
 *     base contienne un client ou mille. Une jauge qui ne peut pas descendre
 *     n'est pas une mesure, c'est un ornement.
 *   · la ligne de pied qui commentait le système de design. Elle s'adressait à
 *     nous, pas au gérant.
 *
 * Chaque bloc se charge et se dégrade INDÉPENDAMMENT : un endpoint absent
 * efface son bloc au lieu de faire tomber la page.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { DashboardStats } from "@/types/dashboard";
import { Card } from "@/components/ui/Card";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { KpiTile } from "@/components/dashboard/KpiTile";
import {
  AreaChart,
  BandChart,
  DonutChart,
  fmtCompact,
  type AreaPoint,
  type Band,
  type Slice,
} from "@/components/charts/primitives";

/* ── Formes des réponses ──────────────────────────────────────────────────── */

interface Balances {
  accounts: { id: number; label: string; balance: number }[];
  total: number;
}
interface Resultat {
  revenue: number;
  /** Ventes dont le véhicule — donc le coût — est connu. */
  revenueRapproche: number;
  /** Ventes sur un véhicule qu'aucun classeur ne chiffre : marge incalculable. */
  revenueNonRapproche: number;
  costOfSales: number;
  grossMargin: number;
  /** Coût des véhicules encore en stock : un actif, pas une charge. */
  stockValue: number;
  vehiculesVendus: number;
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

/**
 * Intertitre de section.
 *
 * Structure la page sans ajouter de conteneur : empiler des cartes autour de
 * groupes de cartes produit des cadres dans des cadres, et c'est ce qui
 * alourdissait la page.
 */
function Section({
  titre,
  action,
  children,
}: {
  titre: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
          {titre}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

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
      <div className="space-y-10">
        <div className="space-y-3">
          <div className="h-3 w-40 animate-pulse rounded bg-neutral-200/70 dark:bg-neutral-800/60" />
          <div className="h-9 w-2/3 animate-pulse rounded-lg bg-neutral-200/70 dark:bg-neutral-800/60" />
        </div>
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
  const produitsRapproches = resultat?.revenueRapproche ?? 0;
  const produitsNonRapproches = resultat?.revenueNonRapproche ?? 0;
  const coutVentes = resultat?.costOfSales ?? 0;
  const valeurStock = resultat?.stockValue ?? 0;
  const vendus = resultat?.vehiculesVendus ?? 0;
  const resultatNet = resultat?.result ?? 0;

  const evolution =
    serie.length > 1 && serie[0].value !== 0
      ? ((serie[serie.length - 1].value - serie[0].value) / Math.abs(serie[0].value)) * 100
      : 0;

  const charges: Slice[] = resultat
    ? [
        { label: "Coût des ventes", value: Math.abs(coutVentes) },
        { label: "Charges générales", value: Math.abs(resultat.overheads) },
        { label: "Résultat", value: Math.max(0, resultatNet) },
      ].filter((s) => s.value > 0)
    : [];

  // Le beignet ne vaut que si les parts composent réellement le tout. Quand le
  // résultat est négatif, les charges dépassent les produits : le centre
  // n'aurait plus de sens, et deux parts ne font pas un camembert.
  const partToWhole = resultatNet > 0 && charges.length >= 3;

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

  const aujourdhui = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-10 pb-4">
      {/* En-tête typographique */}
      <header className="border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
          {aujourdhui}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-[2.125rem] dark:text-neutral-50">
            {enStock > 0 ? (
              <>
                {enStock} véhicules en stock,{" "}
                <span className="tabular-nums">{fmtCompact(treso)} FCFA</span> en
                caisse
              </>
            ) : (
              "Tableau de bord"
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {criticites > 0 && (
              <Link
                href="/alertes"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3.5 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-100 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-300 dark:hover:bg-danger-950/70"
              >
                <span aria-hidden>⛔</span>
                {criticites} anomalie{criticites > 1 ? "s" : ""}
              </Link>
            )}
            <Link
              href="/supply-chain/vue-globale"
              className="inline-flex h-9 items-center rounded-xl border border-neutral-200 px-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              Vue globale
            </Link>
          </div>
        </div>
      </header>

      {degrade && (
        <p className="rounded-xl border border-warning-200 bg-warning-50/70 px-4 py-3 text-sm text-warning-800 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-200">
          Le grand livre ne répond pas encore. Appliquez les migrations puis
          lancez l&apos;installation — voir{" "}
          <Link href="/installation" className="underline">
            Installation
          </Link>
          .
        </p>
      )}

      <Section titre="Indicateurs">
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
            foot={
              valeurStock > 0
                ? `${stock} disponibles · ${fmtCompact(valeurStock)} FCFA immobilisés`
                : `${stock} disponibles`
            }
          />
          <KpiTile
            label="Marge brute"
            value={marge}
            unit="FCFA"
            ton={marge >= 0 ? "ok" : "danger"}
            icon={icon("M2 12l4-4 3 3 5-6")}
            foot={
              produitsRapproches > 0
                ? `${((marge / produitsRapproches) * 100).toFixed(1)} % sur ${vendus} vente${vendus > 1 ? "s" : ""} chiffrée${vendus > 1 ? "s" : ""}`
                : "aucune vente chiffrable sur la période"
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
      </Section>

      <Section
        titre="À traiter"
        action={
          <Link
            href="/alertes"
            className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Toutes les anomalies
          </Link>
        }
      >
        <AlertsPanel />
      </Section>

      <Section titre="Trésorerie">
        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <Card
            title="Évolution du solde"
            description={
              serie.length > 1
                ? `${serie.length} journées, solde de clôture cumulé`
                : undefined
            }
          >
            {serie.length > 1 ? (
              <AreaChart data={serie} emphasizeLast color="var(--chart-3)" />
            ) : (
              <p className="py-12 text-center text-sm text-neutral-500">
                Aucun mouvement enregistré au grand livre.
              </p>
            )}
          </Card>

          <Card title="Soldes par compte">
            {bandesComptes.length > 0 ? (
              <BandChart data={bandesComptes} />
            ) : (
              <p className="py-12 text-center text-sm text-neutral-500">
                Aucun compte de trésorerie. Installez un modèle métier.
              </p>
            )}
          </Card>
        </div>
      </Section>

      <Section titre="Exploitation">
        {produitsNonRapproches > 0 && (
          <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
            <span aria-hidden>ℹ</span>{" "}
            <span className="tabular-nums font-medium">
              {fmtCompact(produitsNonRapproches)} FCFA
            </span>{" "}
            de ventes portent sur des véhicules dont aucun coût n&apos;est
            enregistré. Ils sont exclus de la marge, qui ne compare que ce qui
            est comparable.
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card
            title={partToWhole ? "Composition du résultat" : "Charges de la période"}
            description={
              !partToWhole && produits > 0
                ? `Pour ${fmtCompact(produits)} FCFA de produits`
                : undefined
            }
          >
            {charges.length > 0 ? (
              partToWhole ? (
                <DonutChart
                  data={charges}
                  centerValue={fmtCompact(produits)}
                  centerLabel="FCFA de produits"
                />
              ) : (
                <BandChart data={charges.map((c) => ({ label: c.label, value: c.value }))} />
              )
            ) : (
              <p className="py-12 text-center text-sm text-neutral-500">
                Aucun mouvement sur la période.
              </p>
            )}
          </Card>

          <Card
            title="Volume confié par prestataire"
            action={
              <Link
                href="/tiers"
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Voir les tiers
              </Link>
            }
          >
            {bandesPrestataires.length > 0 ? (
              <BandChart data={bandesPrestataires} />
            ) : (
              <p className="py-12 text-center text-sm text-neutral-500">
                Aucune dépense rattachée à un prestataire.
              </p>
            )}
          </Card>
        </div>
      </Section>
    </div>
  );
}
