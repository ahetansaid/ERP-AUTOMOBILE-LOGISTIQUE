"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/parc-auto", label: "Parc automobile", icon: "🚗" },
  { href: "/transit", label: "Transit & Douane", icon: "🚢" },
  { href: "/comptabilite", label: "Comptabilité", icon: "💰" },
  { href: "/crm", label: "CRM Clients", icon: "👥" },
  { href: "/reporting", label: "Reporting", icon: "📈" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-slate-50">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link href="/dashboard" className="text-xl font-bold text-slate-800">
          ERP Auto
        </Link>
      </div>
      <nav className="space-y-0.5 p-4">
        {links.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-slate-200 text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
