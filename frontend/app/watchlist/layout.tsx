import type { Metadata } from "next";

export const metadata: Metadata = { title: "Watchlist", alternates: { canonical: "/watchlist" }, robots: { index: false, follow: false, nocache: true } };
export default function WatchlistLayout({ children }: { children: React.ReactNode }) { return children; }
