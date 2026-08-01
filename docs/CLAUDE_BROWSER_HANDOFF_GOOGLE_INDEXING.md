# Claude Browser Handoff — Google Indexing

## Purpose

Validate the deployed AION Crypto identity in Google Search Console and request
recrawling of the homepage only after the corrected production HTML is live.

Official URL: `https://aioncrypto.cloud/`

Expected title:

`AION Crypto — Live Crypto Prices, News and Market Analysis`

Expected description:

`Track Bitcoin, Ethereum, XRP and leading cryptocurrencies with live prices, breaking news, market analysis and educational content.`

## Safety boundaries

- Do not edit code, DNS, Hostinger, Render, Supabase or environment variables.
- Do not merge a pull request or trigger a deployment.
- Do not submit fixtures, empty news pages or bulk URL lists for indexing.
- Do not activate AdSense, advertising, paid APIs or paid indexing services.
- Do not reveal account data, tokens, cookies or Search Console user details.

## Deployment prerequisite

Before using Search Console, open the published homepage and `robots.txt` in a
fresh browser session. Continue only if all of the following are true:

1. `https://aioncrypto.cloud/` returns HTTP 200.
2. The raw HTML contains the expected title and description above.
3. The canonical is `https://aioncrypto.cloud` or the equivalent trailing-slash URL.
4. The robots meta directive permits `index, follow`.
5. `https://aioncrypto.cloud/robots.txt` contains `Allow: /` and does not contain a global `Disallow: /` rule.
6. `https://aioncrypto.cloud/sitemap.xml` contains the homepage.
7. The homepage JSON-LD identifies `WebSite`, `Organization` and `WebPage` as AION Crypto.

If any prerequisite fails, stop before requesting indexing and report **DEPLOY
REQUIRED** with the exact mismatch. Do not attempt to fix production from the
browser.

## Search Console procedure

1. Open the verified domain property for `aioncrypto.cloud`.
2. Check **Security & Manual Actions** and record whether any issue exists.
3. Open **URL Inspection** and inspect exactly `https://aioncrypto.cloud/`.
4. Record the current coverage state, last crawl, declared canonical, Google-selected canonical and any blocking reason.
5. Run **Test Live URL**.
6. Confirm the live test says the URL is available to Google.
7. Inspect the rendered HTML and confirm the expected title, description, canonical and AION Crypto identity are present.
8. Open **Sitemaps** and confirm `https://aioncrypto.cloud/sitemap.xml` is submitted and readable. Submit or resubmit only this canonical sitemap when necessary.
9. Do not treat an empty `news-sitemap.xml` as an error when no original article is published.
10. Request indexing for the homepage once, only after the live test passes.
11. Do not request mass indexing and do not repeatedly submit the same URL.

## Evidence to record

- Search Console property used.
- Date and time in America/Sao_Paulo.
- Published URL test result.
- Current indexing state and last crawl.
- Declared and Google-selected canonicals.
- robots result.
- sitemap status and last read date.
- manual action and security status.
- confirmation that the single homepage indexing request was accepted.
- screenshots with sensitive account details excluded.

## Follow-up

Recheck the URL inspection status over the next several days. Google controls
the recrawl schedule and may rewrite titles or descriptions, so do not claim
the search result changed until a fresh crawl and the public result prove it.

## Required final report

Classify each item as `APPROVED`, `PENDING`, `BLOCKED` or `DEPLOY REQUIRED`, and
end with the exact next action. Do not promise rankings or a fixed update date.
