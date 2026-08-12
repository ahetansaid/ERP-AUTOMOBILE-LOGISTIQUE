/**
 * Ouverture de fichiers protégés.
 *
 * Une fenêtre ouverte par `window.open` ne peut pas porter d'en-tête
 * `Authorization`. On mettait donc le jeton d'accès complet dans l'URL — donc
 * dans l'historique du navigateur, dans l'en-tête `Referer` transmis aux tiers,
 * et dans les journaux des proxies. Ce jeton reste valide trente minutes et
 * ouvre toute l'API.
 *
 * On demande désormais au serveur un jeton dédié : limité à une seule
 * ressource, en lecture, valable deux minutes. Fuité, il ne donne accès qu'au
 * fichier qu'on était déjà en train d'ouvrir.
 */

import { apiPost } from "./api";

export type DownloadResource = "uploads" | "invoices";

const baseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Construit l'URL d'un fichier, jeton court inclus.
 * Lève si la session n'est plus valide — l'appelant affiche l'erreur.
 */
export async function buildDownloadUrl(
  resource: DownloadResource,
  resourceId: number | string,
  path: string
): Promise<string> {
  const { token } = await apiPost<{ token: string }>("/auth/download-token", {
    resource,
    resourceId,
  });
  return `${baseUrl()}${path}?token=${encodeURIComponent(token)}`;
}

/**
 * Ouvre un fichier protégé dans un nouvel onglet.
 *
 * L'onglet est ouvert AVANT l'appel réseau puis redirigé : ouvrir après une
 * promesse fait perdre le lien avec le geste utilisateur, et les navigateurs
 * bloquent alors la fenêtre.
 */
export async function openProtectedFile(
  resource: DownloadResource,
  resourceId: number | string,
  path: string
): Promise<void> {
  const onglet = window.open("", "_blank", "noopener,noreferrer");
  try {
    const url = await buildDownloadUrl(resource, resourceId, path);
    if (onglet) onglet.location.href = url;
    else window.location.href = url;
  } catch (err) {
    onglet?.close();
    throw err;
  }
}
