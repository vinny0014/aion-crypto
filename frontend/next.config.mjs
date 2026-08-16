const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const contentSecurityPolicy = adsenseEnabled
  ? "default-src 'self'; base-uri 'self'; connect-src 'self' https:; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; img-src 'self' data: https:; object-src 'none'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline'"
  : "default-src 'self'; base-uri 'self'; connect-src 'self' https:; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
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
    ];
  },
};
export default nextConfig;
