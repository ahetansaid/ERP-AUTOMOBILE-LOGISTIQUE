"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/parc-auto", label: "Vue globale" },
  { href: "/parc-auto/stock-disponible", label: "Stock disponible (régularisé)" },
  { href: "/parc-auto/stock-non-regularise", label: "Stock non régularisé" },
] as const;

export default function ParcAutoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-1 shadow-card">
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                pathname === t.href
                  ? "bg-accent-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
