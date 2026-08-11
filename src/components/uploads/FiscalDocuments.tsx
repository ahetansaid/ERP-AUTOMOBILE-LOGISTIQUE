"use client";

/**
 * Rattachement des pièces fiscales à une entité.
 *
 * La plateforme n'émet pas de document certifié : la pièce établie ailleurs
 * (facture normalisée, quittance douanière) est déposée ici et rattachée à la
 * facture, au véhicule ou au conteneur concerné.
 *
 * Le numéro du document est obligatoire — le backend refuse la pièce sans lui.
 * Sans numéro, un fichier archivé n'est plus rapprochable de quoi que ce soit.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiDelete } from "@/lib/api";
import { asRecords, pickNumber, pickString } from "@/lib/records";
import { FileUploader, type UploadKind } from "./FileUploader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Piece {
  id: number;
  fileName: string;
  mimeType: string;
  kind: string;
  docNumber?: string;
  docDate?: string;
  docAmount?: number;
  createdAt?: string;
}

const KIND_LABELS: Partial<Record<UploadKind, string>> = {
  FACTURE_NORMALISEE: "Facture normalisée",
  RECU_NORMALISE: "Reçu normalisé",
  DOCUMENT_DOUANE: "Quittance douanière",
};

function formatFcfa(value?: number) {
  return value == null ? "—" : `${value.toLocaleString("fr-FR")} FCFA`;
}

export function FiscalDocuments({
  resource,
  resourceId,
  kind = "FACTURE_NORMALISEE",
  title,
}: {
  /** Type d'entité : "invoices", "receipts", "vehicles", "purchases"… */
  resource: string;
  resourceId: number;
  kind?: UploadKind;
  title?: string;
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docAmount, setDocAmount] = useState("");

  const label = title ?? KIND_LABELS[kind] ?? "Pièce justificative";

  const fetchPieces = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<{ uploads?: unknown[] }>(
        `/uploads?resource=${encodeURIComponent(resource)}&resourceId=${resourceId}&kind=${kind}`
      );
      setPieces(
        asRecords(res?.uploads).map((u) => ({
          id: pickNumber(u, "id") ?? 0,
          fileName: pickString(u, "fileName", "file_name") ?? "document",
          mimeType: pickString(u, "mimeType", "mime_type") ?? "",
          kind: pickString(u, "kind") ?? kind,
          docNumber: pickString(u, "docNumber", "doc_number"),
          docDate: pickString(u, "docDate", "doc_date"),
          docAmount: pickNumber(u, "docAmount", "doc_amount"),
          createdAt: pickString(u, "createdAt", "created_at"),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [resource, resourceId, kind]);

  useEffect(() => {
    fetchPieces();
  }, [fetchPieces]);

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/uploads/${id}`);
      setPieces((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    }
  };

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("parcauto_access_token")
      : null;

  return (
    <Card title={label}>
      {loading ? (
        <p className="py-4 text-sm text-neutral-500">Chargement…</p>
      ) : pieces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-warning-300 bg-warning-50/60 px-4 py-3 dark:border-warning-700 dark:bg-warning-900/20">
          <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
            Aucune pièce rattachée
          </p>
          <p className="mt-0.5 text-xs text-warning-700 dark:text-warning-300">
            Le document commercial existe, mais la pièce fiscale correspondante
            n&apos;a pas été déposée.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {pieces.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-xs font-semibold text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                {p.mimeType.includes("pdf") ? "PDF" : "IMG"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {p.docNumber || p.fileName}
                </span>
                <span className="block truncate font-mono text-xs text-neutral-500">
                  {[
                    p.docDate
                      ? new Date(p.docDate).toLocaleDateString("fr-FR")
                      : null,
                    p.docAmount != null ? formatFcfa(p.docAmount) : null,
                    p.fileName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <a
                href={`${base}/uploads/${p.id}/raw${token ? `?token=${encodeURIComponent(token)}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                Ouvrir
              </a>
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                className="text-sm text-neutral-400 transition-colors hover:text-danger-600"
                aria-label="Supprimer la pièce"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-3 dark:border-neutral-800">
        <Input
          label="N° du document"
          placeholder="Obligatoire"
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value)}
        />
        <Input
          label="Date"
          type="date"
          value={docDate}
          onChange={(e) => setDocDate(e.target.value)}
        />
        <Input
          label="Montant (FCFA)"
          type="number"
          min={0}
          value={docAmount}
          onChange={(e) => setDocAmount(e.target.value)}
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        {docNumber.trim() ? (
          <FileUploader
            kind={kind}
            resource={resource}
            resourceId={resourceId}
            accept="application/pdf,image/*"
            label={`Déposer la ${label.toLowerCase()}`}
            docMeta={{ docNumber, docDate, docAmount }}
            onUploaded={() => {
              setDocNumber("");
              setDocDate("");
              setDocAmount("");
              fetchPieces();
            }}
          />
        ) : (
          <Button variant="outline" size="sm" disabled>
            Saisissez d&apos;abord le n° du document
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
