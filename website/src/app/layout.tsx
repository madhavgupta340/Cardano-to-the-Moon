import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/config/site";
import "./globals.css";

// next/font copies the font into the build, so visitors' browsers never contact Google.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url ?? "http://localhost:4180"),
  title: { default: `${site.name}: AI agent for financial operations`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.tagline, siteName: site.name, type: "website" },
  twitter: { card: "summary_large_image", title: site.name, description: site.tagline },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
