export const CHARGE_CATEGORIES = [
  "Achat véhicule",
  "Frais enchère",
  "Transport",
  "Frais maritimes",
  "Douane / Taxes",
  "Transit / Commissionnaire",
  "Entreposage",
  "Réparation",
  "Assurance",
  "Divers",
] as const;

export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "especes", label: "Espèces" },
  { value: "virement", label: "Virement" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cheque", label: "Chèque" },
];

export const CURRENCIES = ["FCFA", "USD", "EUR"] as const;
