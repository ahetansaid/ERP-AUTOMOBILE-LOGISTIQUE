import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP Automobile & Logistique",
  description: "Plateforme SaaS Transit • Import-Export • Concessionnaires",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
