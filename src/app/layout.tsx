import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

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
    <html lang="fr" className={jakarta.variable}>
      <body className="min-h-screen bg-slate-50/80 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
