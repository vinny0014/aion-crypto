# AdSense editorial inventory

Reviewed: 2026-08-31

This inventory records the indexation decision for every public route family.
It is a quality-control document, not a claim that Google will approve the
site. A URL is indexed only when it has a stable reader purpose beyond account,
search, subscription or operational utility.

## KEEP

| Route family | Reason |
| --- | --- |
| `/`, `/markets`, `/coins` | Live market discovery with named data providers and explicit limitations. |
| `/news` and approved `/news/[slug]` | Verified, timestamped articles with identified sources; future automated drafts must pass the publication quality gate. |
| `/analysis`, `/research`, `/guides`, `/learn`, `/explained`, `/glossary` | Editorial hubs with a clear learning or research purpose. |
| 23 `/explained/[slug]` guides | Original evergreen explanations with risks, primary references, review dates, FAQs and internal links. |
| `/crypto/BTC`, `/crypto/ETH`, `/crypto/XRP`, `/crypto/SOL`, `/crypto/BNB`, `/crypto/ADA` | Six core coin pillars combining live data, mechanics, uses, risks and a complete explainer. |
| `/mascot-arena` | Original interactive feature with rankings and related editorial paths. |
| About, author, publisher, contact, methodology, editorial, corrections, accessibility and legal routes | Publisher identity, accountability, sourcing and user-rights information. |

Daily snapshots remain short market records rather than substitutes for guides
or analysis. They are acceptable only when built from a live provider response,
time-stamped, source-labelled and explicit about what the data cannot prove.

## IMPROVE

| Route family | Required improvement |
| --- | --- |
| Older daily snapshots | Preserve as factual historical records. Do not mass rewrite them. New snapshots use the stronger context/impact/limitations template. |
| Automated news drafts held in `reviewing` | Add verifiable evidence, original context, impact, risk, counterpoint and what to monitor before publication. |

## NOINDEX

| Route family | Reason |
| --- | --- |
| `/search`, `/login`, `/admin`, `/watchlist` | Query, account or private utility pages. |
| `/newsletter`, `/status` | Subscription and operational utility pages, not editorial landing pages. |
| `/categories`, `/tags` | Informational placeholders until real filtered archives exist. |
| Non-core `/crypto/[symbol]` pages | Useful live tools remain accessible and followable, but stay out of search until they receive a complete editorial guide. |

NOINDEX pages are removed from the sitemap where they were previously listed.
Their links may remain usable by readers and crawlers may follow them.

## REMOVE

None. No route was proven useless and safe to delete. Preserving working URLs
avoids breaking navigation, bookmarks and external links.

## Automated publication boundary

The OpenAI-backed agent remains part of the editorial operation. Model output
does not publish by itself. The shared backend pipeline rejects missing sources,
near-duplicate titles, insufficient depth, repetitive prose, unsupported claims
and drafts lacking context, impact, risk, verification or a next-step dimension.
The full contract is in `OPENAI_EDITORIAL_QUALITY_CONTRACT.md`.
