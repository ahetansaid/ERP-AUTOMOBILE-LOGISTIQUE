import Image from "next/image";

/** Marque Kadie Auto — le seul fichier logo du dépôt, servi depuis `public/`. */
export function LogoKadie({ className }: { className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden ${className ?? ""}`}>
      {/* Le jpeg porte de larges marges blanches : on zoome pour que l'écusson remplisse la tuile. */}
      <Image
        src="/logo-kadie-auto.jpeg"
        alt="Kadie Auto"
        fill
        sizes="48px"
        className="object-cover scale-[1.45]"
      />
    </span>
  );
}
