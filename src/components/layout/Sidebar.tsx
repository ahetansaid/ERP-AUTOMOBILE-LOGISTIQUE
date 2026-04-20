"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

const nav = [
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
  { href: "/transit", label: "Transit", group: "Transit" },
  { href: "/transit/suivi", label: "Suivi transit", group: "Transit" },
  { href: "/crm", label: "CRM Clients", group: "CRM" },
  { href: "/utilisateurs", label: "Utilisateurs", group: "Admin" },
  { href: "/parametres", label: "Paramètres", group: "Paramètres" },
  { href: "/notifications", label: "Notifications", group: "Paramètres" },
];

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.586 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}
function IconBox({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function IconTruck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-1.607-1.342-2.912-2.9-2.912H8.25" />
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function IconCog({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function getIcon(href: string, group: string) {
  if (href === "/") return <IconHome className="h-5 w-5 shrink-0" />;
  if (group === "Supply Chain") return <IconBox className="h-5 w-5 shrink-0" />;
  if (group === "Comptabilité") return <IconDocument className="h-5 w-5 shrink-0" />;
  if (group === "Transit") return <IconTruck className="h-5 w-5 shrink-0" />;
  if (group === "CRM" || href === "/utilisateurs") return <IconUsers className="h-5 w-5 shrink-0" />;
  if (href === "/notifications") return <IconBell className="h-5 w-5 shrink-0" />;
  if (group === "Paramètres" || group === "Admin") return <IconCog className="h-5 w-5 shrink-0" />;
  return <IconDocument className="h-5 w-5 shrink-0" />;
}

export function Sidebar() {
  const pathname = usePathname();

  const groups = nav.reduce<Record<string, { href: string; label: string; group: string }[]>>(
    (acc, item) => {
      const g = item.group ?? "Menu";
      if (!acc[g]) acc[g] = [];
      acc[g].push({ href: item.href, label: item.label, group: item.group ?? "" });
      return acc;
    },
    {}
  );

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-slate-200/80 bg-white dark:border-slate-700/80 dark:bg-slate-900">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5 dark:border-slate-700/80">
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-sm font-bold text-white shadow-sm">
            P
          </span>
          <span className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {APP_NAME}
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {Object.entries(groups).map(([group, links]) => (
          <div key={group} className="mb-6 last:mb-0">
            <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      }`}
                    >
                      <span
                        className={
                          isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"
                        }
                      >
                        {getIcon(href, g)}
                      </span>
                      <span className="min-w-0 truncate">{label}</span>
                      {isActive && (
                        <span
                          className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary-500 dark:bg-primary-400"
                          aria-hidden
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 px-4 py-3 dark:border-slate-700/80">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          ParcAuto Manager
        </p>
      </div>
    </aside>
  );
}
