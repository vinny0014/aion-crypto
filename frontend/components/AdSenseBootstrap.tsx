"use client";

import Script from "next/script";

const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ?? "";
const validClientId = /^ca-pub-\d{16}$/.test(clientId);

export default function AdSenseBootstrap() {
  if (!enabled || !validClientId) return null;
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
