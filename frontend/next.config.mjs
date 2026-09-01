const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const gaEnabled = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
const clarityEnabled = Boolean(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
const scriptSources = ["'self'", "'unsafe-inline'"];
if (gaEnabled) scriptSources.push("https://www.googletagmanager.com");
if (clarityEnabled) scriptSources.push("https://www.clarity.ms");
if (adsenseEnabled) scriptSources.push("https://pagead2.googlesyndication.com");
const frameSources = adsenseEnabled
  ? "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; "
  : "";
const contentSecurityPolicy = `default-src 'self'; base-uri 'self'; connect-src 'self' https:; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; ${frameSources}img-src 'self' data: https:; object-src 'none'; script-src ${scriptSources.join(" ")}; style-src 'self' 'unsafe-inline'`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  async redirects() {
    const legacyFixtureSlugs = [
      "bitcoin-etf-flows-institutional-demand",
      "ethereum-upgrade-l2-performance",
      "defi-tvl-milestone-analysis",
      "regulation-mica-what-it-means",
      "solana-ecosystem-momentum",
      "guide-crypto-self-custody-basics",
    ];
    return legacyFixtureSlugs.map((slug) => ({
      source: `/news/${slug}`,
      destination: "/news",
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      {
        source: "/explained/:slug",
        headers: [{ key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" }],
      },
    ];
  },
};
export default nextConfig;
