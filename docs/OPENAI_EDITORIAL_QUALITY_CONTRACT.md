# OpenAI editorial quality contract

The OpenAI-backed editorial agent may prepare drafts, but the provider is not
the publication authority. Every generated draft enters the same database
pipeline as an operator-created draft and must pass deterministic verification,
quality, SEO and compliance gates before publication.

## Required draft contract

The agent must return source-bound English prose that contains:

1. a factual summary supported by the supplied public URLs;
2. the event or concept's practical significance;
3. relevant historical, protocol or market context;
4. explicit risks, limitations and counterarguments;
5. a clear boundary between confirmed fact, editorial analysis and hypothesis;
6. what a reader should verify or monitor next;
7. no quotation, number, cause or attribution absent from the evidence.

The caller must preserve the primary source name, source URL, additional source
URLs and source publication time. A draft without those fields is incomplete.

## Deterministic enforcement

`backend/app/pipeline/editorial.py` holds a draft when any of these conditions
is true:

- summary or body depth is insufficient;
- vocabulary or paragraph structure is repetitive;
- the identified source or public evidence URL is missing;
- context, impact, risk, verification or next-step dimensions are absent;
- the title is unsupported by the draft;
- the title is a near duplicate of a recent article;
- compliance language contains profit guarantees, trading commands or invented
  first-hand reporting.

The gate applies regardless of model name or provider. Changing the prompt or
model cannot bypass it.

## Publication boundary

Automatic publishing remains controlled by `AUTOMATIC_PUBLISH_ENABLED` and the
existing explicit campaign action. AdSense review state must never enable
publication or lower an editorial threshold. Daily market snapshots remain
deterministic, timestamped data records and do not replace original research,
guides or analysis.

No generated page is created merely to increase URL count. Rejected drafts stay
outside public article endpoints and the sitemap until corrected and approved.
