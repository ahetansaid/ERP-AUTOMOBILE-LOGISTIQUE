"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiDelete } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { FileUploader } from "./FileUploader";

type Upload = {
  id: number;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: string;
};

export function VehiclePhotos({ vehicleId }: { vehicleId: number | string }) {
  const [items, setItems] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  const base =
    (typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_URL
      : undefined) ?? "http://localhost:3001";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ uploads: Upload[] }>(
        `/uploads?resource=vehicles&resourceId=${vehicleId}&kind=VEHICLE_PHOTO`
      );
      setItems(res?.uploads ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette photo ?")) return;
    try {
      await apiDelete(`/uploads/${id}`);
      setItems((list) => list.filter((u) => u.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur suppression");
    }
  };

  const rawUrl = (id: number) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("parcauto_access_token")
        : null;
    return `${base}/uploads/${id}/raw${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  };

  return (
    <Card
      title="Photos du véhicule"
      description={items.length ? `${items.length} photo(s)` : "Aucune photo"}
      action={
        <FileUploader
          kind="VEHICLE_PHOTO"
          resource="vehicles"
          resourceId={vehicleId}
          accept="image/*"
          multiple
          label="Ajouter"
          onUploaded={load}
        />
      }
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-neutral-500">Chargement…</p>
      ) : items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-neutral-500">
            Aucune photo. Ajoutez la carte grise, le VIN, ou une photo extérieure du véhicule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((u) => (
            <figure
              key={u.id}
              className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <a
                href={rawUrl(u.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square"
              >
                <img
                  src={rawUrl(u.id)}
                  alt={u.fileName}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
              <button
                type="button"
                onClick={() => handleDelete(u.id)}
                aria-label="Supprimer"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-danger-600 group-hover:opacity-100"
              >
                ×
              </button>
              <figcaption className="truncate bg-white/90 px-2 py-1 text-[11px] text-neutral-600 dark:bg-neutral-900/90 dark:text-neutral-400">
                {u.fileName}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Card>
  );
}
