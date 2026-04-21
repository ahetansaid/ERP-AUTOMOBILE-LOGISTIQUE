"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

// Traduit un segment d'URL en libellé humain.
const SEGMENT_LABELS: Record<string, string> = {
  "supply-chain": "Supply Chain",
  achats: "Achats",
  atelier: "Atelier",
  "vue-globale": "Vue globale",
  "stock-disponible": "Stock disponible",
  "stock-regulier": "Stock régulier",
  "stock-non-regulier": "Stock non régulier",
  comptabilite: "Comptabilité",
  charges: "Charges",
  devis: "Devis",
  factures: "Factures",
  recus: "Reçus",
  tresorerie: "Trésorerie",
  proforma: "Pro forma",
  rapports: "Rapports",
  transit: "Transit",
  suivi: "Suivi",
  crm: "CRM",
  utilisateurs: "Utilisateurs",
  parametres: "Paramètres",
  notifications: "Notifications",
  nouveau: "Nouveau",
  modifier: "Modifier",
};

function toBreadcrumbs(pathname: string) {
  if (pathname === "/") return [{ label: "Accueil", href: "/" }];
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [{ label: "Accueil", href: "/" }];
  let acc = "";
  for (const part of parts) {
    acc += `/${part}`;
    const label =
      SEGMENT_LABELS[part] ??
      (/^\d+$/.test(part) ? `#${part}` : decodeURIComponent(part));
    crumbs.push({ label, href: acc });
  }
  return crumbs;
}

export function Header({ onOpenCommand }: { onOpenCommand?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const crumbs = toBreadcrumbs(pathname);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Utilisateur";

  return (
    <header className="sticky top-0 z-20 flex h-14 min-w-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80 sm:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Fil d'Ariane"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400"
      >
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={c.href} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && (
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              )}
              {isLast ? (
                <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="min-w-0 truncate transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  {c.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* ⌘K trigger compact (surtout mobile, où la sidebar est cachée) */}
        {onOpenCommand && (
          <button
            type="button"
            onClick={onOpenCommand}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 md:hidden dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Rechercher"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </button>
        )}

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label="Notifications"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          <span
            aria-hidden
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-neutral-950"
          />
        </Link>

        <ThemeToggle />

        {/* Séparateur */}
        <span className="mx-1 hidden h-5 w-px bg-neutral-200 dark:bg-neutral-800 sm:inline-block" />

        {/* User compact (mobile) / bouton déconnexion (desktop) */}
        <span
          className="hidden max-w-[160px] truncate text-sm font-medium text-neutral-700 dark:text-neutral-300 md:inline-block"
          title={user?.email ?? ""}
        >
          {displayName}
        </span>

        <Button variant="ghost" size="sm" onClick={logout}>
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
