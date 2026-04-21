"use client";

import {
  type DocumentData,
  KIND_LABEL,
  computeTotals,
  formatAmount,
  formatDate,
} from "./types";

/**
 * Template "Moderne Minimal"
 * — Inspiration Notion / Stripe. Beaucoup d'espace blanc, accent coloré sur total.
 * — Le + moderne et valorisant pour une marque premium.
 */
export function DocumentMinimal({ data }: { data: DocumentData }) {
  const { lines, subtotal, vat, total } = computeTotals(data);
  const accent = data.brand?.color ?? "#6366F1";
  const kindLabel = KIND_LABEL[data.kind];

  return (
    <article
      className="mx-auto w-[210mm] min-h-[297mm] bg-white p-14 font-sans text-[13px] leading-relaxed text-neutral-900 shadow-sm print:shadow-none"
      style={{ ["--accent" as string]: accent }}
    >
      {/* Title */}
      <header className="flex items-start justify-between">
        <div>
          <h1
            className="text-[40px] font-semibold leading-none tracking-tight"
            style={{ color: "var(--accent)" }}
          >
            {kindLabel}
          </h1>
          <p className="mt-3 font-mono text-[12px] text-neutral-500">
            {data.number} · {formatDate(data.issuedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.brand?.logoUrl ? (
            <img
              src={data.brand.logoUrl}
              alt={data.brand?.name ?? ""}
              className="h-12 w-12 rounded-lg object-contain"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              {data.brand?.name?.[0] ?? data.from.name[0]}
            </div>
          )}
          <div className="text-right">
            <p className="font-semibold">{data.brand?.name ?? data.from.name}</p>
            <p className="text-[11px] text-neutral-500">
              {[data.from.city, data.from.country].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </header>

      <hr className="mt-10 border-neutral-100" />

      {/* From / To */}
      <section className="mt-8 grid grid-cols-2 gap-10">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            À
          </p>
          <p className="mt-2 text-[15px] font-semibold">{data.to.name}</p>
          {data.to.address && (
            <p className="mt-0.5 text-neutral-600">{data.to.address}</p>
          )}
          {(data.to.city || data.to.country) && (
            <p className="text-neutral-600">
              {[data.to.city, data.to.country].filter(Boolean).join(", ")}
            </p>
          )}
          {data.to.phone && (
            <p className="mt-1 text-neutral-500">{data.to.phone}</p>
          )}
          {data.to.email && <p className="text-neutral-500">{data.to.email}</p>}
        </div>
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            De
          </p>
          <p className="mt-2 text-[15px] font-semibold">{data.from.name}</p>
          {data.from.address && (
            <p className="mt-0.5 text-neutral-600">{data.from.address}</p>
          )}
          {(data.from.city || data.from.country) && (
            <p className="text-neutral-600">
              {[data.from.city, data.from.country].filter(Boolean).join(", ")}
            </p>
          )}
          {data.from.phone && (
            <p className="mt-1 text-neutral-500">{data.from.phone}</p>
          )}
          {data.from.legalNumber && (
            <p className="text-neutral-500">IFU {data.from.legalNumber}</p>
          )}
        </div>
      </section>

      <hr className="mt-10 border-neutral-100" />

      {/* Lines */}
      <section className="mt-8">
        <ul>
          {lines.map((line, i) => (
            <li
              key={i}
              className="flex items-start justify-between border-b border-neutral-100 py-4"
            >
              <div className="min-w-0">
                <p className="text-[14.5px] font-medium">{line.label}</p>
                {line.sublabel && (
                  <p className="mt-0.5 font-mono text-[11.5px] text-neutral-400">
                    {line.sublabel}
                  </p>
                )}
                <p className="mt-1 text-[11.5px] text-neutral-500">
                  {line.quantity} × {formatAmount(line.unitPrice, data.currency)}
                </p>
              </div>
              <p className="shrink-0 pl-6 text-[15px] font-semibold tabular-nums">
                {formatAmount(line.total ?? 0, data.currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Totals */}
      <section className="mt-8 flex justify-end">
        <div className="w-[320px]">
          <div className="flex justify-between py-1 text-neutral-600">
            <span>Sous-total</span>
            <span className="tabular-nums">
              {formatAmount(subtotal, data.currency)}
            </span>
          </div>
          {(data.vatRate ?? 0) > 0 && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>TVA {data.vatRate}%</span>
              <span className="tabular-nums">
                {formatAmount(vat, data.currency)}
              </span>
            </div>
          )}
          <div
            className="mt-3 flex items-baseline justify-between rounded-xl px-5 py-4 text-white"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-[13px] font-semibold uppercase tracking-wider">
              Total
            </span>
            <span className="text-[22px] font-bold tabular-nums">
              {formatAmount(total, data.currency)}
            </span>
          </div>
        </div>
      </section>

      {/* Payment / note */}
      <section className="mt-10 grid grid-cols-3 items-end gap-6 text-[11.5px] text-neutral-600">
        <div className="col-span-2">
          {data.kind === "FACTURE" && data.dueDate && (
            <p className="text-[13px] text-neutral-900">
              À régler avant le{" "}
              <span className="font-semibold">{formatDate(data.dueDate)}</span>.
            </p>
          )}
          {data.kind === "DEVIS" && data.validUntil && (
            <p className="text-[13px] text-neutral-900">
              Devis valable jusqu'au{" "}
              <span className="font-semibold">{formatDate(data.validUntil)}</span>
              .
            </p>
          )}
          {data.notes && (
            <p className="mt-2 whitespace-pre-line text-neutral-500">
              {data.notes}
            </p>
          )}
        </div>
        {data.payUrl && (
          <a
            href={data.payUrl}
            className="group inline-flex items-center justify-center rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Payer en ligne →
          </a>
        )}
      </section>
    </article>
  );
}
