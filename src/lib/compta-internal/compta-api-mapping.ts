"use client";

import type { ChargeApi, InvoiceApi, PaymentApi } from "@/lib/services/api";
import type { ChargeInterne, FactureDevisInterne, PaiementInterne } from "./types";

/** Statut facture/devis côté API : on déduit brouillon / envoyé / payé si le backend expose sentAt ou paid */
const defaultInvoiceStatut = "brouillon" as const;

export function mapChargeApiToInterne(c: ChargeApi): ChargeInterne {
  const date = c.createdAt.slice(0, 10);
  return {
    id: c.id,
    label: c.label,
    category: c.chargeType || "Divers",
    amount: c.amount,
    currency: c.currency || "FCFA",
    date,
    vehicleVin: c.vehicleVin ?? undefined,
    createdAt: c.createdAt,
  };
}

export function mapInvoiceApiToInterne(i: InvoiceApi): FactureDevisInterne {
  const date = i.createdAt.slice(0, 10);
  const type = i.status === "FACTURE" ? "facture" : "devis";
  const status = i.sentAt ? "envoye" : defaultInvoiceStatut;
  const factureNature =
    type === "facture" && i.typeFacture === "TEMPORAIRE"
      ? "temporaire"
      : type === "facture" && i.typeFacture === "COMPLETE"
        ? "complet"
        : undefined;
  return {
    id: i.id,
    type,
    factureNature,
    clientName: i.clientName ?? "",
    amount: i.amount,
    currency: i.currency ?? "FCFA",
    date,
    status,
    createdAt: i.createdAt,
  };
}

export function mapPaymentApiToInterne(p: PaymentApi): PaiementInterne {
  const date = p.paidAt ? p.paidAt.slice(0, 10) : p.createdAt.slice(0, 10);
  return {
    id: p.id,
    amount: p.amount,
    currency: p.currency || "FCFA",
    date,
    method: (p.paymentType as PaiementInterne["method"]) || "virement",
    reference: p.reference ?? undefined,
    factureId: p.invoiceId ?? undefined,
    createdAt: p.createdAt,
  };
}
