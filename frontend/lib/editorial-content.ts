export type CoinGuide = {
  name: string;
  symbol: string;
  purpose: string;
  overview: string;
  mechanics: string[];
  uses: string[];
  risks: string[];
  explainedSlug: string;
};

export const COIN_GUIDES: Record<string, CoinGuide> = {
  BTC: {
    name: "Bitcoin", symbol: "BTC", purpose: "Peer-to-peer digital money with a fixed maximum supply",
    overview: "Bitcoin is an open monetary network that lets participants transfer and hold BTC without relying on a central issuer. Its public ledger is maintained by proof-of-work miners and independently verified by nodes.",
    mechanics: ["Transactions are grouped into blocks and secured through proof of work.", "The issuance schedule reduces the block subsidy roughly every four years.", "The protocol caps total issuance at 21 million BTC."],
    uses: ["Long-term self-custody", "Cross-border settlement", "Collateral and treasury reserve strategies"],
    risks: ["Large price swings", "Irreversible transfers", "Custody and key-management failure", "Changing regulation and tax treatment"],
    explainedSlug: "bitcoin",
  },
  ETH: {
    name: "Ethereum", symbol: "ETH", purpose: "Programmable settlement network for applications and digital assets",
    overview: "Ethereum is a public blockchain where developers deploy smart contracts. ETH pays network fees, helps secure proof-of-stake consensus and is used throughout applications built on Ethereum and its scaling networks.",
    mechanics: ["Validators stake ETH to propose and attest to blocks.", "Smart contracts execute deterministic application rules.", "Layer-2 networks batch activity and settle results back to Ethereum."],
    uses: ["Network fees and staking", "Decentralized finance", "Token issuance and application settlement"],
    risks: ["Smart-contract defects", "Application and bridge exploits", "Fee volatility", "Complex staking and custody trade-offs"],
    explainedSlug: "ethereum",
  },
  XRP: {
    name: "XRP", symbol: "XRP", purpose: "Native asset of the XRP Ledger for fast value transfer",
    overview: "XRP is the native asset of the XRP Ledger, a public network designed for rapid settlement. The ledger uses a validator-based consensus process rather than proof-of-work mining.",
    mechanics: ["Independent validators agree on the order and outcome of transactions.", "A small amount of XRP is destroyed as a transaction cost.", "The ledger includes native exchange and issued-asset functions."],
    uses: ["Value transfer", "Liquidity between currencies and assets", "Fees and reserves on the XRP Ledger"],
    risks: ["Validator and ecosystem concentration concerns", "Regulatory uncertainty", "Market volatility", "Dependence on adoption and liquidity"],
    explainedSlug: "xrp",
  },
  SOL: {
    name: "Solana", symbol: "SOL", purpose: "High-throughput public blockchain for applications, payments and digital assets",
    overview: "Solana is a public blockchain designed to process transactions quickly and at comparatively low fees. SOL is used for transaction fees, staking and participation in applications built on the network.",
    mechanics: ["Validators process transactions and help secure the network through delegated proof of stake.", "The network uses a timestamping design called proof of history to help order activity.", "Applications use smart contracts, commonly called programs, to run on-chain rules."],
    uses: ["Transaction fees and staking", "On-chain trading and payments", "Digital collectibles and consumer applications"],
    risks: ["Network congestion or outages", "Smart-contract and wallet exploits", "Validator concentration concerns", "Rapidly changing application and token risks"],
    explainedSlug: "solana",
  },
  BNB: {
    name: "BNB", symbol: "BNB", purpose: "Native utility asset used across the BNB Chain ecosystem",
    overview: "BNB is the native asset used for network fees and staking on BNB Chain. It is also used in products and applications connected to the wider BNB Chain ecosystem, each with its own terms, custody model and risks.",
    mechanics: ["Validators secure BNB Smart Chain through a delegated staking model.", "BNB is used to pay transaction fees and interact with applications.", "Token supply mechanics can include scheduled burns under published network or ecosystem rules."],
    uses: ["Network fees", "Staking and validator delegation", "Access to applications built on BNB Chain"],
    risks: ["Ecosystem and validator concentration", "Smart-contract and bridge failures", "Regulatory and platform dependence", "Price and liquidity volatility"],
    explainedSlug: "bnb",
  },
  ADA: {
    name: "Cardano", symbol: "ADA", purpose: "Native asset of the Cardano proof-of-stake network",
    overview: "ADA is the native asset of Cardano, a public proof-of-stake blockchain. It is used for transaction fees, staking and participation in applications that use Cardano's settlement layer.",
    mechanics: ["Stake pools participate in the Ouroboros proof-of-stake protocol.", "Holders can delegate ADA without transferring custody to a pool.", "Smart contracts use Cardano's extended UTXO accounting model."],
    uses: ["Network fees", "Stake delegation", "Transfers and application settlement"],
    risks: ["Adoption and liquidity uncertainty", "Application and smart-contract risk", "Staking-provider risk", "Market and regulatory volatility"],
    explainedSlug: "cardano",
  },
};

export type ExplainedGuide = {
  slug: string;
  title: string;
  description: string;
  answer: string;
  sections: Array<{ heading: string; paragraphs: string[]; points?: string[] }>;
  relatedCoins?: string[];
  relatedGuides?: string[];
  reviewedAt?: string;
  sources?: Array<{ label: string; url: string }>;
  faq?: Array<{ question: string; answer: string }>;
};

export const EXPLAINED_GUIDES: ExplainedGuide[] = [
  {
    slug: "bitcoin", title: "What Is Bitcoin?", description: "A plain-language guide to Bitcoin, BTC, mining, scarcity, custody and the principal risks.",
    answer: "Bitcoin is a public payment and settlement network with no central issuer. BTC is its native digital asset, and the protocol limits total issuance to 21 million units.",
    sections: [
      { heading: "How Bitcoin works", paragraphs: ["Users sign transactions with private keys. Nodes verify the protocol rules, while miners use proof of work to order valid transactions into blocks. This separation lets anyone audit the ledger without asking a company for permission."], points: ["Public, auditable transaction history", "Proof-of-work security", "Predictable issuance schedule"] },
      { heading: "Why people use BTC", paragraphs: ["People use BTC for self-custody, settlement and as a scarce digital asset. Those uses do not make its price stable or guarantee future demand."], points: ["Transfers can be global and final", "Ownership can be held without an intermediary", "Markets trade continuously and can move sharply"] },
      { heading: "What can go wrong", paragraphs: ["Bitcoin transactions are normally irreversible. Losing a recovery phrase, sending to the wrong address or trusting a fraudulent service can cause permanent loss. Regulation, taxes, fees and market liquidity also vary by jurisdiction and time."] },
    ], relatedCoins: ["BTC"], reviewedAt: "2026-08-31", relatedGuides: ["bitcoin-halving", "bitcoin-etf", "crypto-wallet"],
    sources: [{ label: "Bitcoin: A Peer-to-Peer Electronic Cash System", url: "https://bitcoin.org/bitcoin.pdf" }, { label: "Bitcoin Developer Guide", url: "https://developer.bitcoin.org/devguide/" }],
    faq: [{ question: "Is Bitcoin controlled by one company?", answer: "No. Bitcoin is an open protocol implemented by independent software projects, miners, nodes, wallets and users. No single participant can unilaterally change the rules accepted by every node." }],
  },
  {
    slug: "ethereum", title: "What Is Ethereum?", description: "Understand Ethereum, ETH, smart contracts, proof of stake, layer-2 networks and common risks.",
    answer: "Ethereum is a programmable public blockchain. ETH is used to pay fees, secure proof-of-stake consensus and interact with applications on Ethereum and related scaling networks.",
    sections: [
      { heading: "Smart contracts and applications", paragraphs: ["Smart contracts are programs stored and executed on the network. They can coordinate tokens, exchanges, lending markets and other applications, but code execution does not guarantee that an application is safe or economically sound."] },
      { heading: "Proof of stake and scaling", paragraphs: ["Validators lock ETH to participate in consensus. Layer-2 networks process activity away from Ethereum's base layer and submit proofs or transaction data back for settlement."], points: ["ETH pays transaction fees", "Validators help secure the chain", "Layer-2 designs have distinct trust and withdrawal assumptions"] },
      { heading: "Principal risks", paragraphs: ["Users face price volatility, smart-contract bugs, phishing, bridge failures, application governance risk and mistakes when moving assets between networks."] },
    ], relatedCoins: ["ETH"], reviewedAt: "2026-08-31", relatedGuides: ["staking", "defi", "smart-contract-risk"],
    sources: [{ label: "Ethereum documentation", url: "https://ethereum.org/en/developers/docs/" }, { label: "Ethereum proof-of-stake documentation", url: "https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/" }],
    faq: [{ question: "Are Ethereum and ETH the same thing?", answer: "Ethereum is the network and protocol. ETH is the network's native asset, used for fees, staking and application activity." }],
  },
  {
    slug: "xrp", title: "What Is XRP?", description: "A factual introduction to XRP, the XRP Ledger, consensus, settlement uses and risks.",
    answer: "XRP is the native asset of the XRP Ledger, a public ledger designed for fast settlement. It is not mined through proof of work.",
    sections: [
      { heading: "How the XRP Ledger reaches agreement", paragraphs: ["Validators exchange proposals and converge on a set of valid transactions. This model differs from both Bitcoin mining and Ethereum proof of stake."], points: ["Short settlement intervals", "Native transaction fees paid in XRP", "Built-in support for issued assets and exchange"] },
      { heading: "How XRP may be used", paragraphs: ["XRP can be transferred directly, used for ledger fees and reserves, or serve as a bridge asset where adequate liquidity exists. A possible use is not evidence of guaranteed adoption."] },
      { heading: "Principal risks", paragraphs: ["XRP remains volatile and exposed to regulatory, liquidity, custody and ecosystem risks. Users should distinguish the public ledger, the XRP asset and companies that build services around them."] },
    ], relatedCoins: ["XRP"], reviewedAt: "2026-08-31", relatedGuides: ["evaluate-cryptocurrency", "market-cap-volume-liquidity", "portfolio-risk"],
    sources: [{ label: "XRP Ledger concepts", url: "https://xrpl.org/docs/concepts" }, { label: "XRP Ledger consensus", url: "https://xrpl.org/docs/concepts/consensus-protocol" }],
    faq: [{ question: "Is XRP mined?", answer: "No. The XRP Ledger does not use proof-of-work mining. Its transaction ordering and validation process uses a consensus protocol among validators." }],
  },
  {
    slug: "solana", title: "What Is Solana?", description: "Learn how Solana works, what SOL is used for, how staking works and the main risks to consider.",
    answer: "Solana is a public blockchain built for applications that need frequent, low-cost transactions. SOL is used to pay network fees, stake with validators and interact with applications on the network.",
    sections: [
      { heading: "How Solana processes activity", paragraphs: ["Solana combines a proof-of-stake validator network with a method for recording transaction order called proof of history. This design aims to let validators process activity efficiently, but transaction throughput and fees can still change with demand and network conditions."], points: ["Validators propose and confirm blocks", "SOL pays transaction fees", "Programs provide smart-contract functionality"] },
      { heading: "Staking and applications", paragraphs: ["SOL holders can delegate to validators to participate in staking. Delegation does not remove the need to assess validator reliability, wallet safety or the risks of applications using the network."], points: ["Delegated staking", "On-chain exchanges and payments", "Consumer and creator applications"] },
      { heading: "Principal risks", paragraphs: ["SOL is volatile. Users can also face network disruption, malicious signing requests, smart-contract bugs, phishing and losses from bridges or application failures. A low transaction fee does not make a transaction reversible."] },
    ], relatedCoins: ["SOL"], reviewedAt: "2026-08-31", relatedGuides: ["staking", "smart-contract-risk", "crypto-scams"],
    sources: [{ label: "Solana documentation", url: "https://solana.com/docs" }, { label: "Solana staking documentation", url: "https://solana.com/docs/economics/staking" }],
    faq: [{ question: "Does a low network fee remove investment risk?", answer: "No. Transaction cost is only one property. SOL price, validators, wallets, applications, smart contracts and liquidity each introduce separate risks." }],
  },
  {
    slug: "bnb", title: "What Is BNB?", description: "A factual guide to BNB, BNB Chain, network fees, staking, ecosystem use and key risks.",
    answer: "BNB is the native utility asset used for fees and staking on BNB Chain. Its role in other products depends on the specific service, application or platform involved.",
    sections: [
      { heading: "BNB and BNB Chain", paragraphs: ["BNB is used to pay transaction fees on BNB Smart Chain and can be delegated for staking. BNB Chain supports smart-contract applications, so interacting with the network may involve both the BNB asset and independent third-party protocols."], points: ["Transaction-fee utility", "Delegated validator model", "Smart-contract application ecosystem"] },
      { heading: "What ownership does and does not mean", paragraphs: ["Holding BNB does not create a claim on a company, an exchange or the performance of applications. Users should distinguish the public blockchain, the token and services that may choose to use the asset."], points: ["Network utility differs from equity", "Application terms can differ", "Custody choices affect control"] },
      { heading: "Principal risks", paragraphs: ["BNB is exposed to broad crypto-market volatility as well as ecosystem concentration, regulation, validator incentives and smart-contract or bridge failures. Tokens sent through a wrong network or to a malicious contract may be unrecoverable."] },
    ], relatedCoins: ["BNB"], reviewedAt: "2026-08-31", relatedGuides: ["defi", "smart-contract-risk", "bridge-risk"],
    sources: [{ label: "BNB Chain documentation", url: "https://docs.bnbchain.org/" }, { label: "BNB Smart Chain overview", url: "https://docs.bnbchain.org/bnb-smart-chain/overview/" }],
    faq: [{ question: "Does holding BNB mean owning part of an exchange?", answer: "No. A token's network or service utility is not the same as company equity. Product terms and legal rights must be evaluated separately." }],
  },
  {
    slug: "cardano", title: "What Is Cardano?", description: "Understand Cardano, ADA, stake pools, the proof-of-stake model and the main risks of using the network.",
    answer: "Cardano is a public proof-of-stake blockchain. ADA is used for transaction fees, stake delegation and transfers or applications that settle on the network.",
    sections: [
      { heading: "How Cardano works", paragraphs: ["Cardano uses a proof-of-stake protocol called Ouroboros. Stake pools participate in block production, while ADA holders may delegate stake to a pool. Delegation is not a promise of return and does not eliminate market, service or protocol risk."], points: ["Proof-of-stake consensus", "Stake-pool delegation", "Extended UTXO accounting model"] },
      { heading: "ADA, staking and applications", paragraphs: ["ADA is the network's native asset. It is used to pay fees and can be delegated to a stake pool. Applications on Cardano may introduce their own token, smart-contract and liquidity risks beyond the base network."], points: ["Transaction fees", "Delegated staking", "Transfers and on-chain applications"] },
      { heading: "Principal risks", paragraphs: ["ADA can move sharply in price. Other risks include application exploits, phishing, custody errors, changes in regulation, liquidity constraints and the possibility that expected adoption does not materialize."] },
    ], relatedCoins: ["ADA"], reviewedAt: "2026-08-31", relatedGuides: ["staking", "smart-contract-risk", "evaluate-cryptocurrency"],
    sources: [{ label: "Cardano developer documentation", url: "https://developers.cardano.org/docs/" }, { label: "Ouroboros overview", url: "https://docs.cardano.org/about-cardano/learn/ouroboros-overview/" }],
    faq: [{ question: "Does staking ADA guarantee a return?", answer: "No. Rewards, pool performance, protocol rules, service availability, taxes and ADA's market price can all affect the outcome." }],
  },
  {
    slug: "crypto-wallet", title: "What Is a Crypto Wallet?", description: "Learn what crypto wallets store, how private keys work and how to reduce custody mistakes.",
    answer: "A crypto wallet manages the keys used to authorize blockchain transactions. The assets remain recorded on a blockchain; the wallet controls the credentials that can move them.",
    sections: [
      { heading: "Custodial and self-custody wallets", paragraphs: ["A custodial service controls keys on a user's behalf. A self-custody wallet gives the user direct control and direct responsibility. Neither model removes risk; they distribute it differently."] },
      { heading: "Recovery phrases and signing", paragraphs: ["A recovery phrase can recreate the keys to a wallet. Anyone who obtains it can usually control the assets. Legitimate support staff should never need the phrase."], points: ["Keep recovery material offline", "Verify the destination and network", "Read every signing request before approval", "Test unfamiliar transfers with a small amount"] },
      { heading: "Common failure modes", paragraphs: ["Phishing pages, malicious approvals, address poisoning, device compromise, unsupported networks and lost recovery material are frequent causes of loss. Blockchain finality usually prevents chargebacks."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["hot-wallet-vs-cold-wallet", "seed-phrase-security", "crypto-scams"],
    sources: [{ label: "Bitcoin.org: securing your wallet", url: "https://bitcoin.org/en/secure-your-wallet" }, { label: "CISA phishing guidance", url: "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing" }],
    faq: [{ question: "Does a wallet store coins inside the device?", answer: "Usually no. The blockchain records the assets. A wallet stores or controls the credentials used to authorize transactions involving them." }],
  },
  {
    slug: "bitcoin-etf", title: "What Is a Bitcoin ETF?", description: "Understand how spot Bitcoin ETFs provide price exposure, and how they differ from owning BTC directly.",
    answer: "A spot Bitcoin exchange-traded fund is a regulated investment product whose shares are designed to reflect the value of bitcoin held by the fund, less fees and operating effects.",
    sections: [
      { heading: "ETF shares versus BTC", paragraphs: ["ETF investors own fund shares, not bitcoin they can transfer on-chain. The fund and its service providers handle custody, creation and redemption, while shares trade through brokerage accounts during market hours."] },
      { heading: "Why investors use the structure", paragraphs: ["The ETF format may fit existing brokerage, reporting and retirement-account workflows. It avoids direct private-key management but introduces fund, custodian, tracking and market-structure dependencies."], points: ["Brokerage access", "Published fees and disclosures", "No direct on-chain use or self-custody"] },
      { heading: "Risks and due diligence", paragraphs: ["Bitcoin price risk remains. Investors should read the fund prospectus and check fees, spreads, liquidity, custody arrangements, tax treatment and jurisdiction-specific rules before making a decision."] },
    ], relatedCoins: ["BTC"], reviewedAt: "2026-08-31", relatedGuides: ["bitcoin", "portfolio-risk", "market-cap-volume-liquidity"],
    sources: [{ label: "SEC investor bulletin on exchange-traded products", url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/exchange-traded-funds-etfs" }, { label: "SEC filings search", url: "https://www.sec.gov/edgar/search/" }],
    faq: [{ question: "Can a Bitcoin ETF share be withdrawn to a personal wallet?", answer: "Ordinary fund investors hold a security through a brokerage account, not transferable on-chain BTC. The fund's authorized structure handles custody and share creation or redemption." }],
  },
  {
    slug: "evaluate-cryptocurrency", title: "How to Evaluate a Cryptocurrency", description: "A research framework for checking purpose, supply, security, governance, liquidity and evidence before risking money.",
    answer: "A cryptocurrency should be evaluated as a network, an asset and an operating ecosystem. Price performance alone does not establish utility, security, liquidity or a sustainable reason for demand.",
    sections: [
      { heading: "Start with the problem and the users", paragraphs: ["Write down the specific problem the network claims to solve, who uses it and why a blockchain is necessary. Separate current, measurable use from a roadmap. A working product, public documentation and independently observable activity are stronger evidence than slogans or follower counts.", "Check whether the token is actually required. Some projects have useful software but no clear reason for the token to capture value. Ownership of a token normally does not create the rights attached to equity, debt or a bank deposit."], points: ["Identify the user and the job being done", "Separate a live product from planned features", "Explain why the token is necessary"] },
      { heading: "Inspect supply and incentives", paragraphs: ["Review circulating supply, maximum or uncapped issuance, unlock schedules, treasury allocations and rewards paid to validators or liquidity providers. A low unit price is not evidence that an asset is cheap; supply and market value must be considered together.", "Large insider allocations or near-term unlocks can change available supply. Published tokenomics still require verification against on-chain contracts, governance records and current disclosures."] },
      { heading: "Evaluate security and control", paragraphs: ["Identify the consensus model, validator distribution, upgrade process, administrative keys, bridge dependencies and audit history. An audit reduces one category of uncertainty but is not a warranty. Review how the project responds to incidents and whether users can verify software and contracts."] },
      { heading: "Test the market, not just the story", paragraphs: ["Compare trading volume across reputable venues, order-book depth, spreads and the amount that can be traded without moving the price materially. Thin liquidity can make displayed prices difficult to realize. Also check whether reported activity is concentrated on one venue or pair."] },
      { heading: "Write a risk case before a price case", paragraphs: ["List what would prove the thesis wrong: a security failure, loss of developers, weak adoption, regulatory restrictions, concentrated governance or declining liquidity. Decide exposure and exit rules before volatility creates pressure. This framework supports research; it does not identify a guaranteed winner."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["market-cap-volume-liquidity", "portfolio-risk", "fomo"],
    sources: [{ label: "SEC: Crypto Asset Securities Investor Alert", url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/crypto-asset-securities-investor-alert" }, { label: "CFTC customer advisories", url: "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/index.htm" }],
    faq: [{ question: "Does a low token price mean a cryptocurrency is undervalued?", answer: "No. Unit price without supply, liquidity, rights and demand says very little. Market capitalization and fully diluted supply provide additional context but still do not establish fair value." }],
  },
  {
    slug: "stablecoins", title: "How Stablecoins Work", description: "Understand reserves, redemption, collateral, pegs and the risks that can make a stablecoin trade away from its target.",
    answer: "A stablecoin is a crypto asset designed to track a reference value, commonly a currency. The mechanism can rely on issuer reserves, overcollateralized positions or algorithmic incentives, each with different failure modes.",
    sections: [
      { heading: "Three questions define the structure", paragraphs: ["Ask who issues the token, what supports its value and how a holder can redeem it. A reserve-backed token depends on the issuer, custodians, reserve assets and redemption rules. A crypto-collateralized token depends on smart contracts, collateral prices and liquidation processes."], points: ["Who controls issuance?", "What assets or rules support the peg?", "Who can redeem, when and at what cost?"] },
      { heading: "A peg is a target, not a guarantee", paragraphs: ["Secondary-market prices can move away from the target when liquidity falls or confidence changes. Arbitrage may help restore the peg only when participants can access redemption and accept the issuer, market and settlement risks."] },
      { heading: "Read reserve evidence carefully", paragraphs: ["Reserve reports differ in scope, timing and assurance. Check which assets are held, their maturity and liquidity, which entity owns them, whether liabilities are covered and whether the report is an audit, an attestation or a management statement."] },
      { heading: "Operational and legal risks remain", paragraphs: ["Freezing powers, sanctions controls, banking interruptions, smart-contract defects, bridge failures and changing regulation can affect access even when the market price appears stable. Stable relative to a currency does not mean safe from custody or counterparty loss."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["defi", "smart-contract-risk", "portfolio-risk"],
    sources: [{ label: "BIS: Stablecoins versus tokenised deposits", url: "https://www.bis.org/publ/bisbull73.htm" }, { label: "IMF: Regulating the Crypto Ecosystem", url: "https://www.imf.org/en/Publications/fintech-notes/Issues/2023/09/26/Regulating-the-Crypto-Ecosystem-The-Case-of-Stablecoins-and-Arrangements-538778" }],
    faq: [{ question: "Is one stablecoin equivalent to cash in a bank account?", answer: "No. Legal rights, deposit insurance, reserves, redemption access and counterparties differ. A stablecoin must be evaluated under its own terms and jurisdiction." }],
  },
  {
    slug: "staking", title: "Crypto Staking: Rewards and Risks", description: "Learn what proof-of-stake participation does, where rewards come from and why advertised yields are not guaranteed returns.",
    answer: "Staking commits or delegates eligible crypto assets to a proof-of-stake process. Rewards compensate participation under protocol rules, while price, validator, custody, slashing and liquidity risks remain.",
    sections: [
      { heading: "What staking contributes", paragraphs: ["Proof-of-stake networks select validators under protocol-specific rules to propose or attest to blocks. A holder may operate infrastructure directly or delegate to a validator. Delegation changes operational responsibility but does not remove network or market risk."] },
      { heading: "Where rewards come from", paragraphs: ["Rewards may come from new issuance, transaction fees or both. Compare the nominal reward with supply inflation and fees. A token balance can grow while its purchasing value falls."] },
      { heading: "Native, liquid and custodial staking differ", paragraphs: ["Native delegation follows the base protocol. Custodial programs add a service provider. Liquid-staking tokens add smart-contract, pricing and redemption dependencies. Do not treat these arrangements as interchangeable because they carry different claims and failure paths."] },
      { heading: "Check lockups and penalties", paragraphs: ["Unbonding periods can prevent immediate sale. Validator downtime or misconduct can reduce rewards or trigger penalties on some networks. Review commission, validator concentration, withdrawal rules and tax treatment before participating."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["ethereum", "cardano", "portfolio-risk"],
    sources: [{ label: "Ethereum proof-of-stake documentation", url: "https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/" }, { label: "Cardano staking documentation", url: "https://docs.cardano.org/about-cardano/learn/delegation/" }],
    faq: [{ question: "Can staking produce a loss even when rewards are paid?", answer: "Yes. Token price declines, service fees, slashing, smart-contract failures, custody loss, inflation and inability to withdraw can outweigh rewards." }],
  },
  {
    slug: "defi", title: "DeFi for Beginners", description: "A practical map of decentralized exchanges, lending, collateral, liquidity pools and the risks behind permissionless finance.",
    answer: "Decentralized finance uses smart contracts to provide trading, lending and other financial functions on public networks. Open access does not remove code, economic, governance, oracle or user-error risk.",
    sections: [
      { heading: "Applications are composed from contracts", paragraphs: ["A DeFi interface usually connects a wallet to smart contracts. The website is not the complete system: contracts, oracles, tokens, governance and underlying networks may each be operated or upgraded differently."] },
      { heading: "Trading and liquidity pools", paragraphs: ["Automated market makers quote prices from pooled assets and formulas. Liquidity providers earn fees but can experience inventory changes, impermanent loss, token depreciation and contract failure. A displayed annual rate can change quickly."] },
      { heading: "Borrowing requires collateral and monitoring", paragraphs: ["Many lending protocols require collateral worth more than the loan. If collateral value falls past a threshold, automated liquidation can occur. Network congestion or oracle problems can make it difficult to act during volatile periods."] },
      { heading: "Build a dependency map", paragraphs: ["Before depositing, list the chain, wallet, token issuer, bridge, oracle, contracts, administrators and front end involved. Check audits, upgrade keys, incident history and withdrawal conditions. A failure in one layer can affect the whole position."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["stablecoins", "smart-contract-risk", "bridge-risk"],
    sources: [{ label: "Ethereum decentralized finance overview", url: "https://ethereum.org/en/defi/" }, { label: "BIS: DeFi risks and decentralisation illusion", url: "https://www.bis.org/publ/qtrpdf/r_qt2112b.htm" }],
    faq: [{ question: "Does a DeFi protocol remove all intermediaries?", answer: "Not necessarily. Interfaces, developers, governance, oracles, bridges, stablecoin issuers and administrators can remain important dependencies even when settlement uses smart contracts." }],
  },
  {
    slug: "hot-wallet-vs-cold-wallet", title: "Hot Wallet vs Cold Wallet", description: "Compare online convenience with offline key storage and build a custody setup around the transactions you actually make.",
    answer: "A hot wallet uses keys on an internet-connected device, while cold storage keeps signing keys offline. The safer choice depends on transaction frequency, recovery planning and the threats the user can manage reliably.",
    sections: [
      { heading: "Hot wallets favor access", paragraphs: ["Mobile and browser wallets make frequent transactions practical, but the device, extensions, clipboard and signing flow are exposed to online threats. Limit the amount available for routine activity and review permissions regularly."] },
      { heading: "Cold storage changes the threat model", paragraphs: ["Hardware wallets and offline signing can keep keys away from an internet-connected computer. They do not protect against approving a malicious transaction, using a compromised recovery backup or sending to the wrong address."] },
      { heading: "Separate spending from reserves", paragraphs: ["Many users reduce risk by keeping a small operational wallet and a separate long-term wallet. Use distinct recovery backups, verify addresses on the signing device and test recovery before relying on the setup."] },
      { heading: "Recovery matters more than the label", paragraphs: ["A sophisticated device is not useful if heirs cannot recover it or if the seed phrase is photographed and uploaded. Document a secure recovery process without putting the secret itself in the instructions."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["crypto-wallet", "seed-phrase-security", "crypto-scams"],
    sources: [{ label: "Bitcoin.org: securing your wallet", url: "https://bitcoin.org/en/secure-your-wallet" }, { label: "CISA: secure accounts and devices", url: "https://www.cisa.gov/secure-our-world" }],
    faq: [{ question: "Is a hardware wallet automatically safe?", answer: "No. It reduces exposure of private keys, but supply-chain tampering, weak backups, phishing and malicious signing requests can still cause loss." }],
  },
  {
    slug: "seed-phrase-security", title: "How to Protect a Seed Phrase", description: "A custody checklist for creating, storing, testing and recovering wallet backup material without exposing it online.",
    answer: "A seed or recovery phrase can recreate control of a compatible wallet. Anyone who obtains it may be able to move the assets, so it must be protected from theft, loss and accidental disclosure.",
    sections: [
      { heading: "Treat the phrase as the asset", paragraphs: ["Do not type a seed phrase into support chats, forms, cloud notes or websites. Wallet recovery should occur only in a trusted, compatible wallet flow that the user intentionally initiated."] },
      { heading: "Protect against more than hackers", paragraphs: ["Fire, water, disposal, household access and forgotten locations are common risks. Choose backup media and locations that match the value protected. Avoid a single point of failure while preventing uncontrolled copies."] },
      { heading: "Verify the recovery process", paragraphs: ["A backup that has never been checked may contain a transcription or ordering error. Use a vendor-supported verification process or a controlled recovery test before funding the wallet. Never expose the phrase during testing."] },
      { heading: "Plan for incapacity", paragraphs: ["Trusted successors need enough information to locate and use the recovery process, but the plan should not give one unauthorized person immediate access. Legal and inheritance arrangements vary by jurisdiction and may require professional advice."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["crypto-wallet", "hot-wallet-vs-cold-wallet", "crypto-scams"],
    sources: [{ label: "Bitcoin.org wallet security guidance", url: "https://bitcoin.org/en/secure-your-wallet" }, { label: "CISA phishing guidance", url: "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing" }],
    faq: [{ question: "Will legitimate wallet support ask for a seed phrase?", answer: "No legitimate support interaction should require the phrase. A request for it is a strong indicator of theft or phishing." }],
  },
  {
    slug: "crypto-scams", title: "How to Identify Crypto Scams", description: "Recognize impersonation, fake returns, malicious wallet approvals, recovery scams and pressure tactics before funds leave your control.",
    answer: "Crypto scams often combine urgency, impersonation and irreversible payment. The strongest defense is to verify identity and destination independently before sending funds or signing a transaction.",
    sections: [
      { heading: "Guaranteed returns are a warning", paragraphs: ["Promises of fixed high profit, risk-free bots or secret access conflict with how volatile markets work. Screenshots, dashboards and small early withdrawals can be fabricated to encourage a larger deposit."] },
      { heading: "Verify through a second channel", paragraphs: ["Do not trust a phone number, link or account supplied by the person making the request. Navigate to the official site independently, compare domain spelling and confirm unusual instructions through a known contact method."] },
      { heading: "A signature can transfer control", paragraphs: ["A wallet signature may approve token spending, authorize an order or change account permissions. Read the transaction on the wallet and block explorer. Reject requests that are unclear or unrelated to the intended action."] },
      { heading: "Recovery scammers target previous victims", paragraphs: ["A person claiming to recover lost crypto for an advance fee may be conducting a second fraud. Preserve transaction hashes and communications, then report through appropriate law-enforcement and platform channels. Do not send another payment to unlock funds."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["seed-phrase-security", "hot-wallet-vs-cold-wallet", "fomo"],
    sources: [{ label: "FTC: What to know about cryptocurrency scams", url: "https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams" }, { label: "FBI IC3 complaint center", url: "https://www.ic3.gov/" }],
    faq: [{ question: "Can a transaction hash prove an investment platform is legitimate?", answer: "No. A transaction hash proves that a blockchain transaction occurred. It does not validate a company's identity, solvency, promises or the ability to withdraw." }],
  },
  {
    slug: "bitcoin-halving", title: "What Is the Bitcoin Halving?", description: "Understand the block-subsidy schedule, miner incentives, issuance and why a halving does not guarantee a price increase.",
    answer: "A Bitcoin halving reduces the block subsidy paid to miners under the protocol's issuance schedule. It changes new supply, not the amount of BTC already circulating or the direction of market price.",
    sections: [
      { heading: "The subsidy declines by protocol rule", paragraphs: ["Miners can receive a block subsidy and transaction fees. At programmed block intervals, the subsidy is cut in half. Nodes independently enforce the valid subsidy amount when checking blocks."] },
      { heading: "Issuance is only one market variable", paragraphs: ["A lower flow of newly issued BTC may affect miner revenue and available sell pressure, but price also reflects demand, liquidity, leverage, macroeconomic conditions, regulation and expectations already embedded in the market."] },
      { heading: "Miner economics adjust", paragraphs: ["After a subsidy reduction, less efficient miners may face pressure if price and fees do not compensate. Difficulty adjustments and changes in equipment, energy costs and fee revenue influence how the network adapts."] },
      { heading: "Avoid calendar certainty", paragraphs: ["Halving dates are estimates based on future block production. More importantly, historical cycles are a small sample and do not create a guaranteed timing model for future returns."] },
    ], relatedCoins: ["BTC"], reviewedAt: "2026-08-31", relatedGuides: ["bitcoin", "bitcoin-dominance", "portfolio-risk"],
    sources: [{ label: "Bitcoin Developer Guide: block chain", url: "https://developer.bitcoin.org/devguide/block_chain.html" }, { label: "Bitcoin whitepaper", url: "https://bitcoin.org/bitcoin.pdf" }],
    faq: [{ question: "Does the halving cut every holder's bitcoin balance?", answer: "No. It reduces the new block subsidy. Existing balances and the protocol's transaction units are not divided by the event." }],
  },
  {
    slug: "support-and-resistance", title: "Support and Resistance Explained", description: "Use price zones as a structured observation tool without treating chart lines as guaranteed reversal points.",
    answer: "Support and resistance are areas where past trading showed repeated buying or selling interest. They describe behavior in historical data; they do not force future price action.",
    sections: [
      { heading: "Think in zones, not exact numbers", paragraphs: ["Crypto markets trade across venues and can move quickly. A zone built from multiple reactions is usually more realistic than a single line. Note the timeframe because a level visible on a five-minute chart may be irrelevant to a weekly decision."] },
      { heading: "Look for independent confirmation", paragraphs: ["Volume, market structure, volatility and closing prices can add context. A brief move through a level is not automatically a confirmed breakout. Define what evidence would confirm or reject the idea before acting."] },
      { heading: "Risk control comes first", paragraphs: ["Position size and a predefined invalidation point matter more than drawing a perfect level. Gaps, liquidation cascades and news can move price beyond expected zones before an order executes."] },
      { heading: "Avoid hindsight drawing", paragraphs: ["A useful method should be documented before the outcome. Repeatedly adjusting lines to fit every move creates an explanation that cannot be tested. Keep the chart, date, timeframe and reasoning together."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["market-cap-volume-liquidity", "fomo", "portfolio-risk"],
    sources: [{ label: "CFTC: Digital asset customer education", url: "https://www.cftc.gov/LearnAndProtect/digitalassetresources/index.htm" }, { label: "Investor.gov: Introduction to investing", url: "https://www.investor.gov/introduction-investing" }],
    faq: [{ question: "Does support mean price cannot fall further?", answer: "No. Support is a historical observation, not a guarantee. It can fail abruptly, especially in a leveraged or thin market." }],
  },
  {
    slug: "market-cap-volume-liquidity", title: "Market Cap, Volume and Liquidity", description: "Learn what three common crypto metrics measure, where they mislead and how to read them together.",
    answer: "Market capitalization estimates network value from price and circulating supply; volume measures reported trading activity; liquidity describes how easily orders can execute near the quoted price. None is sufficient alone.",
    sections: [
      { heading: "Market cap is price multiplied by supply", paragraphs: ["The calculation does not mean that the same amount of cash entered the asset. A small trade can set the latest price applied to every circulating unit. Verify supply definitions and distinguish current market cap from fully diluted estimates."] },
      { heading: "Volume needs venue context", paragraphs: ["Reported volume can include different pairs, time windows and venue quality. Compare several reputable sources, identify whether activity is concentrated and check whether the volume translates into actual order-book depth."] },
      { heading: "Liquidity is about executable size", paragraphs: ["A liquid market has tighter spreads and enough orders near the current price for the intended trade size. Slippage increases when a market is thin. A high headline volume does not guarantee deep liquidity at every moment."] },
      { heading: "Use a combined checklist", paragraphs: ["Review supply, venue concentration, spreads, depth, token unlocks and the size of the planned order. Document the data timestamp because these metrics can change rapidly."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["evaluate-cryptocurrency", "bitcoin-dominance", "portfolio-risk"],
    sources: [{ label: "Investor.gov glossary", url: "https://www.investor.gov/introduction-investing/investing-basics/glossary" }, { label: "CoinGecko methodology", url: "https://www.coingecko.com/en/methodology" }],
    faq: [{ question: "Is market capitalization the amount invested in a cryptocurrency?", answer: "No. It is the latest price multiplied by a defined circulating supply. It is a valuation estimate, not a cash-flow ledger." }],
  },
  {
    slug: "bitcoin-dominance", title: "What Bitcoin Dominance Measures", description: "Understand the BTC share of total crypto market capitalization and the limitations hidden in the denominator.",
    answer: "Bitcoin dominance is Bitcoin's market capitalization divided by a provider's estimate of total crypto market capitalization. It is a relative measure whose result depends on supply and asset coverage data.",
    sections: [
      { heading: "The denominator changes", paragraphs: ["New assets, stablecoins, wrapped tokens and changes in provider coverage can alter the total market value even when Bitcoin itself changes little. Compare dominance from the same data provider and methodology over time."] },
      { heading: "A rising ratio has multiple explanations", paragraphs: ["Bitcoin dominance can rise because BTC gains, other assets fall faster, stablecoin supply changes or the dataset changes. The ratio does not identify the cause by itself."] },
      { heading: "It is not a trading command", paragraphs: ["Dominance can help describe market structure, but it does not guarantee an altcoin season, a Bitcoin rally or a reversal date. Combine it with price, liquidity, volume and a clear timeframe."] },
      { heading: "Record methodology and timestamp", paragraphs: ["When publishing the metric, name the provider, capture time and definition. This makes later comparisons reproducible and prevents a dynamic dashboard value from being presented as timeless fact."] },
    ], relatedCoins: ["BTC"], reviewedAt: "2026-08-31", relatedGuides: ["market-cap-volume-liquidity", "bitcoin-halving", "portfolio-risk"],
    sources: [{ label: "CoinGecko methodology", url: "https://www.coingecko.com/en/methodology" }, { label: "CoinMarketCap methodology", url: "https://support.coinmarketcap.com/hc/en-us/articles/360043396252-Supply-Circulating-Total-Max" }],
    faq: [{ question: "Does falling Bitcoin dominance mean every altcoin is rising?", answer: "No. It is an aggregate ratio. Individual assets can move differently, and changes in stablecoins or dataset coverage can affect the denominator." }],
  },
  {
    slug: "portfolio-risk", title: "Building a Crypto Portfolio with Risk Controls", description: "A planning framework for position limits, diversification, custody, liquidity and rebalancing without promising returns.",
    answer: "Crypto portfolio construction starts with the amount a person can afford to lose, then defines position limits, custody, liquidity and rebalancing rules before choosing assets.",
    sections: [
      { heading: "Set the loss boundary first", paragraphs: ["Separate emergency savings, near-term obligations and borrowed money from speculative capital. Crypto volatility and operational loss can be severe, so the allocation decision is more important than selecting a precise entry price."] },
      { heading: "Diversification needs real differences", paragraphs: ["Holding many tokens does not guarantee diversification when they depend on the same market cycle, bridge, stablecoin, exchange or narrative. Map common dependencies and concentration by asset, sector, custodian and network."] },
      { heading: "Define rules before volatility", paragraphs: ["Write maximum position sizes, rebalancing intervals, conditions for reducing exposure and the evidence required to add a new asset. Avoid changing the plan only because a price is rising."] },
      { heading: "Include custody and liquidity", paragraphs: ["A portfolio is not usable if keys are lost or orders cannot execute. Match custody to transaction frequency, test withdrawals, document recovery and consider slippage and tax consequences before rebalancing."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["evaluate-cryptocurrency", "fomo", "hot-wallet-vs-cold-wallet"],
    sources: [{ label: "FINRA: Asset allocation and diversification", url: "https://www.finra.org/investors/investing/investing-basics/asset-allocation-diversification" }, { label: "Investor.gov: Crypto asset securities alert", url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/crypto-asset-securities-investor-alert" }],
    faq: [{ question: "Does holding several cryptocurrencies guarantee diversification?", answer: "No. Many crypto assets share the same liquidity, market sentiment, technology or counterparty risks. Diversification requires examining dependencies, not merely counting tickers." }],
  },
  {
    slug: "fomo", title: "How to Avoid Crypto FOMO", description: "A decision process for slowing down urgency, checking evidence and controlling position size when prices or social media move quickly.",
    answer: "Fear of missing out becomes dangerous when urgency replaces research and risk limits. A written pause-and-check process can prevent a price move or influencer claim from controlling the decision.",
    sections: [
      { heading: "Recognize the pressure pattern", paragraphs: ["Rapid price gains, countdowns, limited-access claims and screenshots of profit create urgency. The feeling is information about your emotional state, not evidence about the asset's value."] },
      { heading: "Use a mandatory pause", paragraphs: ["Delay action long enough to verify the source, market liquidity, token supply, custody method and maximum acceptable loss. If the opportunity cannot survive basic due diligence, it is not suitable for a disciplined plan."] },
      { heading: "Separate thesis from price", paragraphs: ["Write why the asset may have durable demand and what evidence would invalidate that view. A rising price can attract attention but cannot substitute for the thesis."] },
      { heading: "Reduce decision size", paragraphs: ["Position limits and staged decisions can reduce the cost of being wrong. Never borrow merely to avoid missing a move. Record the reason for the decision so it can be reviewed without rewriting history."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["evaluate-cryptocurrency", "portfolio-risk", "crypto-scams"],
    sources: [{ label: "CFTC customer advisory: virtual currencies", url: "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/CustomerAdvisory_CustomerAdvisory_VirtualCurrency.html" }, { label: "Investor.gov fraud resources", url: "https://www.investor.gov/protect-your-investments/fraud" }],
    faq: [{ question: "Is waiting always the same as missing an opportunity?", answer: "No. Waiting is a risk-control decision. Markets continually create new opportunities, while an irreversible transfer or oversized loss may be difficult to recover." }],
  },
  {
    slug: "smart-contract-risk", title: "Smart Contract Risk Explained", description: "Understand code, upgrade, oracle, governance and integration risks before approving a token or depositing funds.",
    answer: "A smart contract executes programmed rules, but correct execution does not prove that the code, economic design, inputs or administrative controls are safe.",
    sections: [
      { heading: "Code can behave exactly as written and still fail users", paragraphs: ["Bugs, missing checks and unexpected interactions can move or lock assets. An audit reviews a scope and version at a point in time; upgrades and integrations may change the system afterward."] },
      { heading: "Administrative controls matter", paragraphs: ["Proxy contracts, multisignature wallets and governance can pause, upgrade or redirect parts of a protocol. Identify who controls those powers, required signatures, timelocks and emergency procedures."] },
      { heading: "External data creates dependencies", paragraphs: ["Oracles provide prices and other information that blockchains cannot observe directly. Delays, manipulation or a market with weak liquidity can produce incorrect liquidations or settlement."] },
      { heading: "Review approvals and exposure", paragraphs: ["Token approvals can authorize future spending. Use limited allowances where supported, review existing permissions and isolate experimental activity from long-term holdings. Never deposit more than the loss boundary permits."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["defi", "bridge-risk", "crypto-scams"],
    sources: [{ label: "Ethereum smart contract security", url: "https://ethereum.org/en/developers/docs/smart-contracts/security/" }, { label: "OWASP Smart Contract Top 10", url: "https://owasp.org/www-project-smart-contract-top-10/" }],
    faq: [{ question: "Does an audit guarantee that a smart contract is safe?", answer: "No. An audit covers a defined scope and time. Undiscovered defects, later upgrades, integrations, governance actions and economic attacks can remain." }],
  },
  {
    slug: "bridge-risk", title: "Crypto Bridge Risk Explained", description: "Learn how cross-chain bridges move representations of value and where custody, verification and liquidity can fail.",
    answer: "A bridge coordinates value or messages between networks. The destination asset often depends on locked collateral, validators, proofs or contracts outside the destination chain itself.",
    sections: [
      { heading: "Map what happens to the original asset", paragraphs: ["Some bridges lock an asset and issue a representation elsewhere. Others rely on liquidity pools or burn-and-mint authority. Identify the issuer, redemption path and the system that prevents unbacked creation."] },
      { heading: "Security models are not interchangeable", paragraphs: ["A bridge may depend on a multisignature group, an external validator set, optimistic challenges or cryptographic proofs. Each model has different assumptions and response options during an incident."] },
      { heading: "Wrapped assets inherit bridge risk", paragraphs: ["A destination token can trade normally even though its backing depends on the bridge. If redemption stops or collateral is lost, the representation can diverge from the original asset."] },
      { heading: "Use the smallest necessary exposure", paragraphs: ["Verify the official route, supported networks, contract address, fees and minimums. Test a small transfer and avoid leaving funds in a bridge contract longer than needed. A successful prior transfer is not a future guarantee."] },
    ], reviewedAt: "2026-08-31", relatedGuides: ["smart-contract-risk", "defi", "hot-wallet-vs-cold-wallet"],
    sources: [{ label: "Ethereum bridges overview", url: "https://ethereum.org/en/developers/docs/bridges/" }, { label: "CISA secure-by-design principles", url: "https://www.cisa.gov/securebydesign" }],
    faq: [{ question: "Is a bridged token identical to the original asset?", answer: "It may track the original asset, but its backing and redemption depend on the bridge design. That creates additional technical and counterparty assumptions." }],
  },
];

export function explainedGuide(slug: string) {
  return EXPLAINED_GUIDES.find((guide) => guide.slug === slug);
}
