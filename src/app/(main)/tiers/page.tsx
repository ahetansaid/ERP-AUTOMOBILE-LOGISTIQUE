"use client";

/**
 * Référentiel des tiers.
 *
 * Avant, un prestataire n'était qu'une chaîne de caractères tapée dans un devis
 * — avec toutes ses variantes d'orthographe. Il devient ici une entité, dont on
 * mesure le volume confié à partir du grand livre.
 *
 * Les regroupements sont proposés, jamais appliqués d'office : rien ne dit
 * encore si « Jean EURO » et « Jean USA » sont une personne sur deux parcs ou
 * deux homonymes.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImportExport } from "@/components/data/ImportExport";

type Kind =
  | "CLIENT" | "FOURNISSEUR" | "PRESTATAIRE" | "TRANSITAIRE"
  | "TRANSPORTEUR" | "ADMINISTRATION" | "AUTRE";

interface Partner {
  id: number;
  name: string;
  slug: string;
  kinds: Kind[];
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  volume: number;
  sens: "depense" | "recette" | null;
  mouvements: number;
}

interface Suggestion {
  key: string;
  partners: { id: number; name: string; slug: string; specialty?: string | null }[];
}

const KIND_LABEL: Record<Kind, string> = {
  CLIENT: "Client",
  FOURNISSEUR: "Fournisseur",
  PRESTATAIRE: "Prestataire",
  TRANSITAIRE: "Transitaire",
  TRANSPORTEUR: "Transporteur",
  ADMINISTRATION: "Administration",
  AUTRE: "Autre",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "PRESTATAIRE", label: "Prestataires" },
  { value: "CLIENT", label: "Clients" },
  { value: "FOURNISSEUR", label: "Fournisseurs" },
  { value: "TRANSITAIRE", label: "Transitaires" },
];

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

export default function TiersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (kind) qs.set("kind", kind);
      if (query) qs.set("q", query);
      const [list, sugg] = await Promise.all([
        apiGet<{ partners?: Partner[] }>(`/partners${qs.toString() ? `?${qs}` : ""}`),
        apiGet<{ suggestions?: Suggestion[] }>("/partners/suggestions"),
      ]);
      setPartners(list?.partners ?? []);
      setSuggestions(sugg?.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, [kind, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const merge = async (sourceId: number, targetId: number) => {
    try {
      await apiPost(`/partners/${sourceId}/merge`, { targetId });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fusion impossible");
    }
  };

  const totalVolume = partners.reduce(
    (s, p) => (p.sens === "depense" ? s + p.volume : s),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tiers</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Clients, fournisseurs, prestataires et transitaires. Un tiers existe et
          se mesure sans avoir besoin d&apos;un compte.
        </p>
      </div>

      {suggestions.length > 0 && (
        <Card title="Regroupements possibles">
          <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
            Ces tiers ne diffèrent que par le suffixe de parc. Fusionnez-les
            seulement s&apos;il s&apos;agit bien de la même personne — la
            séparation ne pourra pas être rétablie.
          </p>
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li
                key={s.key}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-warning-200 bg-warning-50/60 px-3 py-2 dark:border-warning-800 dark:bg-warning-900/20"
              >
                <span className="font-mono text-xs text-neutral-500">{s.key}</span>
                {s.partners.map((p) => (
                  <Badge key={p.id} variant="outline">
                    {p.name}
                  </Badge>
                ))}
                {s.partners.length === 2 && (
                  <Button
                    size="xs"
                    variant="secondary"
                    className="ml-auto"
                    onClick={() => merge(s.partners[1].id, s.partners[0].id)}
                  >
                    Fusionner dans « {s.partners[0].name} »
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Filtres">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setKind(f.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  kind === f.value
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Input
            label="Recherche"
            placeholder="Nom, métier…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {error && (
        <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
          {error}
        </p>
      )}

      <Card
        title={`${partners.length} tiers`}
        action={
          totalVolume > 0 ? (
            <span className="font-mono text-xs text-neutral-500">
              {fmt(totalVolume)} confiés
            </span>
          ) : undefined
        }
      >
        {loading ? (
          <p className="py-6 text-sm text-neutral-500">Chargement…</p>
        ) : partners.length === 0 ? (
          <p className="py-6 text-sm text-neutral-500">
            Aucun tiers. Ils apparaîtront après la reprise des clients,
            fournisseurs et prestataires.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                  <th className="p-3 font-medium">Tiers</th>
                  <th className="p-3 font-medium">Rôles</th>
                  <th className="p-3 font-medium">Métier</th>
                  <th className="p-3 text-right font-medium">Volume</th>
                  <th className="p-3 text-right font-medium">Mouvements</th>
                  <th className="p-3 text-right font-medium">Ticket moyen</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-100 dark:border-neutral-800"
                  >
                    <td className="p-3">
                      <span className="font-medium">{p.name}</span>
                      {!p.isActive && (
                        <Badge variant="outline" className="ml-2">
                          archivé
                        </Badge>
                      )}
                      <span className="block font-mono text-xs text-neutral-500">
                        {p.slug}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex flex-wrap gap-1">
                        {p.kinds.map((k) => (
                          <Badge key={k} variant="info">
                            {KIND_LABEL[k]}
                          </Badge>
                        ))}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400">
                      {p.specialty ?? "—"}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums">
                      {p.volume > 0 ? fmt(p.volume) : "—"}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums">
                      {p.mouvements || "—"}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-neutral-500">
                      {p.mouvements > 0 ? fmt(p.volume / p.mouvements) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <ImportExport
        titre="Ajouter des tiers en masse"
        ressource="partners"
        description="Prestataires, transitaires, fournisseurs. Un tiers dont l'identifiant existe déjà est refusé, jamais fusionné."
      />

    </div>
  );
}
