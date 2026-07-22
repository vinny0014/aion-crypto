// ── Official site configuration (single source of truth) ──
// Official production domain: https://aioncrypto.cloud
// Development/preview environments MUST override via NEXT_PUBLIC_SITE_URL.
// No other domain (including any *.vercel.app or other-project subdomain) is valid.

export const APP_NAME = "AION Crypto";
export const APP_SHORT_NAME = "AIONCRYPTO";
export const TAGLINE = "Crypto Market Intelligence";
export const REPOSITORY = "vinny0014/aion-crypto";
export const DEPLOY_TARGET = "Hostinger";

export const PRODUCTION_URL = "https://aioncrypto.cloud";

// In production builds the canonical base is the official domain unless the
// environment explicitly provides one; in development it comes from env vars
// (falling back to the local dev server, never shipped to production output).
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000");

export const CANONICAL_URL = SITE_URL;

export const CONTACT_EMAILS = {
  editorial: "editorial@aioncrypto.cloud",
  partners: "partners@aioncrypto.cloud",
  security: "security@aioncrypto.cloud",
  privacy: "privacy@aioncrypto.cloud",
} as const;
