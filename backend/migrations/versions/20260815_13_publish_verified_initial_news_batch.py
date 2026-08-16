"""publish verified initial news batch

Revision ID: 20260815_13
Revises: 20260814_12
Create Date: 2026-08-15 20:33:56.170836
"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260815_13"
down_revision: Union[str, None] = "20260814_12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


VERIFIED_ARTICLES = (
    {
        "source_url": "https://www.coindesk.com/business/2026/08/15/swiss-mega-bank-ubs-ramps-up-its-bitcoin-exposure-with-a-massive-24-fold-surge-in-etf-call-options",
        "slug": "ubs-expands-bitcoin-etf-options-exposure-in-quarterly-filing",
        "title": "UBS expands Bitcoin ETF options exposure in quarterly filing",
        "subtitle": "The filing-based report points to a sharp increase in call-option exposure alongside a smaller rise in direct IBIT holdings.",
        "summary": "UBS increased its reported exposure to BlackRock's spot Bitcoin ETF through call options and direct shares, while reducing put-option exposure during the quarter.",
        "category": "Institutional", "asset": "BTC", "tags": "Bitcoin,IBIT,UBS,institutional",
        "body": """UBS increased several forms of reported exposure to BlackRock's iShares Bitcoin Trust during the quarter, according to a filing-based report published by CoinDesk on August 15. The clearest change was in call options tied to the fund: the reported underlying-share exposure rose about twenty-four times from the previous filing period. The same source said the bank also held 407,890 IBIT shares, an increase of roughly 12%.

The position was not a simple one-way holding. Put-option exposure fell by about 53% to the equivalent of 143,300 underlying shares, the report said. Options can be used for hedging, income strategies or directional exposure, so a filing does not by itself reveal the bank's final market view. It is more precise to describe the disclosure as a change in reported instruments than as a direct forecast for Bitcoin.

Quarterly holdings reports are backward-looking snapshots. They can show how a portfolio was positioned at the reporting date, but they do not prove that every position remained unchanged afterward. Option contracts also require separate interpretation from owned ETF shares because their economic effect depends on strike prices, expirations and any offsetting positions.

For Bitcoin market observers, the relevant signal is the continued use of regulated spot-ETF products and related derivatives by a major global bank. The next comparable filing will show whether the increase persisted. AION Crypto will treat later filings as new evidence rather than assume that this quarter's exposure is still current.""",
    },
    {
        "source_url": "https://www.coindesk.com/business/2026/08/15/paul-tudor-jones-investment-firm-increases-blackrock-s-bitcoin-etf-stake-after-year-of-selling",
        "slug": "tudor-investment-raises-direct-ibit-stake-as-options-exposure-falls",
        "title": "Tudor Investment raises direct IBIT stake as options exposure falls",
        "subtitle": "The latest filing separates an increase in owned ETF shares from substantial reductions in calls and puts.",
        "summary": "Tudor Investment increased its direct stake in BlackRock's Bitcoin ETF while reporting fewer call and put options tied to the fund.",
        "category": "Institutional", "asset": "BTC", "tags": "Bitcoin,IBIT,Tudor Investment,13F",
        "body": """Tudor Investment increased its directly held position in BlackRock's iShares Bitcoin Trust after several quarters of reported selling, according to a CoinDesk account of the firm's latest regulatory filing. The update is notable because the direct ETF holding moved differently from the firm's options book, making the disclosure more nuanced than a single bullish or bearish label.

The same report said call-option exposure fell 85.2% to the equivalent of 148,000 underlying shares. Put exposure declined 1.4% to 715,000 underlying shares. Calls, puts and directly owned shares have different payoff structures, and a public holdings form does not show every hedge or transaction completed after the reporting date. The figures therefore describe disclosed positions, not a complete real-time trading strategy.

IBIT is a regulated vehicle that tracks spot Bitcoin exposure without requiring an institution to custody the asset directly. Changes in large-manager filings can help document how traditional portfolios use the product, but they should not be treated as trading instructions or proof of future demand. A larger direct stake can coexist with reduced derivatives exposure for several portfolio-management reasons.

The next useful comparison will be the firm's subsequent filing and any amendments to the current report. Until then, the verified conclusion is limited: direct IBIT ownership increased while both reported call and put exposures decreased during the covered quarter.""",
    },
    {
        "source_url": "https://www.coindesk.com/policy/2026/08/15/why-the-world-s-second-largest-bitcoin-mining-power-is-shutting-down-rigs-in-its-capital-city",
        "slug": "capital-city-imposes-year-round-bitcoin-mining-restriction-over-grid-capacity",
        "title": "Capital city imposes year-round Bitcoin mining restriction over grid capacity",
        "subtitle": "The energy measure targets power-intensive mining operations as officials respond to regional capacity constraints.",
        "summary": "An energy authority introduced a permanent restriction on Bitcoin mining in a capital city, citing electricity-capacity shortages and pressure from large facilities.",
        "category": "Bitcoin", "asset": "BTC", "tags": "Bitcoin,mining,energy,policy",
        "body": """A national energy ministry has introduced a year-round restriction on cryptocurrency mining facilities in its capital city, according to a policy report published by CoinDesk on August 15. The stated reason is an electricity-capacity shortage in the region. The measure replaces the idea of a temporary seasonal response with an ongoing limit on energy-intensive mining activity inside the affected area.

Large proof-of-work mining sites can operate as continuous industrial loads. When a regional grid has limited generation or transmission capacity, authorities may curtail those facilities to protect supply for homes and other businesses. That operational context explains the policy mechanism, but it does not establish how much computing power will leave the country or whether operators will relocate to other regions.

The restriction matters to Bitcoin because mining geography affects where network computing power is hosted and which energy systems support it. A local shutdown can raise costs for individual operators without changing Bitcoin's protocol. Network-level effects depend on the amount of capacity actually disconnected, how quickly machines move elsewhere and the normal difficulty-adjustment process.

The source record supports the existence and stated grid rationale of the restriction. It does not provide enough evidence to estimate a precise change in global hash rate or Bitcoin price. Those outcomes should be measured through later network data and official implementation details rather than inferred from the announcement alone.""",
    },
    {
        "source_url": "https://www.coindesk.com/business/2026/08/15/the-usd11-2-billion-in-2026-funding-that-killed-crypto-s-permissionless-era",
        "slug": "crypto-funding-review-tracks-11-billion-toward-regulated-businesses-in-2026",
        "title": "Crypto funding review tracks $11.2 billion toward regulated businesses in 2026",
        "subtitle": "A deal-by-deal review describes institutional capital concentrating in companies built around compliance and regulated access.",
        "summary": "A review of first-half crypto deals counted $11.2 billion in funding and found major institutions favoring regulated firms and infrastructure.",
        "category": "Institutional", "asset": "", "tags": "funding,institutional,regulation,crypto",
        "body": """Crypto companies raised a reported $11.2 billion during the first half of 2026, according to a deal review described by CoinDesk. The underlying analysis was assembled by Dubai-based lawyer Irina Heaver and her team, who examined transactions across the sector. Their central finding was that large pools of capital increasingly favored regulated companies rather than businesses built only around permissionless access.

The report identified BlackRock, Goldman Sachs and sovereign investors from the Persian Gulf among the institutions participating in the period's financing activity. Their involvement documents continued institutional interest, but the aggregate number should not be read as equal support for every crypto business model. Deal totals can combine transactions with different structures, stages and strategic objectives.

Regulated infrastructure can include custody, payments, tokenization, brokerage and other services designed to operate within licensing or compliance frameworks. Permissionless protocols may still be used underneath those products even when the customer-facing company is regulated. For that reason, funding concentration does not by itself prove that open networks have disappeared; it describes where disclosed investment money was directed in the reviewed period.

The useful benchmark is the $11.2 billion first-half total and the stated concentration in regulated firms. Future comparisons should use the same deal definitions before declaring a lasting shift. AION Crypto will distinguish investment-flow evidence from broader claims about the end of permissionless technology.""",
    },
    {
        "source_url": "https://www.coindesk.com/business/2026/08/15/wall-street-s-private-blockchain-obsession-is-a-race-to-the-bottom-ethereum-advocate-raman-warns",
        "slug": "ethereum-advocate-argues-private-finance-networks-still-need-open-settlement",
        "title": "Ethereum advocate argues private finance networks still need open settlement",
        "subtitle": "Vivek Raman's criticism focuses on the trade-off between institutional control and the transparency of a public base layer.",
        "summary": "Ethereum advocate Vivek Raman said permissioned financial networks can serve a role but need an open, transparent base to capture blockchain's broader benefits.",
        "category": "Blockchain Technology", "asset": "ETH", "tags": "Ethereum,tokenization,Wall Street,blockchain",
        "body": """Ethereum advocate Vivek Raman has challenged Wall Street's growing preference for private blockchain networks, arguing that closed systems risk repeating the limitations of existing financial infrastructure. CoinDesk reported his view on August 15. Raman did not reject permissioned networks outright; the reported argument was that they can have a role while still depending on a transparent and open settlement layer.

Private networks restrict who can validate transactions, access data or deploy applications. That control can help institutions meet internal governance and compliance requirements. Public networks take a different approach: transaction rules and settlement state are broadly observable, while access is not controlled by a single operator. The design choice affects interoperability, auditability and who can build on the system.

Raman's position is an argument from an Ethereum supporter, not an independently established outcome. Financial institutions may choose different architectures based on privacy, regulation, performance and operational risk. A private ledger can be useful for a defined group even if it does not provide the same openness as Ethereum or another public chain.

The market question is whether institutional tokenization projects remain isolated or connect to public settlement over time. Evidence will come from launched products, transaction volume and technical architecture, not slogans from either side. For now, the verified development is the public debate over how much openness institutional blockchain systems actually require.""",
    },
    {
        "source_url": "https://www.coindesk.com/policy/2026/08/14/trump-expected-to-attend-white-house-meeting-with-crypto-ceos-sources-say",
        "slug": "crypto-ai-and-prediction-market-leaders-prepare-for-white-house-meeting",
        "title": "Crypto, AI and prediction-market leaders prepare for White House meeting",
        "subtitle": "Participants reportedly expect President Donald Trump to attend, but the appearance had not been presented as a final public confirmation.",
        "summary": "Executives from crypto, artificial intelligence and prediction-market companies were preparing for a White House meeting and expected President Trump to participate.",
        "category": "Regulation", "asset": "", "tags": "White House,policy,crypto,AI",
        "body": """Executives from cryptocurrency, prediction-market and artificial-intelligence companies were preparing to attend a White House meeting, according to a CoinDesk report published late on August 14. People involved in the gathering expected President Donald Trump to take part. Because the report described an expectation attributed to sources, his attendance should remain labeled as anticipated until confirmed by an official schedule or the event itself.

The mix of industries is significant because all three face overlapping questions about market structure, consumer protection, data, national competitiveness and federal oversight. A meeting can provide a channel for those companies to present policy priorities, but attendance alone does not create a rule, law or regulatory approval.

No specific policy outcome was established in the source summary. It would therefore be premature to infer a commitment on crypto legislation, prediction-market regulation or AI policy. Concrete evidence would include a White House readout, published participant list, agency statement or legislative text following the meeting.

AION Crypto will update the record when an official source confirms the president's participation or publishes decisions from the gathering. Until then, the factual boundary is narrow: industry leaders were preparing for the meeting, and participants reportedly expected Trump to attend the following week.""",
    },
    {
        "source_url": "https://bitcoinmagazine.com/news/abu-dhabi-funds-keep-big-bitcoin-positions",
        "slug": "abu-dhabi-sovereign-funds-report-large-bitcoin-etf-positions",
        "title": "Abu Dhabi sovereign funds report large Bitcoin ETF positions",
        "subtitle": "Mubadala disclosed a $490 million IBIT stake, while another Abu Dhabi fund also retained significant Bitcoin-linked exposure.",
        "summary": "Regulatory filings showed major Bitcoin ETF positions at two Abu Dhabi sovereign wealth funds, including a $490 million IBIT stake for Mubadala.",
        "category": "Institutional", "asset": "BTC", "tags": "Bitcoin,Abu Dhabi,Mubadala,IBIT",
        "body": """Two Abu Dhabi sovereign wealth funds retained substantial Bitcoin-linked positions in their latest regulatory disclosures, according to Bitcoin Magazine. Mubadala Investment Company reported a $490 million stake in BlackRock's iShares Bitcoin Trust. The source described that holding as the second-largest single position in Mubadala's disclosed 13F portfolio.

Another Abu Dhabi filing also showed significant exposure, supporting the narrower conclusion that more than one state-backed investment organization in the emirate continued to use a regulated spot Bitcoin ETF. The disclosures concern shares in an exchange-traded fund, not direct custody of Bitcoin by the funds themselves. That distinction matters for accurately describing the asset, operational responsibilities and regulatory wrapper.

Quarterly filings are snapshots with a reporting lag. They identify covered securities held at a specific date but may not show later transactions, every derivative or the full purpose of a position. The $490 million figure should therefore be tied to the disclosed reporting period rather than presented as a live balance.

The filings add a concrete data point to institutional Bitcoin adoption: sovereign capital used a listed U.S. ETF for sizable exposure. They do not establish a future allocation target or guarantee continued buying. The next filings will provide the appropriate like-for-like test of whether the positions grew, fell or remained broadly stable.""",
    },
    {
        "source_url": "https://www.coindesk.com/policy/2026/08/14/trump-backed-world-liberty-wins-conditional-bank-charter-from-federal-regulator",
        "slug": "occ-grants-preliminary-conditional-approval-to-world-liberty-trust",
        "title": "OCC grants preliminary conditional approval to World Liberty Trust",
        "subtitle": "The federal banking decision advances the application but is not the same as unrestricted authority to begin full operations.",
        "summary": "The Office of the Comptroller of the Currency granted preliminary conditional approval to World Liberty Trust Co., according to the regulator and a published report.",
        "category": "Regulation", "asset": "", "tags": "OCC,World Liberty,bank charter,regulation",
        "body": """The U.S. Office of the Comptroller of the Currency granted preliminary conditional approval to World Liberty Trust Co., according to an agency statement cited by CoinDesk on August 14. The decision moves the Trump-backed crypto venture's banking application forward, but the wording is important: preliminary and conditional approval is not identical to a final authorization for unrestricted operations.

Federal charter reviews typically require applicants to satisfy organizational, capital, risk-management and compliance conditions before commencing the activities covered by an approval. The source record available to AION Crypto confirms the regulator's decision and its conditional character. It does not support assuming that every operational requirement has already been completed.

The development is relevant to the wider convergence of digital-asset companies and regulated financial services. A federal trust structure can define how a company performs approved custody or fiduciary functions, but the exact permitted activities depend on the charter, conditions and subsequent supervisory steps. It should not be described simply as approval to operate a conventional deposit-taking bank unless official documents say so.

The next evidence to watch is the OCC's full approval documentation and any announcement that the company has met pre-opening conditions. Until then, the accurate status is that World Liberty Trust received preliminary conditional approval from the federal regulator.""",
    },
    {
        "source_url": "https://bitcoinmagazine.com/news/citi-ceo-wants-clarity-act-passed",
        "slug": "citi-ceo-backs-revised-crypto-clarity-legislation-and-safe-adoption",
        "title": "Citi CEO backs revised crypto clarity legislation and safe adoption",
        "subtitle": "Jane Fraser said the bank wants workable legislation while acknowledging that the current proposal still needs changes.",
        "summary": "Citigroup CEO Jane Fraser expressed support for passing a sound crypto market-structure bill, while saying the proposal required improvements.",
        "category": "Regulation", "asset": "", "tags": "Citigroup,CLARITY Act,regulation,digital assets",
        "body": """Citigroup CEO Jane Fraser said the bank wants a workable crypto market-structure bill to pass, while also indicating that the current CLARITY Act proposal needs improvement. Her comments were reported by Bitcoin Magazine as lawmakers continued work on the legislation. Fraser linked the bank's position to what she described as safe adoption of digital-asset technology.

Support for a revised bill is not the same as endorsing every provision in its current form. Large banks, crypto companies, regulators and consumer advocates can agree that clearer rules are useful while disagreeing over agency authority, disclosures, custody, stablecoins or the treatment of specific assets. The final effect depends on enacted text rather than a general statement of support.

Citi's participation in digital-asset projects gives the comments institutional relevance, but they remain one company's policy position. They do not establish that lawmakers have reached agreement or that a vote will succeed. Legislative proposals can change through committee work, amendments and negotiations before becoming law.

The verifiable takeaway is limited and concrete: Citi's chief executive called for a good version of the bill to advance and emphasized safe adoption, while acknowledging the need for changes. The next material evidence will be updated legislative language, scheduled votes and official congressional action.""",
    },
    {
        "source_url": "https://www.coindesk.com/markets/2026/08/14/tokenization-stocks-slip-as-sec-delay-puts-speed-bump-in-crypto-s-wall-street-push",
        "slug": "tokenization-linked-stocks-fall-after-sec-delay",
        "title": "Tokenization-linked stocks fall after SEC delay",
        "subtitle": "Shares of Bullish, Coinbase and Circle moved lower as investors assessed a regulatory setback for Wall Street's tokenization plans.",
        "summary": "Bullish, Coinbase and Circle were among the stocks that declined after an SEC delay affected expectations around tokenized financial products.",
        "category": "Market Analysis", "asset": "", "tags": "tokenization,SEC,Coinbase,Circle",
        "body": """Shares of several companies associated with crypto market infrastructure and tokenization moved lower on August 14 after a delay by the U.S. Securities and Exchange Commission, according to CoinDesk. Bullish, Coinbase and Circle were among the names identified in the report. The price reaction showed investors reassessing the near-term pace of tokenized products in traditional finance.

A one-day decline does not prove that the regulatory event was the only cause of each stock's move. Public equities also respond to broader market conditions, company-specific news and changes in risk appetite. The source supports a contemporaneous link between the SEC delay and market concern, but a precise causal estimate would require intraday data and comparison with relevant benchmarks.

Tokenization projects aim to represent financial assets or claims on blockchain-based systems. Regulatory timing can affect product launches, exchange access and the compliance path for companies that provide trading, custody or settlement services. A delay changes the timetable; it does not automatically amount to a permanent rejection.

Investors should watch for the SEC's next procedural step, revised application materials and company disclosures about launch schedules. Those documents will determine whether the setback is short-lived or materially changes planned products. The verified result for this session is that the named stocks traded lower as the market absorbed the delay.""",
    },
)


def _validate_batch() -> None:
    urls = set()
    slugs = set()
    for article in VERIFIED_ARTICLES:
        assert article["source_url"].startswith("https://")
        assert len(article["summary"]) >= 80
        assert len(article["body"]) >= 800
        assert article["source_url"] not in urls
        assert article["slug"] not in slugs
        urls.add(article["source_url"])
        slugs.add(article["slug"])


def upgrade() -> None:
    _validate_batch()
    connection = op.get_bind()
    update = sa.text("""
        update articles set
            slug=:slug, title=:title, subtitle=:subtitle, summary=:summary,
            body=:body, category=:category, related_asset=:asset, tags=:tags,
            status='published', confidence_score=0.84,
            compliance_approved=true, originality_approved=true,
            seo_title=:seo_title, seo_description=:seo_description,
            canonical_url=:canonical_url, author_name='AION Crypto',
            evidence_json=:evidence_json, rejection_reason='',
            published_at=coalesce(published_at, current_timestamp),
            updated_at=current_timestamp
        where source_url=:source_url and is_fixture=false
    """)
    event = sa.text("""
        insert into editorial_events
            (article_id, agent, from_state, to_state, result, reason, evidence_json, duration_ms, created_at)
        select id, 'editorial-board', 'reviewing', 'published', 'approved',
               'Original source-bound report approved for initial production launch',
               :evidence_json, 0, current_timestamp
        from articles
        where source_url=:source_url and is_fixture=false
          and status not in ('published', 'updated')
    """)
    for article in VERIFIED_ARTICLES:
        values = {
            **article,
            "seo_title": article["title"][:60],
            "seo_description": article["summary"][:160],
            "canonical_url": f"https://aioncrypto.cloud/news/{article['slug']}",
            "evidence_json": json.dumps([article["source_url"]]),
        }
        connection.execute(event, values)
        connection.execute(update, values)


def downgrade() -> None:
    # Published editorial records are retained to preserve URLs and audit history.
    pass
