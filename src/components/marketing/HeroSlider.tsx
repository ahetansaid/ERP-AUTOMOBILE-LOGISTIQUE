"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const SLIDES = [
  {
    image:
      "https://images.pexels.com/photos/395537/pexels-photo-395537.jpeg?auto=compress&cs=tinysrgb&w=1600",
    eyebrow: "Gestion de parc",
    title: "Votre stock,",
    highlight: "maîtrisé de bout en bout.",
    subtitle:
      "VIN, photos, statuts, prix de revient — chaque véhicule sous contrôle, du port au showroom.",
  },
  {
    image:
      "https://images.pexels.com/photos/20581299/pexels-photo-20581299.jpeg?auto=compress&cs=tinysrgb&w=1600",
    eyebrow: "Transit & douane",
    title: "Le transit,",
    highlight: "sans aucun angle mort.",
    subtitle:
      "Du connaissement à la mainlevée, suivez chaque étape au Port de Cotonou, en temps réel.",
  },
  {
    image:
      "https://images.pexels.com/photos/7144207/pexels-photo-7144207.jpeg?auto=compress&cs=tinysrgb&w=1600",
    eyebrow: "Vente & encaissement",
    title: "De l'achat",
    highlight: "à la livraison client.",
    subtitle:
      "Factures, reçus, trésorerie FCFA et relances d'impayés — la boucle commerciale complète.",
  },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  const go = useCallback((n: number) => setI(((n % SLIDES.length) + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[i];

  return (
    <section className="relative h-[90vh] min-h-[560px] w-full overflow-hidden bg-neutral-950">
      {/* Diapos empilées en cross-fade */}
      {SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${idx === i ? "opacity-100" : "opacity-0"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt=""
            className={`h-full w-full object-cover ${idx === i ? "animate-ken-burns" : ""}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-950/60 to-brand-900/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />
        </div>
      ))}

      {/* Contenu (re-monté à chaque slide via key → rejoue les animations) */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6">
        <div key={i} className="max-w-2xl text-white">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
            {s.eyebrow}
          </span>
          <h1 className="mt-5 animate-fade-up font-display text-4xl font-semibold leading-[1.05] tracking-tight [animation-delay:80ms] md:text-6xl">
            {s.title}
            <span className="block animate-gradient-pan bg-gradient-to-r from-white via-brand-200 to-accent-300 bg-[length:200%_auto] bg-clip-text text-transparent">
              {s.highlight}
            </span>
          </h1>
          <p className="mt-5 max-w-xl animate-fade-up text-lg text-white/80 [animation-delay:160ms]">
            {s.subtitle}
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Link
              href="/login"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-brand-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Démarrer l&apos;essai gratuit
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <a
              href="#pricing"
              className="inline-flex h-12 items-center rounded-xl border border-white/30 bg-white/10 px-6 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Voir les tarifs
            </a>
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            aria-label={`Diapositive ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>
    </section>
  );
}
