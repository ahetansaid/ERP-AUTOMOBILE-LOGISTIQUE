"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconLogout } from "@/components/icons/NavIcons";
import { clearAuth, getUser } from "@/lib/auth";

export function Header() {
  const router = useRouter();
  const user = getUser() as { email?: string; firstName?: string } | null;

  function handleLogout() {
    clearAuth();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-sm">
      <div className="h-4 w-px bg-transparent" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">
          {user?.firstName ? (
            <>Bonjour, <span className="font-medium text-slate-700">{user.firstName}</span></>
          ) : (
            <span className="font-medium text-slate-600">{user?.email}</span>
          )}
        </span>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="gap-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <IconLogout />
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
