import type { Config } from "tailwindcss";

/**
 * ParcAuto Manager — Design tokens
 * Inspiration : Framer (marketing), Notion (app), Magic UI (micro-interactions)
 *
 * brand   → indigo/violet (CTA, liens, éléments actifs)
 * accent  → emerald (succès, paiements encaissés)
 * warning → amber (échéances proches, alertes)
 * danger  → rose/red (impayés, erreurs)
 * neutral → zinc (gris chaud, texte & surfaces)
 *
 * `primary` reste aliasé sur `brand` pour compat avec le code existant.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter Tight", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        neutral: {
          0: "#ffffff",
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
          1000: "#000000",
        },
      },
      boxShadow: {
        xs: "0 1px 2px rgba(9, 9, 11, 0.04)",
        sm: "0 1px 3px rgba(9, 9, 11, 0.06), 0 1px 2px rgba(9, 9, 11, 0.04)",
        soft: "0 4px 14px rgba(9, 9, 11, 0.06), 0 1px 3px rgba(9, 9, 11, 0.04)",
        "soft-lg": "0 10px 40px -10px rgba(9, 9, 11, 0.1), 0 2px 8px rgba(9, 9, 11, 0.04)",
        glow: "0 0 0 1px rgba(99, 102, 241, 0.2), 0 8px 24px rgba(99, 102, 241, 0.2)",
        "glow-sm": "0 0 0 1px rgba(99, 102, 241, 0.2), 0 4px 14px rgba(99, 102, 241, 0.15)",
        "glow-brand": "0 0 24px -4px rgba(99, 102, 241, 0.45)",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "mesh-brand":
          "radial-gradient(at 0% 0%, rgba(99,102,241,0.10) 0px, transparent 50%)," +
          "radial-gradient(at 100% 0%, rgba(139,92,246,0.08) 0px, transparent 50%)," +
          "radial-gradient(at 100% 100%, rgba(99,102,241,0.06) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
