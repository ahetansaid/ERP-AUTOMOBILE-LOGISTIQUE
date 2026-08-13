"use client";

/**
 * Carte de navigation et jeu d'icônes.
 *
 * Séparé de la barre latérale pour que la palette de commandes et le fil
 * d'Ariane puissent s'appuyer sur la MÊME source : deux listes de menus qui
 * divergent, c'est un écran qu'on n'atteint plus que par son URL.
 *
 * UNE ICÔNE PAR ENTRÉE, JAMAIS PAR GROUPE.
 *
 * La version précédente attribuait l'icône selon le groupe : les huit lignes de
 * Comptabilité portaient le même document, les six de Supply Chain la même
 * caisse. Une icône identique sur huit lignes n'aide pas à choisir — elle
 * occupe de la place en prétendant informer. Chaque entrée a désormais la
 * sienne, et deux entrées voisines ne se ressemblent pas.
 */

export type NavEntry = {
  href: string;
  label: string;
  /** Rôles autorisés ; absent = tout le monde. */
  roles?: string[];
  /** Clé du compteur à afficher en pastille. */
  badge?: "alertes";
};

export type NavGroup = {
  id: string;
  label: string;
  entries: NavEntry[];
};

/**
 * Les groupes suivent le métier, pas l'arborescence des fichiers.
 *
 * « Pilotage » d'abord : ce qu'on ouvre le matin. « Administration » en
 * dernier : ce qu'on ouvre trois fois par an.
 */
export const NAVIGATION: NavGroup[] = [
  {
    id: "pilotage",
    label: "Pilotage",
    entries: [
      { href: "/dashboard", label: "Tableau de bord" },
      { href: "/alertes", label: "Alertes", badge: "alertes" },
      { href: "/comptabilite/rapports", label: "Rapports" },
    ],
  },
  {
    id: "parc",
    label: "Parc",
    entries: [
      { href: "/supply-chain/vue-globale", label: "Vue globale" },
      { href: "/supply-chain/stock-disponible", label: "Stock disponible" },
      { href: "/supply-chain/stock-regulier", label: "Stock régulier" },
      { href: "/supply-chain/stock-non-regulier", label: "Stock non régulier" },
      { href: "/supply-chain/atelier", label: "Atelier" },
    ],
  },
  {
    id: "approvisionnement",
    label: "Approvisionnement",
    entries: [
      { href: "/supply-chain/achats", label: "Achats" },
      { href: "/transit", label: "Transit" },
      { href: "/transit/suivi", label: "Suivi transit" },
    ],
  },
  {
    id: "comptabilite",
    label: "Comptabilité",
    entries: [
      { href: "/comptabilite/tresorerie", label: "Trésorerie" },
      { href: "/comptabilite/factures", label: "Factures" },
      { href: "/comptabilite/recus", label: "Reçus" },
      { href: "/comptabilite/charges", label: "Charges" },
      { href: "/comptabilite/devis", label: "Devis" },
      { href: "/comptabilite/proforma", label: "Pro forma" },
      { href: "/comptabilite/reconciliation", label: "Réconciliation" },
    ],
  },
  {
    id: "relations",
    label: "Relations",
    entries: [
      { href: "/crm", label: "Clients" },
      { href: "/tiers", label: "Tiers" },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    entries: [
      { href: "/notifications", label: "Notifications" },
      { href: "/utilisateurs", label: "Utilisateurs", roles: ["ADMIN", "PLATFORM_ADMIN"] },
      { href: "/parametres", label: "Paramètres" },
      { href: "/installation", label: "Installation", roles: ["ADMIN", "PLATFORM_ADMIN"] },
    ],
  },
];

/* ── Icônes ───────────────────────────────────────────────────────────────
   Grille 24, trait 1.75, formes volontairement simples : à 18 pixels, un
   dessin détaillé devient une tache. Ce qui compte est que deux entrées
   voisines ne se confondent pas.                                          */

const PATHS: Record<string, string> = {
  "/dashboard": "M3 13h6V3H3zM15 21h6V11h-6zM3 21h6v-4H3zM15 7h6V3h-6z",
  "/alertes": "M12 3.5 2.5 20h19zM12 10v4M12 17.4h.01",
  "/comptabilite/rapports": "M5 21V10M12 21V4M19 21v-7M3 21h18",

  "/supply-chain/vue-globale":
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 9h17M3.5 15h17M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z",
  "/supply-chain/stock-disponible": "M4 8h16v12H4zM4 8l3-4h10l3 4M9 13l2 2 4-4",
  "/supply-chain/stock-regulier": "M4 4h16v16H4zM8 12l3 3 5-6",
  "/supply-chain/stock-non-regulier": "M4 4h16v16H4zM12 8v5M12 16.4h.01",
  "/supply-chain/atelier":
    "M14.5 5.5a3.5 3.5 0 0 0 4.6 4.6L21 12l-9 9-3-3 9-9-1.9-1.9a3.5 3.5 0 0 0-1.7-1.6zM6 15l3 3",

  "/supply-chain/achats": "M3 5h2l2.2 10.5h10L20 8H6M9 20h.01M17 20h.01",
  "/transit": "M3 7h11v9H3zM14 11h4l3 3v2h-7M6.5 19.5h.01M17.5 19.5h.01",
  "/transit/suivi":
    "M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10zM12 11.5h.01",

  "/comptabilite/tresorerie": "M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5A1.5 1.5 0 0 1 4.5 5H16M16.5 13h.01",
  "/comptabilite/factures": "M6 3h12v18l-3-2-3 2-3-2-3 2zM9.5 8h5M9.5 12h5",
  "/comptabilite/recus": "M5 4h14v16l-2.3-1.6L14.4 20l-2.4-1.6L9.6 20l-2.3-1.6L5 20zM9 9h6M9 13h4",
  "/comptabilite/charges": "M12 3v14M12 17l-4-4M12 17l4-4M4 21h16",
  "/comptabilite/devis": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h4",
  "/comptabilite/proforma":
    "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M12 12v3l2 1",
  "/comptabilite/reconciliation": "M4 8h12l-3-3M20 16H8l3 3M6 12.5h.01M18 12.5h.01",

  "/crm": "M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 11l2 2 4-4",
  "/tiers": "M4 5h16v14H4zM8 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 16.5c.6-1.6 2-2.4 3.5-2.4M14 10h4M14 14h4",

  "/notifications": "M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M10.5 20a2 2 0 0 0 3 0",
  "/utilisateurs":
    "M14 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M8 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 13.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 13.5V15M19 8V9.5M21.5 10.1l-1.3.75M17.8 12.2l-1.3.75M21.5 12.9l-1.3-.75M17.8 10.8l-1.3-.75",
  "/parametres":
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3.3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3.3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1.1z",
  "/installation": "M12 3v11M12 14l-3.5-3.5M12 14l3.5-3.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
};

const FALLBACK = "M6 4h12v16H6zM9.5 9h5M9.5 13h5";

export function NavIcon({ href, className }: { href: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[href] ?? FALLBACK} />
    </svg>
  );
}

/** Groupe contenant la route courante, pour l'ouvrir d'office. */
export function groupeActif(pathname: string): string | null {
  let meilleur: { id: string; taille: number } | null = null;
  for (const groupe of NAVIGATION) {
    for (const entree of groupe.entries) {
      if (pathname === entree.href || pathname.startsWith(`${entree.href}/`)) {
        // La correspondance la plus longue gagne : /transit/suivi ne doit pas
        // être capté par /transit.
        if (!meilleur || entree.href.length > meilleur.taille) {
          meilleur = { id: groupe.id, taille: entree.href.length };
        }
      }
    }
  }
  return meilleur?.id ?? null;
}

/** Vrai pour l'entrée la plus spécifique qui couvre la route courante. */
export function estActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  // Une entrée plus précise existe-t-elle ? Si oui, c'est elle qui s'allume.
  return !NAVIGATION.some((g) =>
    g.entries.some(
      (e) =>
        e.href !== href &&
        e.href.startsWith(`${href}/`) &&
        (pathname === e.href || pathname.startsWith(`${e.href}/`))
    )
  );
}
