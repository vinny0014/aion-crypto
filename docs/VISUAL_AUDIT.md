# Visual Audit — mockup fidelity tracking

**Method note (honest):** the build environment cannot run a browser (Chromium download domains are outside the sandbox allowlist), so pixel screenshots could not be generated here. This audit is a **structural DOM audit** against the mockup, verified by rendering the production build and asserting section presence in the HTML (all 18 checks passed). Pixel-level screenshot comparison at 1440px/tablet/mobile is the first task for the review stage (see WORK_HANDOFF.md).

## Structural fidelity vs mockup (desktop)

| Mockup element | Status | Notes |
|---|---|---|
| Header: logo + AI chip, global search with Ctrl/ hint, watchlist, sign-in | ✅ | AION Crypto branding (mockup's "Crypto Radar" brand not copied, per spec) |
| Secondary nav (Markets/News/Coins/…) | ✅ | 8 sections |
| Coin ticker strip with deltas | ✅ | Live/fallback data, provenance badge |
| Global metrics strip (mcap, volume, dominance…) | ✅ | Real CoinGecko fields; no invented ETF-flow/liquidations metrics (no free source — see gaps) |
| Hero: breaking badge, headline, byline, CTA, purple glow | ✅ | Gradient art direction instead of copyrighted photo |
| Latest News side list | ✅ | |
| Most Read ranked list | ✅ | |
| Fear & Greed gauge | ◑ | Replaced by **Market Breadth** gauge computed transparently from real 24h data (fabricating F&G values was not acceptable; wiring alternative.me API is a handoff item) |
| Market overview chart | ✅ | SVG area chart, real klines |
| Crypto heatmap | ✅ | Intensity by real 24h change |
| Market dominance donut | ✅ | Real dominance split |
| AI market summary card | ✅ | Template-generated, explicitly labeled + disclaimer |
| Top gainers / losers / trending with sparklines | ✅ | Trending = by real volume |
| Latest articles card grid with category chips | ✅ | Gradient covers pending image-template system |
| Videos / Podcasts rails | ✗ | Intentionally omitted: no real content exists; spec forbids fake/empty cards. Handoff item. |
| Feature strip (portfolio/alerts/converter…) | ✗ | Omitted for same reason — no decorative non-functional buttons |
| Newsletter band + full footer (6 columns) | ✅ | |

Estimated structural fidelity: **~85% desktop** (below the 95% target until videos/podcasts/feature-strip equivalents have real functionality, and pixel pass is done). Tablet/mobile: responsive grid collapse implemented; needs screenshot verification.

## Corrections applied during the loop
- Same-cycle retry bug in Commander (found by test, fixed, regression test added).
- Missing email-validator dependency (found by test run, fixed).
- JSON tuple typing error in fixtures (found by typecheck, fixed).

## Open visual pendências
1. Pixel screenshots at 1440/768/390 + diff list vs mockup.
2. Load Inter/Space Grotesk via next/font (needs network at build).
3. Article image template system (1200×630) replacing gradient covers.
4. Density pass on spacing once real editorial volume exists.
