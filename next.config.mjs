/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Typage et lint bloquants au build : les casts hérités ont été résorbés
  // (normalisation via src/lib/records.ts) et la config ESLint est en place.
  // Ne pas remettre `ignoreBuildErrors` — une régression de typage doit casser
  // le build, pas passer en production silencieusement.
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/favicon.svg", permanent: false },
    ];
  },
};

export default nextConfig;
