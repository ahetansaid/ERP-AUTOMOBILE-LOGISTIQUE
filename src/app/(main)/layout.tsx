"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { isAuthenticated } from "@/lib/auth";

const LoadingPlaceholder = () => (
  <div className="flex min-h-screen items-center justify-center">
    <p className="text-slate-500">Chargement...</p>
  </div>
);

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) router.replace("/login");
  }, [mounted, router]);

  if (!mounted) {
    return <LoadingPlaceholder />;
  }

  if (!isAuthenticated()) {
    return <LoadingPlaceholder />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-72">
        <Header />
        <main className="p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
