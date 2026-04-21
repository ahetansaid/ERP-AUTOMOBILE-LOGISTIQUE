import Link from "next/link";

/**
 * Landing marketing — ParcAuto Manager
 * Style inspiré Framer : hero fullscreen avec gradient mesh, sections alternées,
 * trust bar, features en grille, pricing, CTA final.
 * Server Component (pas de client-side hooks nécessaires).
 */

export const metadata = {
  title: "ParcAuto Manager — ERP import auto en Afrique de l'Ouest",
  description:
    "Gérez votre import de véhicules de A à Z : achats, transit, atelier, facturation, trésorerie et GED intelligente. Essai 14 jours gratuit.",
};

const FEATURES = [
  {
    title: "Supply chain end-to-end",
    desc: "Achats conteneur/vrac, VIN, transit maritime, dédouanement, atelier, livraison — un workflow unique, du port à la vente.",
    icon: IconTruck,
  },
  {
    title: "Comptabilité FCFA native",
    desc: "Factures, reçus, devis, proforma, trésorerie. Multi-devises avec conversion FCFA automatique. Relances impayés intégrées.",
    icon: IconCoins,
  },
  {
    title: "GED intelligente (Enterprise)",
    desc: "OCR cartes grises, connaissements, factures fournisseurs. Classification et recherche full-text. Un superpouvoir pour vos équipes.",
    icon: IconSparkles,
  },
  {
    title: "Documents signature",
    desc: "Factures et devis PDF générés avec votre charte. 4 templates élégants. Lien de paiement mobile money (CinetPay).",
    icon: IconDocument,
  },
  {
    title: "Multi-tenant sécurisé",
    desc: "Isolation totale par société, RBAC granulaire, audit log complet, 2FA. Conforme aux exigences fiscales régionales.",
    icon: IconShield,
  },
  {
    title: "Mobile & tablette",
    desc: "PWA installable. Scan VIN par caméra. Utilisable au showroom, au port ou en atelier. Dark mode inclus.",
    icon: IconMobile,
  },
];

const PRICES = [
  {
    name: "Essential",
    tagline: "PME, premier pas",
    price: "50 000",
    unit: "FCFA / mois",
    features: [
      "Achats · Véhicules · CRM",
      "Factures & reçus",
      "Trésorerie FCFA",
      "3 utilisateurs",
      "Support email",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    tagline: "Le plus populaire",
    price: "120 000",
    unit: "FCFA / mois",
    features: [
      "Tout Essential, plus :",
      "Devis atelier & transit 7 étapes",
      "Rapports avancés P&L, aging",
      "Documents PDF personnalisés",
      "Notifications email & SMS",
      "10 utilisateurs",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    tagline: "Groupes, multi-société",
    price: "Sur devis",
    unit: "",
    features: [
      "Tout Professional, plus :",
      "GED intelligente (OCR)",
      "Multi-société",
      "API publique + SSO",
      "Audit & conformité complets",
      "Support dédié 24/7",
    ],
    highlighted: false,
  },
];

const FAQ = [
  {
    q: "Le paiement mobile money est-il supporté ?",
    a: "Oui. CinetPay couvre MTN, Orange, Moov et Wave pour le Bénin, Togo, Burkina, Côte d'Ivoire, Sénégal et Mali. Stripe gère la carte bancaire internationale.",
  },
  {
    q: "Puis-je essayer sans carte bancaire ?",
    a: "Oui, 14 jours gratuits sur tous les plans, sans carte. Vous n'êtes facturé qu'à l'issue de l'essai si vous continuez.",
  },
  {
    q: "Mes données sont-elles hébergées en Afrique ?",
    a: "Vous pouvez choisir entre un hébergement UE (Frankfurt) et Afrique (Johannesburg / Abidjan selon l'offre Enterprise).",
  },
  {
    q: "Puis-je migrer depuis Excel ou un autre ERP ?",
    a: "Import CSV pour clients, fournisseurs, véhicules et historique facturation. Pour les migrations complexes, notre équipe vous accompagne gratuitement.",
  },
];

export default function DecouvrirPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-neutral-900 antialiased">
      {/* Gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh-brand opacity-80" aria-hidden />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/50 bg-white/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/decouvrir" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">
              P
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              ParcAuto Manager
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            <a href="#features" className="transition-colors hover:text-neutral-900">
              Fonctionnalités
            </a>
            <a href="#pricing" className="transition-colors hover:text-neutral-900">
              Tarifs
            </a>
            <a href="#faq" className="transition-colors hover:text-neutral-900">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900 sm:inline-block"
            >
              Connexion
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-glow-sm"
            >
              Essai gratuit
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-32 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            Disponible en beta privée · 2026
          </span>
          <h1 className="mt-6 font-display text-[48px] font-semibold leading-[1.05] tracking-tight md:text-[72px]">
            L'ERP pensé pour les{" "}
            <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 bg-clip-text text-transparent">
              importateurs auto
            </span>{" "}
            d'Afrique
          </h1>
          <p className="mt-6 text-lg text-neutral-600 md:text-xl">
            Gérez votre import de véhicules de A à Z : achats, transit maritime,
            atelier, facturation, trésorerie. Mobile money natif, multi-devises FCFA,
            GED intelligente en option.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 text-[15px] font-semibold text-white shadow-glow-sm transition-all hover:shadow-glow"
            >
              Démarrer l'essai gratuit
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center rounded-xl border border-neutral-200 bg-white/80 px-6 text-[15px] font-semibold text-neutral-800 backdrop-blur transition-colors hover:border-neutral-300"
            >
              Voir les fonctionnalités
            </a>
          </div>
          <p className="mt-4 text-sm text-neutral-500">
            14 jours gratuits · Sans carte bancaire · Annulation en 1 clic
          </p>
        </div>

        {/* Mockup placeholder */}
        <div className="mt-16 md:mt-20">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft-lg">
            <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-neutral-300" />
              <span className="h-3 w-3 rounded-full bg-neutral-300" />
              <span className="h-3 w-3 rounded-full bg-neutral-300" />
              <span className="ml-4 font-mono text-xs text-neutral-400">
                parcauto.app/dashboard
              </span>
            </div>
            <div className="grid grid-cols-12 gap-0">
              <aside className="col-span-3 border-r border-neutral-100 bg-neutral-50 p-4">
                <div className="mb-4 h-6 w-24 rounded bg-neutral-200" />
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-7 rounded-lg ${i === 1 ? "bg-brand-100" : "bg-neutral-100"}`}
                    />
                  ))}
                </div>
              </aside>
              <div className="col-span-9 p-6">
                <div className="mb-4 h-4 w-32 rounded bg-neutral-200" />
                <div className="mb-6 grid grid-cols-3 gap-4">
                  {["CA 15,2M", "Stock 48", "Transit 7"].map((k) => (
                    <div
                      key={k}
                      className="rounded-xl border border-neutral-200 bg-white p-4"
                    >
                      <div className="text-xs text-neutral-500">{k.split(" ")[0]}</div>
                      <div className="mt-1 font-display text-2xl font-semibold">
                        {k.split(" ")[1]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-40 rounded-xl bg-gradient-to-br from-brand-50 via-violet-50 to-neutral-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-neutral-100 bg-neutral-50/50 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Conçu pour les importateurs de Cotonou, Lomé, Ouagadougou, Abidjan
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-neutral-400">
            {["Bénin", "Togo", "Burkina Faso", "Côte d'Ivoire", "Sénégal", "Mali"].map(
              (c) => (
                <span key={c} className="font-display text-lg font-semibold">
                  {c}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
            Fonctionnalités
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Une stack complète,{" "}
            <span className="text-neutral-500">pensée pour le métier.</span>
          </h2>
          <p className="mt-5 text-lg text-neutral-600">
            Fini Excel, les WhatsApp éparpillés et les oublis d'échéance. Tout
            passe par une seule interface, cohérente et rapide.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-brand-300 hover:shadow-soft-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* METRICS */}
      <section className="bg-neutral-950 py-24 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { big: "80%", small: "de temps gagné sur la saisie compta" },
              { big: "24/7", small: "visibilité temps réel sur votre stock" },
              { big: "0 €", small: "pour démarrer, essai 14 jours" },
            ].map((m) => (
              <div key={m.big}>
                <p
                  className="font-display text-6xl font-semibold tracking-tight"
                  style={{
                    background:
                      "linear-gradient(180deg, #fff 0%, #a5b4fc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {m.big}
                </p>
                <p className="mt-2 text-neutral-400">{m.small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
            Tarification
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Un prix par société,{" "}
            <span className="text-neutral-500">pas par utilisateur.</span>
          </h2>
          <p className="mt-5 text-lg text-neutral-600">
            Paiement mensuel ou annuel (−20%). Mobile money et carte acceptés.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PRICES.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-7 ${
                p.highlighted
                  ? "border-brand-500 bg-gradient-to-b from-brand-50/60 to-white shadow-glow"
                  : "border-neutral-200 bg-white"
              }`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow">
                  Populaire
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{p.tagline}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-semibold tracking-tight">
                  {p.price}
                </span>
                {p.unit && <span className="text-sm text-neutral-500">{p.unit}</span>}
              </p>
              <ul className="mt-6 space-y-2.5 text-[14px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span className="text-neutral-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl text-[14.5px] font-semibold transition-colors ${
                  p.highlighted
                    ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm hover:shadow-glow-sm"
                    : "border border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300"
                }`}
              >
                {p.name === "Enterprise" ? "Parler à l'équipe" : "Démarrer l'essai"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-neutral-50 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Questions fréquentes
          </h2>
          <div className="mt-12 space-y-3">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-neutral-200 bg-white p-6 open:shadow-soft"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[14.5px] leading-relaxed text-neutral-600">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 py-24 text-white">
        <div className="absolute inset-0 bg-mesh-brand opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Prêt à faire décoller votre parc automobile ?
          </h2>
          <p className="mt-5 text-lg text-white/80">
            14 jours gratuits. Aucune carte requise. Onboarding guidé en moins d'une
            heure avec votre premier véhicule enregistré.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[15px] font-semibold text-brand-700 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Démarrer maintenant →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-neutral-500">
          <p>
            © {new Date().getFullYear()} ParcAuto Manager · Drwintech SaaS Solutions
          </p>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-neutral-900">
              Conditions
            </a>
            <a href="#" className="transition-colors hover:text-neutral-900">
              Confidentialité
            </a>
            <a href="#" className="transition-colors hover:text-neutral-900">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ————————————————— Icons —————————————————
type IconProps = { className?: string };

function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 0 1 0 1.415l-8 8a1 1 0 0 1-1.415 0l-4-4a1 1 0 0 1 1.415-1.414L8 12.586l7.29-7.29a1 1 0 0 1 1.414 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconTruck({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.9 17.9 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-1.607-1.342-2.912-2.9-2.912H8.25" />
    </svg>
  );
}

function IconCoins({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4" />
    </svg>
  );
}

function IconSparkles({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}

function IconDocument({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function IconShield({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z" />
    </svg>
  );
}

function IconMobile({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}
