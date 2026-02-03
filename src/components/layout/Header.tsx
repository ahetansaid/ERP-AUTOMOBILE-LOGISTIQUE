"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { clearAuth, getUser } from "@/lib/auth";

export function Header() {
  const router = useRouter();
  const user = getUser() as { email?: string } | null;

  function handleLogout() {
    clearAuth();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="text-sm text-slate-500">
        {user?.email ? `Connecté : ${user.email}` : ""}
      </div>
      <Button variant="ghost" onClick={handleLogout}>
        Déconnexion
      </Button>
    </header>
  );
}
