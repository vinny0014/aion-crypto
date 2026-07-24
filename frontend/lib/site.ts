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

// Preview builds may override this value. There is deliberately no localhost
// fallback in active source: developers opt in through .env.local.
export const SITE_URL: string = process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL;

export const CANONICAL_URL = SITE_URL;
export const INDEXING_ENABLED = process.env.NEXT_PUBLIC_ENABLE_INDEXING === "true";

export const CONTACT_EMAILS = {
  editorial: "editorial@aioncrypto.cloud",
  partners: "partners@aioncrypto.cloud",
  security: "security@aioncrypto.cloud",
  privacy: "privacy@aioncrypto.cloud",
} as const;

// ── Language policy ──
// The product ships 100% in English in this phase. i18n is prepared via this
// single locale registry: to add a language later, extend SUPPORTED_LOCALES and
// introduce per-locale message catalogs. Only "en" is active now.
export const DEFAULT_LANGUAGE = "en";
export const CONTENT_LANGUAGE = "en";
export const UI_LANGUAGE = "en";
export const SEO_LANGUAGE = "en";
export const ADMIN_LANGUAGE = "en";
export const SUPPORTED_LOCALES = ["en"] as const;
