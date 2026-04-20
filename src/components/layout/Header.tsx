"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const { user, logout } = useAuth();

  const displayName =
    user?.firstName || user?.lastName
      ? [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        (user as { first_name?: string; last_name?: string })?.first_name ||
        (user as { first_name?: string; last_name?: string })?.last_name
      : user?.email ?? "Utilisateur";

  return (
    <header className="flex h-16 min-w-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/70 px-4 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/70 sm:px-6">
      <div className="min-w-0 flex-1">
        <span className="truncate text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200">
          ParcAuto Manager
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <span
          className="hidden max-w-[120px] truncate text-sm font-medium text-slate-600 dark:text-slate-300 sm:inline-block md:max-w-[180px]"
          title={user?.email ?? ""}
        >
          {displayName}
        </span>
        <span className="hidden rounded-lg bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 sm:inline-block">
          {user?.role ?? "—"}
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
