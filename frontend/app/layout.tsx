import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { APP_NAME, TAGLINE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${APP_NAME} — ${TAGLINE}`, template: `%s · ${APP_NAME}` },
  description:
    "Real-time crypto market data, charts, news and analysis. AION Crypto is a crypto market intelligence portal — prices, insights and research in one place.",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: APP_NAME,
    type: "website",
    url: SITE_URL,
    locale: "en_US",
    title: `${APP_NAME} — ${TAGLINE}`,
    description: "Real-time crypto market data, charts, news and analysis.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${TAGLINE}`,
    description: "Real-time crypto market data, charts, news and analysis.",
  },
  robots: { index: true, follow: true },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: APP_NAME,
  url: SITE_URL,
  slogan: TAGLINE,
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: APP_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <Header />
        <main className="mx-auto w-full max-w-[1400px] px-3 sm:px-5">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
