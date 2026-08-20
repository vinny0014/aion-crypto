"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "./Analytics";
import { MASCOTS, mascotFor } from "../lib/mascots";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

type RankingItem = {
  symbol: string; coin: string; title: string; position: number; votes: number;
  percentage: number; movement: number;
  latest_news: { slug: string; title: string; published_at: string } | null;
};
type HallEntry = RankingItem & { week: string; championships: number };
type ArenaState = {
  round: { id: number; week: string; starts_at: string; ends_at: string; status: string; total_votes: number };
  champion: RankingItem;
  mascot_of_week: (RankingItem & { week: string }) | null;
  ranking: RankingItem[];
  hall_of_fame: HallEntry[];
  next_challenger: { symbol: string; coin: string; title: string } | null;
  last_rotation: { relegated: { symbol: string; coin: string; title: string }; promoted: { symbol: string; coin: string; title: string }; week: string } | null;
  can_vote: boolean;
  next_vote_at: string | null;
};

function deviceToken() {
  const key = "aion_mascot_voter";
  let token = window.localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID().replaceAll("-", "");
    window.localStorage.setItem(key, token);
  }
  return token;
}

function campaignSource() {
  const key = "aion_arena_campaign";
  const query = new URLSearchParams(window.location.search);
  const values = ["utm_source", "utm_medium", "utm_campaign", "utm_content"]
    .map((name) => query.get(name) ? `${name}=${query.get(name)}` : "")
    .filter(Boolean).join("&");
  if (values) window.sessionStorage.setItem(key, values);
  return (values || window.sessionStorage.getItem(key) || "arena-organic").slice(0, 120);
}

function formatCountdown(target: string | null, now: number) {
  if (!target) return "Available now";
  const remaining = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining / 3_600_000) % 24);
  const minutes = Math.floor((remaining / 60_000) % 60);
  return days ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
}

function Movement({ value }: { value: number }) {
  if (value > 0) return <span className="text-up" aria-label={`Up ${value} positions`}>↑{value}</span>;
  if (value < 0) return <span className="text-down" aria-label={`Down ${Math.abs(value)} positions`}>↓{Math.abs(value)}</span>;
  return <span className="text-ink-dim" aria-label="Position unchanged">＝</span>;
}

function useViewedEvent(event: string) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        track(event);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [event]);
  return ref;
}

export default function MascotArenaClient() {
  const [arena, setArena] = useState<ArenaState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loadingVote, setLoadingVote] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const rankingRef = useViewedEvent("mascot_ranking_view");
  const hallRef = useViewedEvent("hall_of_fame_view");

  const loadArena = useCallback(async () => {
    if (!BACKEND) return;
    try {
      const token = deviceToken();
      const response = await fetch(`${BACKEND}/api/v1/mascot-arena`, {
        cache: "no-store", headers: { "X-Arena-Device": token },
      });
      if (response.ok) setArena(await response.json() as ArenaState);
    } catch {
      setNotice("Live voting is reconnecting. The character collection remains available.");
    }
  }, []);

  useEffect(() => { void loadArena(); }, [loadArena]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const ranking = useMemo<RankingItem[]>(() => arena?.ranking ?? MASCOTS.map((item, index) => ({
    symbol: item.symbol, coin: item.coin, title: item.title, position: index + 1,
    votes: 0, percentage: 0, movement: 0, latest_news: null,
  })), [arena]);
  const champion = arena?.champion ?? ranking[0];
  const championMascot = mascotFor(champion.symbol) ?? MASCOTS[0];
  const roundCountdown = formatCountdown(arena?.round.ends_at ?? null, now);
  const canVoteNow = arena?.can_vote !== false || Boolean(arena.next_vote_at && Date.parse(arena.next_vote_at) <= now);
  const nextVoteCountdown = canVoteNow ? "Available now" : formatCountdown(arena?.next_vote_at ?? null, now);

  async function vote(symbol: string) {
    const item = ranking.find((entry) => entry.symbol === symbol);
    if (!BACKEND) {
      setNotice("Live voting needs the production API connection. Please try again shortly.");
      return;
    }
    setLoadingVote(symbol);
    setNotice("");
    track("mascot_card_click", { coin: symbol, mascot: item?.title ?? symbol, position: item?.position ?? 0, source: "vote_button" });
    try {
      const response = await fetch(`${BACKEND}/api/v1/mascot-arena/votes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mascot: symbol, device_token: deviceToken(), source: campaignSource() }),
      });
      const body = await response.json() as ArenaState & { detail?: { message?: string; next_vote_at?: string } };
      if (!response.ok) {
        if (body.detail?.next_vote_at && arena) setArena({ ...arena, can_vote: false, next_vote_at: body.detail.next_vote_at });
        setNotice(body.detail?.message ?? "This vote could not be counted yet.");
        return;
      }
      setArena(body);
      setSelected(symbol);
      setNotice("Your vote has been counted.");
      track("mascot_vote", { coin: symbol, mascot: item?.title ?? symbol, position: item?.position ?? 0, source: campaignSource() });
    } catch {
      setNotice("The Arena could not record the vote. Please try again.");
    } finally {
      setLoadingVote(null);
    }
  }

  async function share(symbol: string) {
    const mascot = mascotFor(symbol);
    const url = `${window.location.origin}/mascot-arena#${symbol.toLowerCase()}`;
    const text = `I voted for ${mascot?.title ?? symbol} in the AION Crypto Mascot Arena. Who gets your vote?`;
    const usedNativeShare = typeof navigator.share === "function";
    if (usedNativeShare) await navigator.share({ title: "AION Crypto Mascot Arena", text, url });
    else {
      await navigator.clipboard.writeText(url);
      setNotice("Arena link copied.");
    }
    track("mascot_share", { coin: symbol, mascot: mascot?.title ?? symbol, source: usedNativeShare ? "native" : "copy" });
  }

  return (
    <div className="pb-20 pt-7 sm:pt-10">
      <section className="relative isolate overflow-hidden rounded-3xl border border-line bg-card shadow-card">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,.19),transparent_38%),radial-gradient(circle_at_80%_15%,rgba(124,58,237,.3),transparent_42%)]" />
        <div className="grid items-center lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative min-h-[280px] overflow-hidden sm:min-h-[340px]">
            {championMascot.image ? <Image src={championMascot.image} alt={`${championMascot.title}, current AION Crypto Mascot Arena leader`} fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover object-top" /> : <div className="flex min-h-[280px] items-center justify-center bg-gradient-to-br from-primary/40 via-card to-amber-400/20 sm:min-h-[340px]"><span className="font-display text-7xl font-black text-white">{champion.symbol}</span></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-card" />
            <span className="absolute left-4 top-4 rounded-full border border-amber-300/40 bg-black/70 px-3 py-1.5 text-[11px] font-bold tracking-[.18em] text-amber-200 backdrop-blur">CURRENT LEADER · #{champion.position}</span>
          </div>
          <div className="px-5 pb-7 pt-2 sm:px-8 lg:py-8 lg:pr-12">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-primary-glow">Mascot Arena</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Battle for the Crown</h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[.15em] text-amber-300">{championMascot.coin}</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">{championMascot.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-dim">Fifteen original crypto characters compete in a live weekly vote. Choose your champion and follow every move.</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-line bg-black/20 p-3"><strong className="num block text-xl text-white">{champion.votes.toLocaleString()}</strong><span className="text-[11px] text-ink-dim">Leader votes</span></div>
              <div className="rounded-xl border border-line bg-black/20 p-3"><strong className="num block text-xl text-white">{arena?.round.total_votes.toLocaleString() ?? "—"}</strong><span className="text-[11px] text-ink-dim">Weekly votes</span></div>
              <div className="rounded-xl border border-line bg-black/20 p-3"><strong className="num block text-xl text-white">{roundCountdown}</strong><span className="text-[11px] text-ink-dim">Remaining</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#contenders" onClick={() => track("mascot_champion_click", { coin: champion.symbol, source: "arena_hero" })} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-glow">VOTE NOW</a>
              <a href="#ranking" className="rounded-xl border border-line bg-bg/60 px-5 py-3 text-sm font-semibold text-ink hover:border-primary/60">VIEW RANKING</a>
            </div>
            <p className="mt-4 text-xs text-ink-dim">Next vote: <span className="font-semibold text-ink">{nextVoteCountdown}</span></p>
          </div>
        </div>
      </section>

      <p className="mt-5 min-h-6 text-center text-sm text-amber-200" aria-live="polite">{notice}</p>

      {selected && <section className="mt-2 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
        <p className="font-semibold text-white">Your vote has been counted for {mascotFor(selected)?.title}.</p>
        <p className="mt-1 text-sm text-ink-dim">See what {selected} is doing beyond the Arena.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href={`/crypto/${selected}`} onClick={() => track("mascot_market_click", { coin: selected, mascot: mascotFor(selected)?.title ?? selected, destination: `/crypto/${selected}`, source: "post_vote" })} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-bg">Open {selected} Market</Link>
          {ranking.find((item) => item.symbol === selected)?.latest_news ? <Link href={`/news/${ranking.find((item) => item.symbol === selected)!.latest_news!.slug}`} onClick={() => track("mascot_news_click", { coin: selected, mascot: mascotFor(selected)?.title ?? selected, destination: "latest_verified_news", source: "post_vote" })} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-white">Latest {selected} News</Link> : <span className="rounded-lg border border-line px-4 py-2 text-sm text-ink-dim">Latest verified coverage coming soon.</span>}
        </div>
      </section>}

      <section className="mt-8 min-h-[11.5rem] rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-card p-5 sm:min-h-[10.5rem] sm:p-6" aria-live="polite" aria-busy={!arena}>
        {arena?.mascot_of_week ? <>
          <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Mascot of the Week · {arena.mascot_of_week.week}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-white">{arena.mascot_of_week.coin} · {arena.mascot_of_week.title}</h2>
          <p className="mt-2 text-sm text-ink-dim">Champion with {arena.mascot_of_week.votes.toLocaleString()} votes and the #1 final position.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/crypto/${arena.mascot_of_week.symbol}`} onClick={() => track("mascot_champion_click", { coin: arena.mascot_of_week!.symbol, source: "weekly_champion_coin" })} className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-black">Champion Coin</Link>
            {arena.mascot_of_week.latest_news ? <Link href={`/news/${arena.mascot_of_week.latest_news.slug}`} onClick={() => track("mascot_champion_click", { coin: arena.mascot_of_week!.symbol, source: "weekly_champion_news" })} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-white">Latest News</Link> : <span className="rounded-lg border border-line px-4 py-2 text-sm text-ink-dim">Latest verified coverage coming soon.</span>}
          </div>
        </> : <>
          <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Mascot of the Week</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-white">Weekly champion is being verified</h2>
          <p className="mt-2 text-sm text-ink-dim">The confirmed winner and latest verified coverage will appear here when the live round connects.</p>
        </>}
      </section>

      <section id="ranking" ref={rankingRef} className="mt-10 scroll-mt-24" aria-labelledby="ranking-title">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Live standings</p><h2 id="ranking-title" className="mt-1 font-display text-3xl font-bold text-white">Weekly Top 15</h2></div><span className="chip">{arena?.round.week ?? "Loading round"}</span></div>
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
          {ranking.map((item) => <div key={item.symbol} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-0 sm:grid-cols-[52px_1fr_100px_90px] sm:px-5">
            <span className="num text-xl font-bold text-white">#{item.position}</span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{item.symbol} · {item.title}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400" style={{ width: `${Math.max(item.percentage, item.votes ? 3 : 0)}%` }} /></div></div>
            <span className="hidden text-center text-sm font-semibold sm:block"><Movement value={item.movement} /></span>
            <div className="text-right"><strong className="num block text-sm text-white">{item.votes.toLocaleString()}</strong><span className="text-[11px] text-ink-dim">{item.percentage}%</span></div>
          </div>)}
        </div>
      </section>

      <section id="contenders" className="mt-12 scroll-mt-24" aria-labelledby="contenders-title">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Choose your character</p>
        <h2 id="contenders-title" className="mt-1 font-display text-3xl font-bold text-white">Arena Contenders</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
          {ranking.map((standing, index) => {
            const character = mascotFor(standing.symbol) ?? MASCOTS[0];
            return <article id={standing.symbol.toLowerCase()} key={standing.symbol} className={`group scroll-mt-28 overflow-hidden rounded-xl border border-line bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${character.border}`}>
              <div className="relative aspect-[4/5] overflow-hidden bg-bg-soft">
                {character.image ? <Image src={character.image} alt={`${character.title}, AION Crypto character inspired by ${character.coin}`} width={1024} height={1280} priority={index < 2} sizes="(max-width: 767px) 50vw, (max-width: 1535px) 33vw, 20vw" className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.025]" /> : <div className={`flex h-full items-center justify-center bg-gradient-to-br ${character.accent} via-card to-bg-soft`}><span className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">{standing.symbol}</span></div>}
                <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${character.accent}`} />
                <span className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/70 px-2 py-1 text-[10px] font-bold tracking-[.12em] text-white backdrop-blur">#{standing.position} · {character.symbol}</span>
                {standing.position === 1 && <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black tracking-wide text-black">LEADER</span>}
              </div>
              <div className="p-3 sm:p-4">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[.14em] text-primary-glow">{character.coin}</p>
                <h3 className="mt-1 min-h-9 font-display text-base font-bold leading-tight text-white sm:text-lg">{character.title}</h3>
                <p className="mt-1 hidden truncate text-xs text-ink md:block">{character.role}</p>
                <div className="mt-3 flex items-center justify-between text-[11px]"><span className="num font-semibold text-white">{standing.votes.toLocaleString()} votes</span><span className="text-ink-dim">{standing.percentage}%</span></div>
                <button onClick={() => void vote(character.symbol)} disabled={loadingVote !== null || !canVoteNow} className="mt-2 w-full rounded-lg bg-primary px-2 py-2 text-xs font-bold text-white hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Vote for ${character.title}`}>{loadingVote === character.symbol ? "COUNTING…" : canVoteNow ? "VOTE" : "VOTED · 24H"}</button>
                <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
                  <Link href={`/crypto/${character.symbol}`} onClick={() => track("mascot_coin_click", { coin: character.symbol, mascot: character.title, destination: `/crypto/${character.symbol}`, source: "mascot_card" })} className="rounded-md border border-line px-1 py-1.5 text-ink-dim hover:text-white">Price</Link>
                  {standing.latest_news ? <Link href={`/news/${standing.latest_news.slug}`} onClick={() => track("mascot_news_click", { coin: character.symbol, mascot: character.title, destination: `/news/${standing.latest_news!.slug}`, source: "mascot_card" })} className="rounded-md border border-line px-1 py-1.5 text-ink-dim hover:text-white">Story</Link> : <span className="rounded-md border border-line px-1 py-1.5 text-ink-dim" title="Latest verified coverage coming soon.">Story</span>}
                  <button onClick={() => void share(character.symbol)} className="rounded-md border border-line px-1 py-1.5 text-ink-dim hover:text-white">Share</button>
                </div>
                <div className="mt-2 border-t border-line pt-2">
                  <p className="text-[9px] font-bold uppercase tracking-[.14em] text-ink-dim">Latest Story</p>
                  {standing.latest_news ? <Link href={`/news/${standing.latest_news.slug}`} className="mt-1 line-clamp-2 block text-[11px] leading-4 text-ink hover:text-primary-glow">{standing.latest_news.title}</Link> : <p className="mt-1 text-[10px] leading-4 text-ink-dim">Verified coverage coming soon.</p>}
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-primary/30 bg-card p-5 sm:p-6" aria-labelledby="challenger-title" data-analytics-view-event="mascot_relegation_view">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Next Challenger</p>
        <h2 id="challenger-title" className="mt-2 font-display text-2xl font-bold text-white">{arena?.next_challenger ? `${arena.next_challenger.coin} · ${arena.next_challenger.title}` : "Reserve queue is loading"}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-dim">At the weekly close, #1 becomes Mascot of the Week, #15 moves to the end of the reserve queue and this challenger enters the Top 15 automatically.</p>
        {arena?.last_rotation && <p className="mt-3 text-xs text-ink-dim">Last rotation ({arena.last_rotation.week}): {arena.last_rotation.promoted.symbol} promoted · {arena.last_rotation.relegated.symbol} relegated.</p>}
        {arena?.next_challenger && <Link href={`/crypto/${arena.next_challenger.symbol}`} data-analytics-event="mascot_challenger_click" className="mt-4 inline-flex rounded-lg border border-primary/40 px-3 py-2 text-xs font-bold text-primary-glow hover:bg-primary/10 hover:text-white">Meet {arena.next_challenger.symbol} →</Link>}
      </section>

      <section ref={hallRef} className="mt-12" aria-labelledby="hall-title">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">The champions</p>
        <h2 id="hall-title" className="mt-1 font-display text-3xl font-bold text-white">Hall of Fame</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {arena?.hall_of_fame.length ? arena.hall_of_fame.slice(0, 6).map((entry) => <article key={`${entry.week}-${entry.symbol}`} className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-card p-5">
            <p className="text-xs font-bold tracking-[.15em] text-amber-300">WEEKLY CHAMPION · {entry.week}</p><h3 className="mt-2 font-display text-xl font-bold text-white">{entry.coin} · {entry.title}</h3><p className="mt-3 text-sm text-ink-dim">{entry.votes.toLocaleString()} votes · {entry.championships} {entry.championships === 1 ? "title" : "titles"}</p>
          </article>) : <div className="rounded-2xl border border-line bg-card p-6 text-sm text-ink-dim sm:col-span-2 lg:col-span-3">The first champion will enter the Hall of Fame when this weekly round closes.</div>}
        </div>
      </section>

      <aside className="mt-10 rounded-2xl border border-line bg-bg-soft p-5 text-sm leading-6 text-ink-dim sm:p-6"><strong className="text-ink">Editorial note:</strong> These original fictional characters are created by AION Crypto for education and entertainment. The vote is a community competition, not an investment recommendation or endorsement by any blockchain foundation.</aside>
    </div>
  );
}
