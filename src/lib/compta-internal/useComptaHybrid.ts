"use client";

import { useState, useEffect, useCallback } from "react";
import { useComptaInterne } from "./store";
import {
  mapChargeApiToInterne,
  mapInvoiceApiToInterne,
  mapPaymentApiToInterne,
} from "./compta-api-mapping";
import { comptaApi } from "@/lib/services/api";
import type {
  ChargeInterne,
  FactureDevisInterne,
  PaiementInterne,
  StatutFactureDevis,
} from "./types";
import type { ChargeApi, TreasurySummaryResponse } from "@/lib/services/api";

export type ComptaSource = "api" | "local";

export interface UseComptaHybridResult {
  source: ComptaSource;
  loading: boolean;
  error: string | null;
  charges: ChargeInterne[];
  facturesDevis: FactureDevisInterne[];
  paiements: PaiementInterne[];
  totalCharges: number;
  totalPaiements: number;
  solde: number;
  treasurySummary: TreasurySummaryResponse | null;
  hydrated: boolean;
  refetch: () => Promise<void>;
  addCharge: (
    payload: Omit<ChargeInterne, "id" | "createdAt"> & { vehicleId?: string }
  ) => Promise<void>;
  deleteCharge: (id: string, vehicleId?: string) => Promise<void>;
  addFactureDevis: (
    payload: Omit<FactureDevisInterne, "id" | "createdAt">
  ) => Promise<void>;
  updateFactureDevisStatus: (
    id: string,
    status: StatutFactureDevis
  ) => Promise<void>;
  deleteFactureDevis: (id: string) => Promise<void>;
  addPaiement: (
    payload: Omit<PaiementInterne, "id" | "createdAt">
  ) => Promise<void>;
  deletePaiement: (id: string) => Promise<void>;
}

export function useComptaHybrid(): UseComptaHybridResult {
  const local = useComptaInterne();
  const [source, setSource] = useState<ComptaSource>("local");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiChargesRaw, setApiChargesRaw] = useState<ChargeApi[]>([]);
  const [apiCharges, setApiCharges] = useState<ChargeInterne[]>([]);
  const [apiFactures, setApiFactures] = useState<FactureDevisInterne[]>([]);
  const [apiPaiements, setApiPaiements] = useState<PaiementInterne[]>([]);
  const [treasurySummary, setTreasurySummary] =
    useState<TreasurySummaryResponse | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [chargesRes, invoicesRes, paymentsRes, treasuryRes] =
        await Promise.all([
          comptaApi.charges.list({ limit: 500 }),
          comptaApi.invoices.list({ limit: 500 }),
          comptaApi.payments.list({ limit: 500 }),
          comptaApi.treasury.summary(),
        ]);
      const raw = chargesRes.data ?? [];
      setApiChargesRaw(raw);
      setApiCharges(raw.map(mapChargeApiToInterne));
      setApiFactures(
        (invoicesRes.data ?? []).map(mapInvoiceApiToInterne)
      );
      setApiPaiements(
        (paymentsRes.data ?? []).map(mapPaymentApiToInterne)
      );
      setTreasurySummary(treasuryRes);
      setSource("api");
    } catch (e) {
      setSource("local");
      setError(e instanceof Error ? e.message : "Backend non connecté");
      setTreasurySummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!local.hydrated) return;
    fetchAll();
  }, [local.hydrated, fetchAll]);

  const charges =
    source === "api" ? apiCharges : local.charges;
  const facturesDevis =
    source === "api" ? apiFactures : local.facturesDevis;
  const paiements =
    source === "api" ? apiPaiements : local.paiements;

  const totalCharges =
    source === "api" && treasurySummary
      ? treasurySummary.decaissements
      : (source === "api"
          ? apiCharges.reduce((s, c) => s + c.amount, 0)
          : local.totalCharges);
  const totalPaiements =
    source === "api" && treasurySummary
      ? treasurySummary.encaissements
      : (source === "api"
          ? apiPaiements.reduce((s, p) => s + p.amount, 0)
          : local.totalPaiements);
  const solde =
    source === "api" && treasurySummary
      ? treasurySummary.solde
      : totalPaiements - totalCharges;

  const addCharge = useCallback(
    async (
      payload: Omit<ChargeInterne, "id" | "createdAt"> & { vehicleId?: string }
    ) => {
      if (source === "local") {
        local.addCharge(payload);
        return;
      }
      const vehicleId = payload.vehicleId;
      if (!vehicleId) {
        setError("Sélectionnez un véhicule pour ajouter une charge (mode API).");
        return;
      }
      try {
        await comptaApi.charges.create(vehicleId, {
          label: payload.label,
          amount: payload.amount,
          currency: payload.currency,
          chargeType: payload.category,
        });
        await fetchAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur création charge");
      }
    },
    [source, local, fetchAll]
  );

  const deleteCharge = useCallback(
    async (id: string, vehicleId?: string) => {
      if (source === "local") {
        local.deleteCharge(id);
        return;
      }
      const raw = apiChargesRaw.find((c) => c.id === id);
      const vid = vehicleId ?? raw?.vehicleId ?? null;
      if (!vid) {
        setError("Véhicule inconnu pour cette charge.");
        return;
      }
      try {
        await comptaApi.charges.delete(String(vid), id);
        await fetchAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur suppression charge");
      }
    },
    [source, local, apiChargesRaw, fetchAll]
  );

  const addFactureDevis = useCallback(
    async (payload: Omit<FactureDevisInterne, "id" | "createdAt">) => {
      if (source === "local") {
        local.addFactureDevis(payload);
        return;
      }
      try {
        await comptaApi.invoices.create({
          status: payload.type === "facture" ? "FACTURE" : "DEVIS",
          typeFacture: payload.type === "facture" && payload.factureNature === "temporaire" ? "TEMPORAIRE" : payload.type === "facture" ? "COMPLETE" : undefined,
          amount: payload.amount,
          clientId: undefined,
          lines: [],
        });
        await fetchAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur création facture/devis");
      }
    },
    [source, local, fetchAll]
  );

  const updateFactureDevisStatus = useCallback(
    async (id: string, status: StatutFactureDevis) => {
      if (source === "local") {
        local.updateFactureDevisStatus(id, status);
        return;
      }
      try {
        await comptaApi.invoices.update(id, { status });
        await fetchAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur mise à jour statut");
      }
    },
    [source, local, fetchAll]
  );

  const deleteFactureDevis = useCallback(
    async (id: string) => {
      if (source === "local") {
        local.deleteFactureDevis(id);
        return;
      }
      try {
        await comptaApi.invoices.update(id, {});
        await fetchAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur suppression");
      }
    },
    [source, local, fetchAll]
  );

  const addPaiement = useCallback(
    async (payload: Omit<PaiementInterne, "id" | "createdAt">) => {
      if (source === "local") {
        local.addPaiement(payload);
        return;
      }
      try {
        await comptaApi.payments.create({
          amount: payload.amount,
          currency: payload.currency,
          paymentType: payload.method,
          paidAt: payload.date,
          reference: payload.reference,
          invoiceId: payload.factureId,
        });
        await fetchAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur enregistrement paiement");
      }
    },
    [source, local, fetchAll]
  );

  const deletePaiement = useCallback(
    async (id: string) => {
      if (source === "local") {
        local.deletePaiement(id);
        return;
      }
      setError("Suppression paiement non implémentée côté API.");
    },
    [source, local]
  );

  return {
    source,
    loading,
    error,
    charges,
    facturesDevis,
    paiements,
    totalCharges,
    totalPaiements,
    solde,
    treasurySummary,
    hydrated: local.hydrated,
    refetch: fetchAll,
    addCharge,
    deleteCharge,
    addFactureDevis,
    updateFactureDevisStatus,
    deleteFactureDevis,
    addPaiement,
    deletePaiement,
  };
}
