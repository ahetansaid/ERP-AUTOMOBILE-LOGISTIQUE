"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      setAllowed(false);
    } else {
      setAllowed(true);
    }
  }, [router, pathname]);

  // Raccourci global ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openCommand = useCallback(() => setCommandOpen(true), []);
  const closeCommand = useCallback(() => setCommandOpen(false), []);

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh">
        <p className="font-medium text-brand-700 dark:text-brand-400">
          Chargement…
        </p>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onOpenCommand={openCommand} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenCommand={openCommand} />
        <main className="flex-1 overflow-y-auto bg-mesh p-6">{children}</main>
      </div>
      <CommandPalette open={commandOpen} onClose={closeCommand} />
    </div>
  );
}
