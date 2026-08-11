/**
 * Lecture sûre des enregistrements bruts renvoyés par l'API.
 *
 * Le backend expose selon les routes du snake_case (`payment_date`) ou du
 * camelCase (`paymentDate`). Plutôt que de caster un type métier en
 * `Record<string, unknown>` et retour — ce que TypeScript refuse à juste titre,
 * les deux types ne se recouvrant pas — on normalise une fois à la réception
 * avec `pickString` / `pickNumber`, puis on manipule des types stricts.
 */

export type ApiRecord = Record<string, unknown>;

/** Convertit une valeur inconnue en enregistrement exploitable (jamais null). */
export const asRecord = (value: unknown): ApiRecord =>
  value !== null && typeof value === "object" ? (value as ApiRecord) : {};

/** Convertit une valeur inconnue en tableau d'enregistrements (jamais null). */
export const asRecords = (value: unknown): ApiRecord[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

/** Première valeur non nulle parmi les clés fournies (alias snake/camel). */
export function pick(record: ApiRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined) return value;
  }
  return undefined;
}

export function pickNumber(
  record: ApiRecord,
  ...keys: string[]
): number | undefined {
  const value = pick(record, ...keys);
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export function pickString(
  record: ApiRecord,
  ...keys: string[]
): string | undefined {
  const value = pick(record, ...keys);
  return value === undefined ? undefined : String(value);
}

/** Échappe une valeur destinée à une interpolation HTML (fenêtres d'impression). */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
