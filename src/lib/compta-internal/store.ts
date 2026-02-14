"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ComptaInterneState,
  ChargeInterne,
  FactureDevisInterne,
  PaiementInterne,
} from "./types";

const STORAGE_KEY = "erp-compta-internal";

const defaultState: ComptaInterneState = {
  charges: [],
  facturesDevis: [],
  paiements: [],
};

function loadState(): ComptaInterneState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as ComptaInterneState;
    return {
      charges: parsed.charges ?? [],
      facturesDevis: parsed.facturesDevis ?? [],
      paiements: parsed.paiements ?? [],
    };
  } catch {
    return defaultState;
  }
}

function saveState(state: ComptaInterneState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useComptaInterne() {
  const [state, setState] = useState<ComptaInterneState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const addCharge = useCallback((charge: Omit<ChargeInterne, "id" | "createdAt">) => {
    setState((prev) => ({
      ...prev,
      charges: [
        ...prev.charges,
        {
          ...charge,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const deleteCharge = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      charges: prev.charges.filter((c) => c.id !== id),
    }));
  }, []);

  const addFactureDevis = useCallback((fd: Omit<FactureDevisInterne, "id" | "createdAt">) => {
    setState((prev) => ({
      ...prev,
      facturesDevis: [
        ...prev.facturesDevis,
        {
          ...fd,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const updateFactureDevisStatus = useCallback((id: string, status: FactureDevisInterne["status"]) => {
    setState((prev) => ({
      ...prev,
      facturesDevis: prev.facturesDevis.map((f) =>
        f.id === id ? { ...f, status } : f
      ),
    }));
  }, []);

  const deleteFactureDevis = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      facturesDevis: prev.facturesDevis.filter((f) => f.id !== id),
      paiements: prev.paiements.filter((p) => p.factureId !== id),
    }));
  }, []);

  const addPaiement = useCallback((paiement: Omit<PaiementInterne, "id" | "createdAt">) => {
    setState((prev) => ({
      ...prev,
      paiements: [
        ...prev.paiements,
        {
          ...paiement,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const deletePaiement = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      paiements: prev.paiements.filter((p) => p.id !== id),
    }));
  }, []);

  const totalCharges = state.charges.reduce((s, c) => s + c.amount, 0);
  const totalPaiements = state.paiements.reduce((s, p) => s + p.amount, 0);
  const solde = totalPaiements - totalCharges;

  return {
    ...state,
    hydrated,
    addCharge,
    deleteCharge,
    addFactureDevis,
    updateFactureDevisStatus,
    deleteFactureDevis,
    addPaiement,
    deletePaiement,
    totalCharges,
    totalPaiements,
    solde,
  };
}
