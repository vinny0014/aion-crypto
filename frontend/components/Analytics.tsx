"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window !== "undefined" && GA_ID && "gtag" in window) {
    (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag("event", event, params);
  }
}

export default function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    track("page_view", { page_path: pathname });
    if (pathname === "/markets") track("market_view");
    else if (pathname === "/mascot-arena") track("mascot_arena_view");
    else if (pathname.startsWith("/crypto/")) track("coin_view", { symbol: pathname.split("/")[2] ?? "" });
    else if (pathname.startsWith("/news/")) track("article_view");
    else if (pathname === "/search") track("search");
  }, [pathname]);
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      const explicit = anchor.dataset.analyticsEvent;
      if (explicit) track(explicit, { destination: url.pathname });
      if (url.pathname === "/news" || url.pathname.startsWith("/news/")) {
        track("news_click", { destination: url.pathname });
      }
      if (url.pathname === "/markets" || url.pathname.startsWith("/crypto/")) {
        track("market_click", { destination: url.pathname });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);
  if (!GA_ID && !CLARITY_ID) return null;
  return <>
    {GA_ID && <Script id="ga" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />}
    {GA_ID && <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`}</Script>}
    {CLARITY_ID && <Script id="clarity" strategy="afterInteractive">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script','${CLARITY_ID}');`}</Script>}
  </>;
}
