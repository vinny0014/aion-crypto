"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, type ConsentChoice } from "../lib/consent";

const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ?? "";
const validClientId = /^ca-pub-\d{16}$/.test(clientId);

export default function AdSenseBootstrap() {
  const [advertisingAllowed, setAdvertisingAllowed] = useState(false);
  useEffect(() => {
    setAdvertisingAllowed(Boolean(readConsent()?.advertising));
    const changed = (event: Event) => setAdvertisingAllowed(Boolean((event as CustomEvent<ConsentChoice>).detail.advertising));
    window.addEventListener(CONSENT_EVENT, changed);
    return () => window.removeEventListener(CONSENT_EVENT, changed);
  }, []);
  if (!enabled || !validClientId || !advertisingAllowed) return null;
  return (
    <Script
      id="adsense-bootstrap"
      async
      crossOrigin="anonymous"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
    />
  );
}
