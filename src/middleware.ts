/**
 * Content-Security-Policy, par nonce.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * L'audit de sécurité a trouvé une injection HTML menant au vol de session :
 * trois pages construisaient un document d'impression par concaténation, sans
 * échapper les données. Les libellés sont corrigés, mais une CSP est la seconde
 * ligne — celle qui tient même quand la discipline d'échappement cède, et elle
 * avait déjà cédé sur trois fichiers sur quatre.
 *
 * POURQUOI UN NONCE ET PAS `script-src 'self'`
 *
 * Next injecte au moins un script EN LIGNE pour l'hydratation
 * (`self.__next_f.push(...)`). Un `script-src 'self'` nu le bloquerait et
 * l'application ne démarrerait plus. Deux issues : `'unsafe-inline'`, qui
 * annulerait tout l'intérêt, ou un nonce — un jeton aléatoire par réponse, que
 * seuls les scripts émis par nous portent.
 *
 * Next reconnaît le nonce quand il le trouve dans l'en-tête CSP de la REQUÊTE et
 * l'applique lui-même à ses balises. D'où la double écriture ci-dessous : sur la
 * requête pour que Next le lise, sur la réponse pour que le navigateur
 * l'applique.
 *
 * `'strict-dynamic'` complète le dispositif : un script chargé par un script de
 * confiance est de confiance. Sans lui, le découpage en morceaux de Next serait
 * bloqué au premier chargement dynamique.
 *
 * CE QUI EST DÉLIBÉRÉMENT PERMISSIF, ET POURQUOI
 *
 *   style-src 'unsafe-inline'  Tailwind et React posent des styles en ligne. Un
 *                             style ne peut pas exfiltrer un jeton.
 *   img-src https:            Les illustrations viennent encore d'un hébergeur
 *                             externe. À resserrer le jour où elles partiront.
 *   connect-src               L'API est sur une AUTRE origine : sans elle ici,
 *                             chaque appel serait bloqué et l'application vide.
 *
 * CE QUI EST FERMÉ
 *
 *   object-src 'none'         Plus de Flash, plus d'embed : rien à autoriser.
 *   frame-ancestors 'none'    L'application ne s'encadre pas — anti-clickjacking.
 *   base-uri 'self'           Empêche de détourner la résolution des URL
 *                             relatives par une balise <base> injectée.
 */

import { NextRequest, NextResponse } from "next/server";

/** Origine de l'API, à autoriser explicitement en connect-src. */
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID();

  const politique = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${API}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  // Sur la REQUÊTE : c'est là que Next lit le nonce pour l'appliquer à ses
  // propres balises <script>.
  const entetes = new Headers(request.headers);
  entetes.set("x-nonce", nonce);
  entetes.set("Content-Security-Policy", politique);

  const reponse = NextResponse.next({ request: { headers: entetes } });

  // Sur la RÉPONSE : c'est là que le navigateur la lit.
  reponse.headers.set("Content-Security-Policy", politique);
  reponse.headers.set("X-Content-Type-Options", "nosniff");
  reponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  reponse.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return reponse;
}

export const config = {
  /*
   * Les fichiers statiques sont exclus : ils n'exécutent rien, et un nonce sur
   * eux empêcherait toute mise en cache pour rien.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
