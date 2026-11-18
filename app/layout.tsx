import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lame Atelier — Hand-Forged Damascus Chef's Knife",
  description:
    "A hand-forged Damascus chef's knife with walnut handle in charcoal iron and walnut. Meticulously forged, tempered, and polished.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${inter.variable}`}>
      <body className="bg-[#111111] text-[#F4EDE1] font-sans min-h-screen selection:bg-[#6B4A2F] selection:text-[#F4EDE1]">
        {children}
      </body>
    </html>
  );
}
