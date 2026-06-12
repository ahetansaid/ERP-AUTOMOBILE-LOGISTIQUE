import Link from "next/link";
import { Reveal } from "@/components/marketing/Reveal";
import { HeroSlider } from "@/components/marketing/HeroSlider";

/**
 * Landing marketing — ParcAuto Manager
 * Structure inspirée d'un site d'agence (hero slider, services, piliers
 * numérotés, showcase, stats, tarifs, CTA contact, footer multi-colonnes).
 * Photos illustratives : Pexels.
 */

export const metadata = {
  title: "ParcAuto Manager — ERP import auto en Afrique de l'Ouest",
  description:
    "Gérez votre import de véhicules de A à Z : achats, transit, atelier, facturation, trésorerie. Essai 14 jours gratuit.",
};

const IMG = {
  cars: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=1100",
  port: "https://images.pexels.com/photos/20581299/pexels-photo-20581299.jpeg?auto=compress&cs=tinysrgb&w=1100",
  deal: "https://images.pexels.com/photos/7144207/pexels-photo-7144207.jpeg?auto=compress&cs=tinysrgb&w=1100",
  lot: "https://images.pexels.com/photos/395537/pexels-photo-395537.jpeg?auto=compress&cs=tinysrgb&w=900",
  garage: "https://images.pexels.com/photos/8986105/pexels-photo-8986105.jpeg?auto=compress&cs=tinysrgb&w=900",
  keys: "https://images.pexels.com/photos/7144201/pexels-photo-7144201.jpeg?auto=compress&cs=tinysrgb&w=900",
  night: "https://images.pexels.com/photos/1685111/pexels-photo-1685111.jpeg?auto=compress&cs=tinysrgb&w=1600",
};

const SERVICES = [
  {
    image: IMG.cars,
    title: "Supply chain end-to-end",
    desc: "Achats conteneur ou vrac, VIN, prix de revient en FCFA, statuts de stock — un workflow unique du port à la vente.",
  },
  {
    image: IMG.port,
    title: "Transit & dédouanement",
    desc: "Les 7 étapes du transit suivies en temps réel, du connaissement à la mainlevée. Alertes sur les véhicules immobilisés.",
  },
  {
    image: IMG.deal,
    title: "Comptabilité & trésorerie",
    desc: "Factures, reçus, devis, proforma et trésorerie FCFA multi-devises. Relances d'impayés et reporting intégrés.",
  },
];

const PILLARS = [
  { n: "01", title: "Pensé pour l'Afrique de l'Ouest", desc: "FCFA natif, mobile money, réalités du transit maritime et du dédouanement régional." },
  { n: "02", title: "Tout-en-un, fini Excel", desc: "Stock, achats, transit, atelier, compta et CRM dans une seule interface cohérente." },
  { n: "03", title: "Sécurisé & multi-société", desc: "Isolation par société, RBAC granulaire, audit log complet, 2FA et chiffrement." },
  { n: "04", title: "Mobile, sur le terrain", desc: "Utilisable au showroom, au port ou en atelier. Scan VIN, dark mode, PWA installable." },
];

const WORKFLOW = [
  { image: IMG.lot, step: "Achat", desc: "Conteneur/vrac, VIN, coût de revient." },
  { image: IMG.port, step: "Transit", desc: "Suivi douane, 7 étapes, alertes." },
  { image: IMG.garage, step: "Atelier", desc: "Devis, réparations, clôture." },
  { image: IMG.keys, step: "Vente", desc: "Facture, reçu, livraison client." },
];

const STATS = [
  { big: "80%", small: "de temps gagné sur la saisie comptable" },
  { big: "7", small: "étapes de transit suivies automatiquement" },
  { big: "24/7", small: "visibilité temps réel sur votre stock" },
  { big: "0 F", small: "pour démarrer — essai 14 jours" },
];

const PRICES = [
  { name: "Essential", tagline: "PME, premier pas", price: "50 000", unit: "FCFA / mois", highlighted: false,
    features: ["Achats · Véhicules · CRM", "Factures & reçus", "Trésorerie FCFA", "3 utilisateurs", "Support email"] },
  { name: "Professional", tagline: "Le plus populaire", price: "120 000", unit: "FCFA / mois", highlighted: true,
    features: ["Tout Essential, plus :", "Devis atelier & transit 7 étapes", "Rapports avancés P&L, aging", "Documents PDF personnalisés", "Notifications email & SMS", "10 utilisateurs"] },
  { name: "Enterprise", tagline: "Groupes, multi-société", price: "Sur devis", unit: "", highlighted: false,
    features: ["Tout Professional, plus :", "GED intelligente (OCR)", "Multi-société", "API publique + SSO", "Audit & conformité complets", "Support dédié 24/7"] },
];

const FAQ = [
  { q: "Le paiement mobile money est-il supporté ?", a: "Oui. CinetPay couvre MTN, Orange, Moov et Wave pour le Bénin, Togo, Burkina, Côte d'Ivoire, Sénégal et Mali. Stripe gère la carte bancaire internationale." },
  { q: "Puis-je essayer sans carte bancaire ?", a: "Oui, 14 jours gratuits sur tous les plans, sans carte. Vous n'êtes facturé qu'à l'issue de l'essai si vous continuez." },
  { q: "Mes données sont-elles hébergées en Afrique ?", a: "Vous pouvez choisir entre un hébergement UE (Frankfurt) et Afrique (selon l'offre Enterprise)." },
  { q: "Puis-je migrer depuis Excel ou un autre ERP ?", a: "Import CSV pour clients, fournisseurs, véhicules et historique. Pour les migrations complexes, notre équipe vous accompagne." },
];

export default function DecouvrirPage() {
  return (
    <main className="bg-white text-neutral-900 antialiased">
      {/* NAV (sombre, sticky) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
          <Link href="/decouvrir" className="flex items-center gap-2.5 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-sm font-bold ring-1 ring-white/20">P</span>
            <span className="text-[15px] font-semibold tracking-tight">ParcAuto Manager</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#services" className="transition-colors hover:text-white">Services</a>
            <a href="#workflow" className="transition-colors hover:text-white">Workflow</a>
            <a href="#pricing" className="transition-colors hover:text-white">Tarifs</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white sm:inline-block">
              Connexion
            </Link>
            <Link href="/login" className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-semibold text-brand-700 transition-transform hover:-translate-y-0.5">
              Essai gratuit
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO SLIDER */}
      <HeroSlider />

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Nos services</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Une plateforme, <span className="text-neutral-500">tout votre métier.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {SERVICES.map((s, idx) => (
            <Reveal key={s.title} delay={idx * 90}>
              <article className="group h-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-soft-lg">
                <div className="relative h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/50 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-600">{s.desc}</p>
                  <Link href="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700">
                    En savoir plus <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PILIERS NUMEROTES */}
      <section className="border-y border-neutral-100 bg-neutral-50/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Pourquoi ParcAuto</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
                Conçu pour le terrain, <span className="text-neutral-500">pas pour le siège.</span>
              </h2>
              <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-neutral-600">
                ParcAuto Manager parle le langage des importateurs et concessionnaires
                d'Afrique de l'Ouest : FCFA, mobile money, transit maritime, dédouanement.
              </p>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2">
              {PILLARS.map((p, idx) => (
                <Reveal key={p.n} delay={idx * 80}>
                  <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                    <span className="font-display text-3xl font-bold text-brand-200">{p.n}</span>
                    <h3 className="mt-2 font-display text-lg font-semibold">{p.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600">{p.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW SHOWCASE */}
      <section id="workflow" className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Le parcours</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Du port au client, <span className="text-neutral-500">en 4 temps.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((w, idx) => (
            <Reveal key={w.step} delay={idx * 80}>
              <div className="group relative h-72 overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.image} alt={w.step} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Étape {idx + 1}</span>
                  <h3 className="mt-0.5 font-display text-2xl font-semibold">{w.step}</h3>
                  <p className="mt-1 text-sm text-white/75">{w.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* STATS BAND */}
      <section className="bg-neutral-950 py-20 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((m, idx) => (
            <Reveal key={m.big} delay={idx * 70} className="text-center sm:text-left">
              <p className="font-display text-5xl font-semibold tracking-tight"
                 style={{ background: "linear-gradient(180deg,#fff,#a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {m.big}
              </p>
              <p className="mt-2 text-sm text-neutral-400">{m.small}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Tarification</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Un prix par société, <span className="text-neutral-500">pas par utilisateur.</span>
          </h2>
          <p className="mt-5 text-lg text-neutral-600">Mensuel ou annuel (−20 %). Mobile money et carte acceptés.</p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PRICES.map((p, idx) => (
            <Reveal key={p.name} delay={idx * 80}>
              <div className={`relative h-full rounded-3xl border p-7 ${p.highlighted ? "border-brand-500 bg-gradient-to-b from-brand-50/70 to-white shadow-glow" : "border-neutral-200 bg-white"}`}>
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow">Populaire</span>
                )}
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-neutral-500">{p.tagline}</p>
                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold tracking-tight">{p.price}</span>
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
                <Link href="/login" className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl text-[14.5px] font-semibold transition-colors ${p.highlighted ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white hover:shadow-glow-sm" : "border border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300"}`}>
                  {p.name === "Enterprise" ? "Parler à l'équipe" : "Démarrer l'essai"}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA CONTACT */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.night} alt="" className="absolute inset-0 h-full w-full animate-ken-burns object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800/95 via-brand-900/92 to-violet-900/95" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-24 text-center text-white md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Prêt à faire décoller votre parc ?</h2>
            <p className="mt-3 max-w-xl text-white/80">14 jours gratuits, sans carte. Onboarding guidé en moins d'une heure avec votre premier véhicule enregistré.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-[15px] font-semibold text-brand-700 shadow-lg transition-transform hover:-translate-y-0.5">
              Démarrer maintenant →
            </Link>
            <a href="mailto:contact@drwintech.com" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20">
              Parler à un expert
            </a>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y border-neutral-100 bg-neutral-50/60 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Conçu pour les importateurs de Cotonou, Lomé, Ouagadougou, Abidjan
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-neutral-400">
            {["Bénin", "Togo", "Burkina Faso", "Côte d'Ivoire", "Sénégal", "Mali"].map((c) => (
              <span key={c} className="font-display text-lg font-semibold">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
        <Reveal>
          <h2 className="text-center font-display text-4xl font-semibold tracking-tight md:text-5xl">Questions fréquentes</h2>
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQ.map((item, i) => (
            <details key={i} className="group rounded-2xl border border-neutral-200 bg-white p-6 open:shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-neutral-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 text-neutral-400">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5 text-white">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-sm font-bold ring-1 ring-white/20">P</span>
                <span className="text-[15px] font-semibold tracking-tight">ParcAuto Manager</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed">
                L'ERP d'import automobile pensé pour l'Afrique de l'Ouest. Du port à la livraison, sur une seule plateforme.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Produit</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#services" className="transition-colors hover:text-white">Services</a></li>
                <li><a href="#workflow" className="transition-colors hover:text-white">Workflow</a></li>
                <li><a href="#pricing" className="transition-colors hover:text-white">Tarifs</a></li>
                <li><a href="#faq" className="transition-colors hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Société</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/login" className="transition-colors hover:text-white">Connexion</Link></li>
                <li><a href="mailto:contact@drwintech.com" className="transition-colors hover:text-white">Contact</a></li>
                <li><span>Drwintech SaaS</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Légal</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#" className="transition-colors hover:text-white">Conditions</a></li>
                <li><a href="#" className="transition-colors hover:text-white">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs">
            <p>© {new Date().getFullYear()} ParcAuto Manager · Drwintech SaaS Solutions</p>
            <p>Hébergé sur Neon &amp; Vercel · Paiement CinetPay &amp; Stripe</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.704 5.296a1 1 0 0 1 0 1.415l-8 8a1 1 0 0 1-1.415 0l-4-4a1 1 0 0 1 1.415-1.414L8 12.586l7.29-7.29a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
    </svg>
  );
}
