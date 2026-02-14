"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconParc,
  IconTransit,
  IconCompta,
  IconCrm,
  IconReporting,
  IconDocument,
} from "@/components/icons/NavIcons";

const mainLinks = [
  { href: "/transit", label: "Transit & Douane", icon: IconTransit },
  { href: "/comptabilite", label: "Comptabilité", icon: IconCompta },
  { href: "/crm", label: "CRM Clients", icon: IconCrm },
  { href: "/documents", label: "Documents", icon: IconDocument },
  { href: "/reporting", label: "Reporting", icon: IconReporting },
];

// Supply chain / Stock : Gestion des achats, Gestion des véhicules, Atelier
const supplyChainSubLinks = [
  { href: "/supply-chain/achats", label: "Gestion des achats" },
  { href: "/parc-auto", label: "Vue globale véhicules" },
  { href: "/parc-auto/stock-disponible", label: "Stock disponible" },
  { href: "/parc-auto/stock-non-regularise", label: "Stock non régularisé" },
  { href: "/parc-auto/stock-regularise", label: "Véhicules régularisés" },
  { href: "/supply-chain/atelier", label: "Atelier" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-surface-dark">
      <div className="flex h-20 items-center gap-3 border-b border-white/5 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400">
          <IconParc />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white">
            ERP Auto
          </span>
          <span className="block text-xs font-medium text-slate-400">
            Logistique & Transit
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            pathname === "/dashboard"
              ? "bg-accent-500/15 text-accent-300 shadow-sm"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
        >
          <span className={pathname === "/dashboard" ? "text-accent-400" : "text-slate-500"}>
            <IconDashboard />
          </span>
          Parc Automobile
        </Link>
        <Link
          href="/supply-chain/achats"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            pathname.startsWith("/supply-chain") || pathname.startsWith("/parc-auto")
              ? "bg-accent-500/15 text-accent-300 shadow-sm"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
        >
          <span className={pathname.startsWith("/supply-chain") || pathname.startsWith("/parc-auto") ? "text-accent-400" : "text-slate-500"}>
            <IconParc />
          </span>
          Supply chain
        </Link>
        {(pathname.startsWith("/supply-chain") || pathname.startsWith("/parc-auto")) && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
            {supplyChainSubLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/parc-auto" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    isActive ? "text-accent-300" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
        {mainLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-accent-500/15 text-accent-300 shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className={isActive ? "text-accent-400" : "text-slate-500"}>
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/5 px-4 py-3">
        <p className="text-xs text-slate-500">
          ERP Automobile & Logistique
        </p>
        <p className="text-xs text-slate-600">Afrique • Bénin</p>
      </div>
    </aside>
  );
}
