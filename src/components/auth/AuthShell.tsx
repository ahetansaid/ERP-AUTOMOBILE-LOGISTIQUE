"use client";

/**
 * AuthShell — coquille visuelle commune aux écrans d'authentification
 * (login, mot de passe oublié, reset). Hero photo (Pexels) + animations +
 * carte en verre dépoli. Le contenu du formulaire est passé en `children`.
 */

// Photo Pexels — vue aérienne de circulation à Lagos (contexte africain).
export const HERO_IMAGE =
  "https://images.pexels.com/photos/16206733/pexels-photo-16206733.jpeg?auto=compress&cs=tinysrgb&w=1400";

const IconCar = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
    <path d="M3 17h18v-2.5a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 14.5V17z" />
    <circle cx="7" cy="17.5" r="1.5" />
    <circle cx="17" cy="17.5" r="1.5" />
  </svg>
);
const IconShip = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 15l1.6 4.2a1 1 0 0 0 .94.65h12.9a1 1 0 0 0 .94-.65L21 15" />
    <path d="M5 15V9l7-3 7 3v6" />
    <path d="M12 6V3" />
  </svg>
);
const IconChart = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);

const FEATURES = [
  { icon: IconCar, label: "Stock & véhicules", sub: "VIN, photos, statuts" },
  { icon: IconShip, label: "Transit douane", sub: "Port de Cotonou" },
  { icon: IconChart, label: "Compta & trésorerie", sub: "Temps réel" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 lg:grid-cols-[1.1fr_1fr]">
      {/* ── Panneau gauche : hero visuel ── */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="Parc automobile vu du ciel"
          className="absolute inset-0 h-full w-full origin-center animate-ken-burns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/95 via-brand-900/70 to-brand-700/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-neutral-950/30" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 animate-blob rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 animate-blob rounded-full bg-accent-500/20 blur-3xl [animation-delay:4s]" />

        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <div className="flex animate-fade-up items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-white/20 backdrop-blur-md">
              P
            </span>
            <span className="text-lg font-semibold tracking-tight">ParcAuto Manager</span>
          </div>

          <div className="max-w-lg space-y-6">
            <div className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20 backdrop-blur [animation-delay:80ms]">
              <span className="text-base leading-none">🇧🇯</span>
              Pensé pour le Bénin &amp; l&apos;Afrique de l&apos;Ouest
            </div>
            <h1 className="animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight [animation-delay:140ms] xl:text-5xl">
              Pilotez votre parc auto,
              <span className="block animate-gradient-pan bg-gradient-to-r from-white via-brand-200 to-accent-300 bg-[length:200%_auto] bg-clip-text text-transparent">
                du port à la livraison.
              </span>
            </h1>
            <p className="max-w-md animate-fade-up text-base leading-relaxed text-white/80 [animation-delay:200ms]">
              Stock, achats, transit douanier, facturation et trésorerie — tout
              votre métier de concessionnaire et importateur, réuni sur une
              seule plateforme.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {FEATURES.map((f, i) => (
                <div
                  key={f.label}
                  className="animate-float-y rounded-2xl border border-white/15 bg-white/10 p-3 pr-4 backdrop-blur-md [animation-delay:var(--d)]"
                  style={{ ["--d" as string]: `${i * 1.2}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-white">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{f.label}</div>
                      <div className="text-[11px] text-white/60">{f.sub}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="animate-fade-up text-xs text-white/50 [animation-delay:260ms]">
            © {new Date().getFullYear()} ParcAuto Manager — Tous droits réservés
          </p>
        </div>
      </div>

      {/* ── Panneau droit : contenu ── */}
      <div className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-mesh" />
        <div className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 animate-blob rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative w-full max-w-md">
          {/* Bandeau hero mobile */}
          <div className="mb-6 overflow-hidden rounded-3xl lg:hidden">
            <div className="relative h-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 to-brand-700/30" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur">P</span>
                <span className="font-semibold tracking-tight">ParcAuto Manager</span>
              </div>
            </div>
          </div>

          <div className="animate-fade-up rounded-3xl border border-neutral-200/70 bg-white/80 p-7 shadow-soft-lg backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70 sm:p-9">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-neutral-400">
            Plateforme sécurisée · Données chiffrées · Hébergé sur Neon &amp; Vercel
          </p>
        </div>
      </div>
    </div>
  );
}
