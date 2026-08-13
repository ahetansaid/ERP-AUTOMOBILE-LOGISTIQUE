"use client";

/**
 * Barre latérale.
 *
 * Vingt-quatre entrées tenaient dans une liste toujours dépliée : il fallait
 * faire défiler pour atteindre la comptabilité, et l'œil ne se raccrochait à
 * rien. Les groupes se replient désormais, celui de la page courante s'ouvre
 * d'office, et l'état est retenu d'une visite à l'autre.
 *
 * Deux corrections de fond au passage :
 *   · le tableau de bord n'était PAS dans le menu. L'écran principal ne
 *     s'atteignait qu'en tapant son URL.
 *   · la première entrée pointait sur « / », qui n'est qu'une redirection.
 *
 * La carte de navigation vit dans navigation.tsx, partagée avec la palette de
 * commandes : deux listes qui divergent, c'est un écran qu'on perd.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, roleLabel } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { apiGet } from "@/lib/api";
import { NAVIGATION, NavIcon, estActive, groupeActif } from "./navigation";

const CLE_GROUPES = "parcauto_nav_groupes";

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
    </svg>
  );
}

function Chevron({ ouvert }: { ouvert: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-200 dark:text-neutral-600 ${
        ouvert ? "rotate-90" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function Sidebar({ onOpenCommand }: { onOpenCommand?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [ouverts, setOuverts] = useState<Record<string, boolean> | null>(null);
  const [nbAlertes, setNbAlertes] = useState<number | null>(null);

  const actif = useMemo(() => groupeActif(pathname), [pathname]);

  // État replié restauré au montage seulement : le relire à chaque rendu
  // rouvrirait les groupes que l'utilisateur vient de fermer.
  useEffect(() => {
    let repris: Record<string, boolean> = {};
    try {
      const brut = localStorage.getItem(CLE_GROUPES);
      if (brut) repris = JSON.parse(brut) as Record<string, boolean>;
    } catch {
      repris = {};
    }
    // Par défaut : le pilotage et le groupe de la page courante.
    setOuverts({
      pilotage: true,
      ...repris,
      ...(actif ? { [actif]: true } : {}),
    });
    // Volontairement au montage : `actif` change à chaque navigation, et on ne
    // veut pas rouvrir un groupe refermé à la main.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le groupe de la page courante s'ouvre quand on y navigue autrement que par
  // la barre — par la recherche, un lien profond, un retour arrière.
  useEffect(() => {
    if (!actif) return;
    setOuverts((prec) => (prec && !prec[actif] ? { ...prec, [actif]: true } : prec));
  }, [actif]);

  const basculer = useCallback((id: string) => {
    setOuverts((prec) => {
      const suivant = { ...(prec ?? {}), [id]: !(prec ?? {})[id] };
      try {
        localStorage.setItem(CLE_GROUPES, JSON.stringify(suivant));
      } catch {
        /* mode privé : on se passe de la persistance */
      }
      return suivant;
    });
  }, []);

  // Compteur d'anomalies. Silencieux en cas d'échec : une pastille absente vaut
  // mieux qu'une barre de navigation en erreur.
  useEffect(() => {
    let annule = false;
    const charger = async () => {
      try {
        const r = await apiGet<{ resume?: Record<string, number> }>("/alertes");
        const total = Object.values(r?.resume ?? {}).reduce((s, n) => s + Number(n || 0), 0);
        if (!annule) setNbAlertes(total);
      } catch {
        if (!annule) setNbAlertes(null);
      }
    };
    charger();
    const onFocus = () => charger();
    window.addEventListener("focus", onFocus);
    return () => {
      annule = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const initiales =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  const nomAffiche =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Utilisateur";

  const visible = (roles?: string[]) => !roles || (user?.role ? roles.includes(user.role) : false);

  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/80 backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-950">
      {/* Marque */}
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm shadow-brand-600/20">
            P
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {APP_NAME}
          </span>
        </Link>
      </div>

      {/* Recherche */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 text-left text-[13px] text-neutral-500 outline-none transition-colors hover:border-neutral-300 hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-700"
        >
          <IconSearch className="h-[15px] w-[15px] shrink-0" />
          <span className="min-w-0 flex-1 truncate">Rechercher…</span>
          <kbd className="hidden shrink-0 items-center rounded border border-neutral-200 bg-neutral-50 px-1.5 font-mono text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500 md:inline-flex">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAVIGATION.map((groupe) => {
          const entrees = groupe.entries.filter((e) => visible(e.roles));
          if (!entrees.length) return null;

          const ouvert =
            ouverts?.[groupe.id] ?? (groupe.id === "pilotage" || groupe.id === actif);
          const contientActif = groupe.id === actif;

          return (
            <div key={groupe.id}>
              <button
                type="button"
                onClick={() => basculer(groupe.id)}
                aria-expanded={ouvert}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:hover:bg-neutral-900"
              >
                <Chevron ouvert={ouvert} />
                <span
                  className={`flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.09em] transition-colors ${
                    contientActif
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-neutral-400 dark:text-neutral-500"
                  }`}
                >
                  {groupe.label}
                </span>
                {/* Replié, le groupe garde un signe de ce qu'il contient. */}
                {!ouvert && contientActif && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                  />
                )}
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  ouvert ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <ul className="overflow-hidden">
                  {entrees.map((entree) => {
                    const active = estActive(pathname, entree.href);
                    const badge = entree.badge === "alertes" ? nbAlertes : null;
                    return (
                      <li key={entree.href}>
                        <Link
                          href={entree.href}
                          aria-current={active ? "page" : undefined}
                          className={`group relative flex items-center gap-2.5 rounded-lg py-[7px] pl-3 pr-2 text-[13.5px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                            active
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                          }`}
                        >
                          {active && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500"
                            />
                          )}
                          <NavIcon
                            href={entree.href}
                            className={`h-[17px] w-[17px] shrink-0 transition-colors ${
                              active
                                ? "text-brand-600 dark:text-brand-300"
                                : "text-neutral-400 group-hover:text-neutral-500 dark:text-neutral-500 dark:group-hover:text-neutral-400"
                            }`}
                          />
                          <span className="min-w-0 flex-1 truncate">{entree.label}</span>
                          {badge != null && badge > 0 && (
                            <span
                              className="shrink-0 rounded-full bg-danger-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-danger-700 dark:bg-danger-950/60 dark:text-danger-300"
                              title={`${badge} anomalie${badge > 1 ? "s" : ""} ouverte${badge > 1 ? "s" : ""}`}
                            >
                              {badge > 99 ? "99+" : badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Compte */}
      <div className="shrink-0 border-t border-neutral-200 p-3 dark:border-neutral-800">
        <Link
          href="/parametres"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:hover:bg-neutral-900"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
            {initiales}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
              {nomAffiche}
            </span>
            <span className="block truncate text-[11px] text-neutral-500 dark:text-neutral-400">
              {roleLabel(user?.role)}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
