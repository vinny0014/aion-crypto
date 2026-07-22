# Image Policy

Every published article must have a valid image; placeholders are never published.

Selection order: permitted official logo → permitted official image → system-generated chart → AION Crypto visual template (1200×630) → AI-generated image (Cost-Guard-gated) → human review.
Target mix: ~80% templates/charts, ~15% official images, ~5% AI.

Template set (1200×630): Bitcoin, Ethereum, Altcoins, DeFi, Security, Regulation, Exchanges, Breaking News, Analysis, Market Update.

Validation gate before publish: HTTP 200; JPEG/PNG/WebP; non-empty file; minimum dimensions and correct ratio; stored in controlled storage (Supabase Storage → R2-ready); retries with backoff and automatic fallback to the next tier. No copyrighted assets from the design mockup or third parties.
