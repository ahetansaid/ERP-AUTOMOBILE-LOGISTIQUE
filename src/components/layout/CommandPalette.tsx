"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

type Command = {
  label: string;
  group: string;
  href?: string;
  action?: () => void;
  /** Mots-clés additionnels pour la recherche floue */
  keywords?: string[];
  /** Sous-titre affiché pour les résultats venant du serveur */
  subtitle?: string | null;
  /** Étiquette courte : VÉH, CNT, FAC… */
  badge?: string;
};

/** Un résultat de la recherche universelle côté serveur. */
type SearchHit = {
  type: string;
  id: number;
  badge: string;
  label: string;
  subtitle?: string | null;
};

/** Types disposant d'un dossier 360°. Les autres pointent vers leur liste. */
const DOSSIER_TYPES = ["Vehicle", "Purchase", "Invoice", "Partner"];

// Catalogue des commandes/actions rapides.
// Organisé comme la sidebar + quelques « actions » (création rapide).
const COMMANDS: Command[] = [
  { label: "Accueil", group: "Navigation", href: "/", keywords: ["dashboard", "tableau", "bord"] },
  { label: "Gestion des achats", group: "Supply Chain", href: "/supply-chain/achats" },
  { label: "Vue globale stock", group: "Supply Chain", href: "/supply-chain/vue-globale" },
  { label: "Stock disponible", group: "Supply Chain", href: "/supply-chain/stock-disponible" },
  { label: "Stock régulier", group: "Supply Chain", href: "/supply-chain/stock-regulier" },
  { label: "Stock non régulier", group: "Supply Chain", href: "/supply-chain/stock-non-regulier" },
  { label: "Atelier", group: "Supply Chain", href: "/supply-chain/atelier" },
  { label: "Charges", group: "Comptabilité", href: "/comptabilite/charges" },
  { label: "Devis", group: "Comptabilité", href: "/comptabilite/devis" },
  { label: "Factures", group: "Comptabilité", href: "/comptabilite/factures" },
  { label: "Reçus", group: "Comptabilité", href: "/comptabilite/recus" },
  { label: "Trésorerie", group: "Comptabilité", href: "/comptabilite/tresorerie" },
  { label: "Pro forma", group: "Comptabilité", href: "/comptabilite/proforma" },
  { label: "Rapports", group: "Comptabilité", href: "/comptabilite/rapports" },
  {
    label: "Réconciliation",
    group: "Comptabilité",
    href: "/comptabilite/reconciliation",
    keywords: ["grand", "livre", "ledger", "bascule", "ecart", "double", "ecriture"],
  },
  { label: "Transit", group: "Transit", href: "/transit" },
  { label: "Suivi transit", group: "Transit", href: "/transit/suivi" },
  { label: "CRM Clients", group: "CRM", href: "/crm" },
  {
    label: "Tiers",
    group: "CRM",
    href: "/tiers",
    keywords: ["prestataire", "fournisseur", "transitaire", "partenaire", "soudeur", "peintre"],
  },
  { label: "Utilisateurs", group: "Admin", href: "/utilisateurs" },
  { label: "Paramètres", group: "Admin", href: "/parametres" },
  {
    label: "Alertes",
    group: "Admin",
    href: "/alertes",
    keywords: ["anomalie", "regle", "seuil", "dormant", "echue", "incoherent"],
  },
  { label: "Notifications", group: "Admin", href: "/notifications" },
  {
    label: "Aperçu des documents (templates)",
    group: "Design",
    href: "/documents/preview",
    keywords: ["facture", "recu", "devis", "proforma", "template", "pdf"],
  },
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matches(cmd: Command, query: string) {
  if (!query) return true;
  const q = normalize(query);
  const hay = normalize(
    [cmd.label, cmd.group, ...(cmd.keywords ?? [])].join(" ")
  );
  // Sous-chaîne simple + recherche par tokens
  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => hay.includes(token));
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [hits, setHits] = useState<Command[]>([]);

  // Recherche universelle : on interroge le serveur dès trois caractères.
  // La navigation locale reste instantanée ; les données arrivent ensuite.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await apiGet<{ results?: SearchHit[] }>(
          `/search?q=${encodeURIComponent(q)}`
        );
        if (cancelled) return;
        setHits(
          (res?.results ?? []).map((r) => ({
            label: r.label,
            subtitle: r.subtitle,
            badge: r.badge,
            group: "Résultats",
            href: DOSSIER_TYPES.includes(r.type)
              ? `/dossier/${r.type}/${r.id}`
              : undefined,
          }))
        );
      } catch {
        // Une recherche qui échoue ne doit pas bloquer la navigation.
        if (!cancelled) setHits([]);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const filtered = useMemo(
    () => [...hits, ...COMMANDS.filter((c) => matches(c, query))],
    [query, hits]
  );

  // Groupement
  const grouped = useMemo(() => {
    const map: Record<string, Command[]> = {};
    for (const c of filtered) {
      (map[c.group] ??= []).push(c);
    }
    return map;
  }, [filtered]);

  // Liste plate pour la navigation clavier
  const flat = useMemo(
    () => Object.values(grouped).flat(),
    [grouped]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (open) {
      // micro délai pour laisser la modale se monter avant de focuser
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    } else {
      setQuery("");
    }
  }, [open]);

  // ⌘K global (fermeture + ouverture)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = flat[activeIndex];
        if (!cmd) return;
        if (cmd.action) cmd.action();
        else if (cmd.href) router.push(cmd.href);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIndex, flat, onClose, router]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] animate-fade-in"
    >
      {/* Backdrop */}
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm dark:bg-black/60"
      />

      {/* Panel */}
      <div className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft-lg dark:border-neutral-800 dark:bg-neutral-900">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 dark:border-neutral-800">
          <svg
            className="h-4 w-4 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="VIN, conteneur, navire, facture, tiers…"
            className="h-12 flex-1 bg-transparent text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
            aria-label="Rechercher"
          />
          <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-400 sm:inline-flex dark:border-neutral-700 dark:bg-neutral-800">
            Esc
          </kbd>
        </div>

        {/* Résultats */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {flat.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Aucun résultat pour « {query} ».
            </p>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {group}
              </p>
              <ul>
                {items.map((cmd) => {
                  const idx = flat.indexOf(cmd);
                  const isActive = idx === activeIndex;
                  return (
                    <li key={`${cmd.group}-${cmd.label}-${cmd.href ?? ""}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => {
                          if (cmd.action) cmd.action();
                          else if (cmd.href) router.push(cmd.href);
                          onClose();
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-200"
                            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {cmd.badge && (
                          <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-600 dark:bg-neutral-800 dark:text-brand-300">
                            {cmd.badge}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{cmd.label}</span>
                          {cmd.subtitle && (
                            <span className="block truncate font-mono text-[11px] text-neutral-500">
                              {cmd.subtitle}
                            </span>
                          )}
                        </span>
                        {isActive && (
                          <kbd className="hidden shrink-0 items-center rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-500 sm:inline-flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                            ↵
                          </kbd>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-4 py-2 text-[11px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-neutral-200 bg-white px-1 py-0.5 font-mono text-[10px] dark:border-neutral-700 dark:bg-neutral-900">
              ↑
            </kbd>
            <kbd className="rounded border border-neutral-200 bg-white px-1 py-0.5 font-mono text-[10px] dark:border-neutral-700 dark:bg-neutral-900">
              ↓
            </kbd>
            Naviguer
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-neutral-200 bg-white px-1 py-0.5 font-mono text-[10px] dark:border-neutral-700 dark:bg-neutral-900">
              ↵
            </kbd>
            Ouvrir
          </span>
        </div>
      </div>
    </div>
  );
}
