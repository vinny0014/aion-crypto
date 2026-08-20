import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Analytics from "../components/Analytics";
import AdSenseBootstrap from "../components/AdSenseBootstrap";
import ConsentManager from "../components/ConsentManager";
import { consentDefaultBootstrap } from "../lib/consent";
import {
  APP_NAME,
  INDEXING_ENABLED,
  SITE_ALTERNATE_NAME,
  SITE_DESCRIPTION,
  SITE_LOGO_URL,
  SITE_TITLE,
  TAGLINE,
  SITE_URL,
} from "../lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${APP_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: APP_NAME,
  creator: APP_NAME,
  publisher: APP_NAME,
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: APP_NAME,
    type: "website",
    url: `${SITE_URL}/`,
    locale: "en_US",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: INDEXING_ENABLED,
    follow: INDEXING_ENABLED,
    googleBot: { index: INDEXING_ENABLED, follow: INDEXING_ENABLED },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: APP_NAME,
  url: `${SITE_URL}/`,
  slogan: TAGLINE,
  logo: {
    "@type": "ImageObject",
    url: SITE_LOGO_URL,
    width: 512,
    height: 512,
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: APP_NAME,
  alternateName: SITE_ALTERNATE_NAME,
  url: `${SITE_URL}/`,
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
        <script
          id="consent-default"
          type="text/javascript"
          dangerouslySetInnerHTML={{ __html: consentDefaultBootstrap() }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <Analytics />
        <AdSenseBootstrap />
        <ConsentManager />
        <Header />
        <main className="mx-auto w-full max-w-[1400px] px-3 sm:px-5">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
