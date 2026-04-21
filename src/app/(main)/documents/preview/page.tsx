"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DocumentClassic } from "@/components/documents/DocumentClassic";
import { DocumentMinimal } from "@/components/documents/DocumentMinimal";
import { DocumentGradient } from "@/components/documents/DocumentGradient";
import { DocumentCompact } from "@/components/documents/DocumentCompact";
import type { DocumentData, DocumentKind } from "@/components/documents/types";

type TemplateId = "classic" | "minimal" | "gradient" | "compact";

const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  {
    id: "minimal",
    label: "Moderne Minimal",
    description: "Notion / Stripe · espace blanc, accent coloré",
  },
  {
    id: "gradient",
    label: "Gradient Brand",
    description: "Magic UI · bande gradient, CTA paiement",
  },
  {
    id: "classic",
    label: "Classique Pro",
    description: "Sobre, corporate, comptable traditionnel",
  },
  {
    id: "compact",
    label: "Reçu compact",
    description: "A5 / thermique 80mm · caisse, livraison",
  },
];

const KINDS: { id: DocumentKind; label: string }[] = [
  { id: "FACTURE", label: "Facture" },
  { id: "DEVIS", label: "Devis" },
  { id: "PROFORMA", label: "Pro forma" },
  { id: "RECU", label: "Reçu" },
];

const COLORS = [
  { label: "Indigo", value: "#6366F1" },
  { label: "Emerald", value: "#10B981" },
  { label: "Rose", value: "#F43F5E" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Sky", value: "#0EA5E9" },
  { label: "Violet", value: "#8B5CF6" },
];

function buildMockData(kind: DocumentKind, color: string): DocumentData {
  const base: DocumentData = {
    kind,
    number:
      kind === "FACTURE"
        ? "FAC-2026-0042"
        : kind === "DEVIS"
          ? "DEV-2026-0012"
          : kind === "PROFORMA"
            ? "PRO-2026-0007"
            : "REC-2026-0128",
    issuedAt: "2026-04-20",
    dueDate: kind === "FACTURE" ? "2026-05-20" : undefined,
    validUntil: kind === "DEVIS" || kind === "PROFORMA" ? "2026-05-05" : undefined,
    currency: "FCFA",
    vatRate: 18,
    statusLabel: kind === "FACTURE" ? "En attente" : undefined,
    notes:
      kind === "FACTURE"
        ? "Merci de régler dans les délais indiqués. Toute facture impayée à l'échéance fera l'objet de pénalités conformément à la réglementation."
        : kind === "DEVIS"
          ? "Ce devis est valable 15 jours. Pour accepter, merci de nous retourner ce document signé."
          : undefined,
    lines: [
      {
        label: "Toyota RAV4 2022",
        sublabel: "VIN : JTMBFREV7NJ123456",
        quantity: 1,
        unitPrice: 15_000_000,
      },
    ],
    from: {
      name: "MdSC Import SARL",
      address: "Quartier Zongo, rue 12.234",
      city: "Cotonou",
      country: "Bénin",
      phone: "+229 21 30 00 00",
      email: "contact@mdsc-import.bj",
      legalNumber: "3201234567890",
    },
    to: {
      name: "Kofi Motors SARL",
      address: "Avenue du 24 janvier",
      city: "Lomé",
      country: "Togo",
      phone: "+228 90 00 00 00",
      email: "contact@kofi-motors.tg",
    },
    brand: {
      name: "MdSC Import",
      color,
    },
    payUrl: kind === "FACTURE" || kind === "DEVIS" ? "#pay" : undefined,
  };

  if (kind === "RECU") {
    base.invoiceRef = "FAC-2026-0042";
    base.paymentMethod = "Virement Ecobank";
    base.paymentReference = "VIR-2026-0420-001";
    base.remainingBalance = 12_700_000;
    base.lines = [
      {
        label: "Paiement partiel",
        sublabel: "Sur facture FAC-2026-0042",
        quantity: 1,
        unitPrice: 5_000_000,
      },
    ];
    base.vatRate = 0;
  }

  return base;
}

export default function DocumentPreviewPage() {
  const [template, setTemplate] = useState<TemplateId>("minimal");
  const [kind, setKind] = useState<DocumentKind>("FACTURE");
  const [color, setColor] = useState<string>("#6366F1");

  const data = useMemo(() => buildMockData(kind, color), [kind, color]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Aperçu des documents
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Compare les 4 templates pour factures, reçus, devis et proforma.
            </p>
          </div>
          <Button onClick={handlePrint} variant="primary">
            Imprimer / Exporter PDF
          </Button>
        </div>

        <Card>
          <div className="space-y-5">
            <Control label="Type de document">
              {KINDS.map((k) => (
                <Chip
                  key={k.id}
                  active={kind === k.id}
                  onClick={() => setKind(k.id)}
                >
                  {k.label}
                </Chip>
              ))}
            </Control>

            <Control label="Template">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    template === t.id
                      ? "border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100"
                      : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                  }`}
                >
                  <p className="font-semibold">{t.label}</p>
                  <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                    {t.description}
                  </p>
                </button>
              ))}
            </Control>

            <Control label="Couleur d'accent">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c.value
                      ? "border-neutral-900 dark:border-white"
                      : "border-white dark:border-neutral-800"
                  }`}
                  style={{ background: c.value }}
                />
              ))}
              {template === "compact" && (
                <Badge variant="warning" className="ml-2">
                  (couleur ignorée sur ce template)
                </Badge>
              )}
            </Control>
          </div>
        </Card>
      </div>

      {/* Preview area */}
      <div className="flex justify-center overflow-x-auto py-6 print:p-0">
        <div
          className={
            template === "compact"
              ? ""
              : "scale-[0.85] origin-top md:scale-100 print:scale-100"
          }
        >
          {template === "classic" && <DocumentClassic data={data} />}
          {template === "minimal" && <DocumentMinimal data={data} />}
          {template === "gradient" && <DocumentGradient data={data} />}
          {template === "compact" && <DocumentCompact data={data} />}
        </div>
      </div>
    </div>
  );
}

function Control({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}
