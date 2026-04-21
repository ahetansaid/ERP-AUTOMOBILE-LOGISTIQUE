"use client";

import {
  type DocumentData,
  KIND_LABEL,
  computeTotals,
  formatAmount,
  formatDate,
} from "./types";

/**
 * Template "Gradient Brand"
 * — Inspiration Magic UI / Stripe. Bande gradient, CTA paiement en avant, footer sombre.
 * — Idéal pour les factures envoyées par email avec lien de paiement.
 */
export function DocumentGradient({ data }: { data: DocumentData }) {
  const { lines, subtotal, vat, total } = computeTotals(data);
  const accent = data.brand?.color ?? "#6366F1";
  const accent2 = shadeColor(accent, 20);
  const kindLabel = KIND_LABEL[data.kind];

  return (
    <article
      className="mx-auto flex w-[210mm] min-h-[297mm] flex-col bg-white font-sans text-[13px] leading-relaxed text-neutral-900 shadow-sm print:shadow-none"
      style={{ ["--accent" as string]: accent, ["--accent2" as string]: accent2 }}
    >
      {/* Bande gradient */}
      <div
        className="h-24 w-full"
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, ${accent2} 100%)`,
        }}
      />

      <div className="flex-1 px-14 pb-10 pt-8">
        {/* Header */}
        <header className="-mt-16 flex items-end justify-between">
          <div className="flex items-center gap-4">
            {data.brand?.logoUrl ? (
              <img
                src={data.brand.logoUrl}
                alt={data.brand?.name ?? ""}
                className="h-16 w-16 rounded-xl bg-white object-contain p-2 shadow-lg ring-1 ring-black/5"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-2xl font-bold shadow-lg ring-1 ring-black/5">
                <span style={{ color: "var(--accent)" }}>
                  {data.brand?.name?.[0] ?? data.from.name[0]}
                </span>
              </div>
            )}
            <div className="text-white">
              <p className="text-[15px] font-semibold drop-shadow-sm">
                {data.brand?.name ?? data.from.name}
              </p>
              <p className="text-[11.5px] text-white/80">
                {[data.from.city, data.from.country].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white px-5 py-3 text-right shadow-md ring-1 ring-black/5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
              {kindLabel}
            </p>
            <p className="font-mono text-[15px] font-bold text-neutral-900">
              {data.number}
            </p>
          </div>
        </header>

        {/* Facturé à + statut */}
        <section className="mt-10 grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Facturé à
            </p>
            <p className="mt-1.5 text-[16px] font-semibold">{data.to.name}</p>
            {data.to.address && <p className="text-neutral-600">{data.to.address}</p>}
            {(data.to.city || data.to.country) && (
              <p className="text-neutral-600">
                {[data.to.city, data.to.country].filter(Boolean).join(", ")}
              </p>
            )}
            {data.to.email && (
              <p className="mt-0.5 text-neutral-500">{data.to.email}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Statut
            </p>
            <p className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-700">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              {data.statusLabel ?? "En attente"}
            </p>
            <div className="mt-3 space-y-0.5 text-[11.5px] text-neutral-500">
              <p>Émise : {formatDate(data.issuedAt)}</p>
              {data.dueDate && <p>Échéance : {formatDate(data.dueDate)}</p>}
              {data.validUntil && (
                <p>Valide jusqu'au : {formatDate(data.validUntil)}</p>
              )}
            </div>
          </div>
        </section>

        {/* Détail */}
        <section className="mt-8">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Détail
          </p>
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            {lines.map((line, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-5 py-4 ${
                  i > 0 ? "border-t border-neutral-100" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{line.label}</p>
                  {line.sublabel && (
                    <p className="mt-0.5 font-mono text-[11px] text-neutral-400">
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
              </div>
            ))}
          </div>
        </section>

        {/* Totaux + CTA paiement */}
        <section className="mt-8 flex items-end justify-between gap-6">
          {data.payUrl ? (
            <div className="flex-1 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-4 text-[11.5px] text-neutral-600">
              <p className="font-medium text-neutral-900">Paiement en ligne</p>
              <p className="mt-1">
                Scannez le QR code ou cliquez sur le bouton à droite pour régler
                cette facture par carte ou mobile money.
              </p>
            </div>
          ) : (
            <div />
          )}

          <div
            className="w-[300px] rounded-2xl p-5 text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`,
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
              Total à payer
            </p>
            <p className="mt-1 text-[26px] font-bold leading-tight tabular-nums">
              {formatAmount(total, data.currency)}
            </p>
            {(data.vatRate ?? 0) > 0 && (
              <p className="mt-0.5 text-[11px] text-white/80">
                dont TVA {data.vatRate}% ({formatAmount(vat, data.currency)})
              </p>
            )}
            {data.payUrl && (
              <a
                href={data.payUrl}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90"
                style={{ color: "var(--accent)" }}
              >
                Payer en ligne →
              </a>
            )}
          </div>
        </section>

        {data.notes && (
          <section className="mt-8 border-t border-neutral-100 pt-4 text-[11.5px] text-neutral-500">
            <p className="whitespace-pre-line">{data.notes}</p>
          </section>
        )}
      </div>

      {/* Footer sombre */}
      <footer className="bg-neutral-950 px-14 py-5 text-[10.5px] text-neutral-400">
        <div className="flex items-center justify-between">
          <p>
            {data.from.name}
            {data.from.legalNumber ? ` · IFU ${data.from.legalNumber}` : ""}
          </p>
          <p>
            {[data.from.email, data.from.phone].filter(Boolean).join(" · ")}
          </p>
        </div>
      </footer>
    </article>
  );
}

function shadeColor(hex: string, percent: number) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
