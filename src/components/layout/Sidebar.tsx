"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, roleLabel } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  group: string;
};

const nav: NavItem[] = [
  { href: "/", label: "Parc automobile", group: "Menu" },
  { href: "/supply-chain/achats", label: "Gestion des achats", group: "Supply Chain" },
  { href: "/supply-chain/vue-globale", label: "Vue globale", group: "Supply Chain" },
  { href: "/supply-chain/stock-disponible", label: "Stock disponible", group: "Supply Chain" },
  { href: "/supply-chain/stock-non-regulier", label: "Stock non régulier", group: "Supply Chain" },
  { href: "/supply-chain/stock-regulier", label: "Stock régulier", group: "Supply Chain" },
  { href: "/supply-chain/atelier", label: "Atelier", group: "Supply Chain" },
  { href: "/comptabilite/charges", label: "Charges", group: "Comptabilité" },
  { href: "/comptabilite/devis", label: "Devis", group: "Comptabilité" },
  { href: "/comptabilite/factures", label: "Factures", group: "Comptabilité" },
  { href: "/comptabilite/recus", label: "Reçus", group: "Comptabilité" },
  { href: "/comptabilite/tresorerie", label: "Trésorerie", group: "Comptabilité" },
  { href: "/comptabilite/proforma", label: "Pro forma", group: "Comptabilité" },
  { href: "/comptabilite/rapports", label: "Rapports", group: "Comptabilité" },
  { href: "/comptabilite/reconciliation", label: "Réconciliation", group: "Comptabilité" },
  { href: "/transit", label: "Transit", group: "Transit" },
  { href: "/transit/suivi", label: "Suivi transit", group: "Transit" },
  { href: "/crm", label: "CRM Clients", group: "CRM" },
  { href: "/tiers", label: "Tiers", group: "CRM" },
  { href: "/utilisateurs", label: "Utilisateurs", group: "Admin" },
  { href: "/parametres", label: "Paramètres", group: "Paramètres" },
  { href: "/alertes", label: "Alertes", group: "Paramètres" },
  { href: "/notifications", label: "Notifications", group: "Paramètres" },
];

// ————————————————— Icons (line, 1.75 stroke, cohérent Notion-like) —————————————————
type IconProps = { className?: string };

function IconHome({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.586 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}
function IconBox({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
function IconDocument({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function IconTruck({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-1.607-1.342-2.912-2.9-2.912H8.25" />
    </svg>
  );
}
function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function IconCog({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconBell({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}
function IconSearch({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function getIcon(href: string, group: string, className = "h-[18px] w-[18px] shrink-0") {
  if (href === "/") return <IconHome className={className} />;
  if (group === "Supply Chain") return <IconBox className={className} />;
  if (group === "Comptabilité") return <IconDocument className={className} />;
  if (group === "Transit") return <IconTruck className={className} />;
  if (group === "CRM" || href === "/utilisateurs") return <IconUsers className={className} />;
  if (href === "/notifications") return <IconBell className={className} />;
  if (group === "Paramètres" || group === "Admin") return <IconCog className={className} />;
  return <IconDocument className={className} />;
}

export function Sidebar({ onOpenCommand }: { onOpenCommand?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const groups = nav.reduce<Record<string, NavItem[]>>((acc, item) => {
    const g = item.group ?? "Menu";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Utilisateur";

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">
            P
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {APP_NAME}
          </span>
        </Link>
      </div>

      {/* Command palette trigger */}
      <div className="px-3">
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-left text-sm text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-700"
        >
          <IconSearch className="h-4 w-4" />
          <span className="min-w-0 flex-1 truncate">Rechercher…</span>
          <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-neutral-200 bg-neutral-50 px-1.5 font-mono text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500 md:inline-flex">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 overflow-y-auto">
        {Object.entries(groups).map(([group, links]) => (
          <div key={group} className="mb-4 last:mb-2">
            <p className="mb-1 px-6 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {group}
            </p>
            <ul className="space-y-0.5 px-3">
              {links.map(({ href, label, group: g }) => {
                const isActive =
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-150 ${
                        isActive
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-500"
                        />
                      )}
                      <span
                        className={
                          isActive
                            ? "text-brand-600 dark:text-brand-300"
                            : "text-neutral-400 dark:text-neutral-500"
                        }
                      >
                        {getIcon(href, g)}
                      </span>
                      <span className="min-w-0 truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-neutral-200 p-3 dark:border-neutral-800">
        <Link
          href="/parametres"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
              {displayName}
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
