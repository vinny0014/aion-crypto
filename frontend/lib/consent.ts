export const CONSENT_KEY = "aion-cookie-consent-v2";
export const CONSENT_EVENT = "aion-consent-change";

export type ConsentChoice = {
  analytics: boolean;
  advertising: boolean;
  decidedAt: string;
};

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? "null") as Partial<ConsentChoice> | null;
    if (!parsed || typeof parsed.analytics !== "boolean" || typeof parsed.advertising !== "boolean") return null;
    return { analytics: parsed.analytics, advertising: parsed.advertising, decidedAt: String(parsed.decidedAt ?? "") };
  } catch {
    return null;
  }
}

export function googleConsentUpdate(choice: Pick<ConsentChoice, "analytics" | "advertising">) {
  if (typeof window === "undefined" || !("gtag" in window)) return;
  (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag("consent", "update", {
    analytics_storage: choice.analytics ? "granted" : "denied",
    ad_storage: choice.advertising ? "granted" : "denied",
    ad_user_data: choice.advertising ? "granted" : "denied",
    ad_personalization: choice.advertising ? "granted" : "denied",
  });
}

export function saveConsent(choice: Pick<ConsentChoice, "analytics" | "advertising">) {
  const value: ConsentChoice = { ...choice, decidedAt: new Date().toISOString() };
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  googleConsentUpdate(value);
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_EVENT, { detail: value }));
}

export function consentDefaultBootstrap() {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};window.gtag=window.gtag||gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`;
}
