import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "AION Crypto — Crypto Market Intelligence", template: "%s · AION Crypto" },
  description:
    "Real-time crypto market data, charts, news and analysis. AION Crypto is a crypto market intelligence portal — prices, insights and research in one place.",
  openGraph: {
    siteName: "AION Crypto",
    type: "website",
    title: "AION Crypto — Crypto Market Intelligence",
    description: "Real-time crypto market data, charts, news and analysis.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AION Crypto",
  url: SITE,
  slogan: "Crypto Market Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <Header />
        <main className="mx-auto w-full max-w-[1400px] px-3 sm:px-5">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
