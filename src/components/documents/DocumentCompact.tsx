"use client";

import {
  type DocumentData,
  computeTotals,
  formatAmount,
  formatDate,
} from "./types";

/**
 * Template "Reçu compact" (A5 / thermique 80mm)
 * — Format caisse / livraison. Impression thermique supportée.
 * — Principalement pour les reçus de paiement.
 */
export function DocumentCompact({ data }: { data: DocumentData }) {
  const { lines, total } = computeTotals(data);

  return (
    <article
      className="mx-auto w-[80mm] bg-white px-5 py-6 font-mono text-[11px] leading-snug text-neutral-900 shadow-sm print:shadow-none"
      style={{ minHeight: "150mm" }}
    >
      {/* Header */}
      <header className="text-center">
        <p className="text-[13px] font-bold tracking-wider uppercase">
          {data.brand?.name ?? data.from.name}
        </p>
        <p className="text-[10px] text-neutral-600">
          {[data.from.city, data.from.country].filter(Boolean).join(" · ")}
        </p>
        {data.from.phone && (
          <p className="text-[10px] text-neutral-600">{data.from.phone}</p>
        )}
      </header>

      <Divider />

      {/* Info reçu */}
      <div className="space-y-0.5">
        <p className="flex justify-between">
          <span className="font-semibold">
            {data.kind === "RECU" ? "REÇU" : "DOC"} N°
          </span>
          <span>{data.number}</span>
        </p>
        <p className="flex justify-between text-neutral-600">
          <span>Date</span>
          <span>{formatDate(data.issuedAt)}</span>
        </p>
        {data.invoiceRef && (
          <p className="flex justify-between text-neutral-600">
            <span>Facture</span>
            <span>{data.invoiceRef}</span>
          </p>
        )}
      </div>

      <Divider />

      {/* Destinataire */}
      <div>
        <p className="text-[9.5px] uppercase tracking-wider text-neutral-500">
          Reçu de
        </p>
        <p className="font-semibold">{data.to.name}</p>
        {data.paymentMethod && (
          <p className="text-[10px] text-neutral-600">
            Mode : {data.paymentMethod}
          </p>
        )}
        {data.paymentReference && (
          <p className="text-[10px] text-neutral-600">
            Réf : {data.paymentReference}
          </p>
        )}
      </div>

      <Divider />

      {/* Lignes (cachées pour un reçu simple, affichées pour les reçus multi-ligne) */}
      {lines.length > 0 && data.kind !== "RECU" && (
        <>
          <div className="space-y-1.5">
            {lines.map((line, i) => (
              <div key={i}>
                <p className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate">{line.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatAmount(line.total ?? 0, data.currency)}
                  </span>
                </p>
                {line.sublabel && (
                  <p className="truncate text-[9.5px] text-neutral-500">
                    {line.sublabel}
                  </p>
                )}
              </div>
            ))}
          </div>
          <Divider />
        </>
      )}

      {/* Montant */}
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500">
          Montant
        </p>
        <p className="mt-1 text-[18px] font-bold tabular-nums">
          {formatAmount(total, data.currency)}
        </p>
      </div>

      {data.invoiceRef && data.remainingBalance !== undefined && (
        <>
          <Divider />
          <div className="space-y-0.5">
            <p className="flex justify-between text-neutral-600">
              <span>Sur facture</span>
              <span>{data.invoiceRef}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Solde restant</span>
              <span className="font-semibold tabular-nums">
                {formatAmount(data.remainingBalance, data.currency)}
              </span>
            </p>
          </div>
        </>
      )}

      <Divider />

      <footer className="pt-1 text-center text-[10px] text-neutral-600">
        <p>Merci de votre confiance.</p>
        <p className="mt-0.5 text-[9px] text-neutral-400">
          {data.from.legalNumber ? `IFU ${data.from.legalNumber}` : ""}
        </p>
      </footer>
    </article>
  );
}

function Divider() {
  return <div className="my-3 border-t border-dashed border-neutral-300" />;
}
