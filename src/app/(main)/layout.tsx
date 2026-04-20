"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      setAllowed(false);
    } else {
      setAllowed(true);
    }
  }, [router, pathname]);

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh">
        <p className="font-medium text-primary-700 dark:text-primary-400">Chargement…</p>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-mesh p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
