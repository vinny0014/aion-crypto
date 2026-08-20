"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export function analyticsBootstrap(measurementId: string) {
  const id = JSON.stringify(measurementId);
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};window.gtag=gtag;(function(){var key='aion_internal_traffic';var query=new URLSearchParams(window.location.search);var requested=query.get('aion_internal');if(requested==='1'){window.sessionStorage.setItem(key,'1')}else if(requested==='0'){window.sessionStorage.removeItem(key)}if(requested!==null){query.delete('aion_internal');var clean=window.location.pathname+(query.toString()?'?'+query.toString():'')+window.location.hash;window.history.replaceState({},'',clean)}gtag('js',new Date());if(window.sessionStorage.getItem(key)==='1'){gtag('set','traffic_type','internal');gtag('set','ip_internal_traffic_rules_value','1')}gtag('config',${id},{send_page_view:false})})();`;
}

export const REQUIRED_ANALYTICS_EVENTS = [
  "mascot_arena_view",
  "mascot_vote",
  "mascot_news_click",
  "mascot_coin_click",
  "mascot_ranking_view",
  "mascot_share",
  "mascot_champion_click",
  "mascot_relegation_view",
  "mascot_challenger_click",
  "article_view",
  "news_click",
  "market_click",
  "coin_click",
  "related_article_click",
  "newsletter_click",
] as const;

type LinkEvent = { name: string; params: Record<string, string> };

export function linkAnalyticsEvents(currentPath: string, destination: string, explicit?: string): LinkEvent[] {
  const events: LinkEvent[] = [];
  const add = (name: string, params: Record<string, string>) => {
    if (!events.some((event) => event.name === name)) events.push({ name, params });
  };
  const params = { destination };
  if (explicit) add(explicit, params);
  if (destination === "/newsletter") add("newsletter_click", params);
  if (destination === "/news" || destination.startsWith("/news/")) {
    add("news_click", params);
    if (currentPath.startsWith("/news/") && destination.startsWith("/news/") && destination !== currentPath) {
      add("related_article_click", params);
    }
  }
  if (destination === "/markets") add("market_click", params);
  if (destination.startsWith("/crypto/")) {
    const coin = destination.split("/")[2]?.toUpperCase() ?? "";
    add("market_click", { ...params, coin });
    add("coin_click", { ...params, coin });
  }
  return events;
}

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
      for (const analyticsEvent of linkAnalyticsEvents(pathname, url.pathname, anchor.dataset.analyticsEvent)) {
        track(analyticsEvent.name, analyticsEvent.params);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-analytics-view-event]"));
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target)) continue;
        const node = entry.target as HTMLElement;
        const event = node.dataset.analyticsViewEvent;
        if (!event) continue;
        seen.add(node);
        track(event, { page_path: pathname });
        observer.unobserve(node);
      }
    }, { threshold: 0.35 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);
  if (!GA_ID && !CLARITY_ID) return null;
  return <>
    {GA_ID && <Script id="ga" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />}
    {GA_ID && <Script id="ga-init" strategy="afterInteractive">{analyticsBootstrap(GA_ID)}</Script>}
    {CLARITY_ID && <Script id="clarity" strategy="afterInteractive">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script','${CLARITY_ID}');`}</Script>}
  </>;
}
