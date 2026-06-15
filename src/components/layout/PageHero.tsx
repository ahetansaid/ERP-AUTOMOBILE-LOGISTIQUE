/**
 * PageHero — en-tête illustré réutilisable pour les pages de l'app.
 * Bandeau dégradé de marque + photo (Pexels) en fond, titre, sous-titre et
 * actions optionnelles (children).
 */

// Photo Pexels — circulation urbaine à Lagos (contexte africain).
const DEFAULT_IMAGE =
  "https://images.pexels.com/photos/11219429/pexels-photo-11219429.jpeg?auto=compress&cs=tinysrgb&w=1000";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image = DEFAULT_IMAGE,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative animate-fade-up overflow-hidden rounded-3xl ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/85 to-brand-700/55" />
      <div className="absolute inset-0 bg-mesh-brand opacity-15" aria-hidden />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200/80">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-xl text-sm text-white/70">{subtitle}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
