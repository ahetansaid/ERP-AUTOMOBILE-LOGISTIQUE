"use client";

import {
  type DocumentData,
  KIND_LABEL,
  computeTotals,
  formatAmount,
  formatDate,
} from "./types";

/**
 * Template "Classique Pro"
 * — Sobre, corporate, proche d'une facture comptable traditionnelle.
 * — Adapté aux clients B2B habitués aux factures imprimées / archivage comptable.
 */
export function DocumentClassic({ data }: { data: DocumentData }) {
  const { lines, subtotal, vat, total } = computeTotals(data);
  const kindLabel = KIND_LABEL[data.kind].toUpperCase();

  return (
    <article className="mx-auto w-[210mm] min-h-[297mm] bg-white p-12 font-sans text-[12px] leading-relaxed text-neutral-900 shadow-sm print:shadow-none">
      {/* Header */}
      <header className="flex items-start justify-between border-b-2 border-neutral-900 pb-5">
        <div className="flex items-center gap-4">
          {data.brand?.logoUrl ? (
            <img
              src={data.brand.logoUrl}
              alt={data.brand?.name ?? ""}
              className="h-14 w-14 rounded object-contain"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded bg-neutral-900 text-xl font-bold text-white">
              {data.brand?.name?.[0] ?? data.from.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {data.brand?.name ?? data.from.name}
            </h1>
            <p className="mt-0.5 text-[11px] text-neutral-600">
              {[data.from.address, data.from.city, data.from.country]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight">
            {kindLabel} N° {data.number}
          </p>
          <p className="mt-1 text-[11px] text-neutral-600">
            Émise le {formatDate(data.issuedAt)}
          </p>
          {data.dueDate && (
            <p className="mt-0.5 text-[11px] text-neutral-600">
              Échéance : {formatDate(data.dueDate)}
            </p>
          )}
          {data.validUntil && (
            <p className="mt-0.5 text-[11px] text-neutral-600">
              Valide jusqu'au : {formatDate(data.validUntil)}
            </p>
          )}
        </div>
      </header>

      {/* From / To */}
      <section className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Émetteur
          </p>
          <p className="mt-1.5 font-semibold">{data.from.name}</p>
          {data.from.address && <p>{data.from.address}</p>}
          {(data.from.city || data.from.country) && (
            <p>{[data.from.city, data.from.country].filter(Boolean).join(", ")}</p>
          )}
          {data.from.phone && <p>Tél. {data.from.phone}</p>}
          {data.from.email && <p>{data.from.email}</p>}
          {data.from.legalNumber && (
            <p className="mt-0.5 text-neutral-600">IFU {data.from.legalNumber}</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Destinataire
          </p>
          <p className="mt-1.5 font-semibold">{data.to.name}</p>
          {data.to.address && <p>{data.to.address}</p>}
          {(data.to.city || data.to.country) && (
            <p>{[data.to.city, data.to.country].filter(Boolean).join(", ")}</p>
          )}
          {data.to.phone && <p>Tél. {data.to.phone}</p>}
          {data.to.email && <p>{data.to.email}</p>}
        </div>
      </section>

      {/* Lines */}
      <section className="mt-8">
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="border-b-2 border-neutral-900 text-left">
              <th className="py-2.5 font-semibold">Désignation</th>
              <th className="py-2.5 text-right font-semibold">Qté</th>
              <th className="py-2.5 text-right font-semibold">PU HT</th>
              <th className="py-2.5 text-right font-semibold">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-b border-neutral-200">
                <td className="py-3 pr-4">
                  <p className="font-medium">{line.label}</p>
                  {line.sublabel && (
                    <p className="mt-0.5 font-mono text-[10.5px] text-neutral-500">
                      {line.sublabel}
                    </p>
                  )}
                </td>
                <td className="py-3 text-right tabular-nums">{line.quantity}</td>
                <td className="py-3 text-right tabular-nums">
                  {formatAmount(line.unitPrice, data.currency)}
                </td>
                <td className="py-3 text-right tabular-nums font-medium">
                  {formatAmount(line.total ?? 0, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <section className="mt-6 flex justify-end">
        <div className="w-[280px] text-[12px]">
          <div className="flex justify-between border-b border-neutral-200 py-1.5">
            <span className="text-neutral-600">Total HT</span>
            <span className="font-medium tabular-nums">
              {formatAmount(subtotal, data.currency)}
            </span>
          </div>
          {(data.vatRate ?? 0) > 0 && (
            <div className="flex justify-between border-b border-neutral-200 py-1.5">
              <span className="text-neutral-600">TVA {data.vatRate}%</span>
              <span className="font-medium tabular-nums">
                {formatAmount(vat, data.currency)}
              </span>
            </div>
          )}
          <div className="mt-1 flex items-baseline justify-between border-t-2 border-neutral-900 py-2">
            <span className="font-bold">TOTAL TTC</span>
            <span className="text-[15px] font-bold tabular-nums">
              {formatAmount(total, data.currency)}
            </span>
          </div>
        </div>
      </section>

      {/* Notes & signature */}
      <section className="mt-12 border-t border-neutral-200 pt-6 text-[10.5px] text-neutral-600">
        {data.notes && <p className="mb-4">{data.notes}</p>}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <p className="font-semibold text-neutral-900">Mentions légales</p>
            <p className="mt-1">
              {data.from.legalNumber ? `IFU : ${data.from.legalNumber}` : ""}
              {" · Conformément à la réglementation en vigueur."}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-neutral-900">Cachet & signature</p>
            <div className="mt-2 h-16 w-44 rounded border border-dashed border-neutral-300" />
          </div>
        </div>
      </section>
    </article>
  );
}
