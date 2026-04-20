"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/Card";

interface NotifRow {
  id: number;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  created_at?: string;
}

export default function NotificationsPage() {
  const [list, setList] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      const res = await apiGet<{ notifications?: unknown[] }>("/notifications");
      const raw = (res as { notifications?: unknown[] })?.notifications ?? [];
      setList((raw as Record<string, unknown>[]).map((r) => ({
        id: (r.id as number) ?? 0,
        type: r.type as string,
        title: r.title as string,
        message: r.message as string,
        read: (r.read as boolean) ?? false,
        created_at: r.created_at as string,
      })));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-slate-600">Alertes et notifications système.</p>
      </div>
      <Card title="Liste">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Chargement…</p>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Aucune notification.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((n) => (
              <li key={n.id} className={`rounded border px-3 py-2 ${n.read ? "border-slate-100 bg-slate-50" : "border-amber-200 bg-amber-50"}`}>
                <span className="font-medium">{n.title ?? n.type ?? "—"}</span>
                <p className="text-sm text-slate-600">{n.message ?? ""}</p>
                <span className="text-xs text-slate-400">{n.created_at ? new Date(n.created_at).toLocaleString("fr-FR") : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
