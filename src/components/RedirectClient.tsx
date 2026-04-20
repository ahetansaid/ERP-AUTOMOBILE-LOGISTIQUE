"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export function RedirectClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated()) router.replace("/dashboard");
    else router.replace("/login");
  }, [mounted, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-slate-500">Chargement…</p>
    </div>
  );
}
