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
};

export type ExplainedGuide = {
  slug: string;
  title: string;
  description: string;
  answer: string;
  sections: Array<{ heading: string; paragraphs: string[]; points?: string[] }>;
  relatedCoins?: string[];
};

export const EXPLAINED_GUIDES: ExplainedGuide[] = [
  {
    slug: "bitcoin", title: "What Is Bitcoin?", description: "A plain-language guide to Bitcoin, BTC, mining, scarcity, custody and the principal risks.",
    answer: "Bitcoin is a public payment and settlement network with no central issuer. BTC is its native digital asset, and the protocol limits total issuance to 21 million units.",
    sections: [
      { heading: "How Bitcoin works", paragraphs: ["Users sign transactions with private keys. Nodes verify the protocol rules, while miners use proof of work to order valid transactions into blocks. This separation lets anyone audit the ledger without asking a company for permission."], points: ["Public, auditable transaction history", "Proof-of-work security", "Predictable issuance schedule"] },
      { heading: "Why people use BTC", paragraphs: ["People use BTC for self-custody, settlement and as a scarce digital asset. Those uses do not make its price stable or guarantee future demand."], points: ["Transfers can be global and final", "Ownership can be held without an intermediary", "Markets trade continuously and can move sharply"] },
      { heading: "What can go wrong", paragraphs: ["Bitcoin transactions are normally irreversible. Losing a recovery phrase, sending to the wrong address or trusting a fraudulent service can cause permanent loss. Regulation, taxes, fees and market liquidity also vary by jurisdiction and time."] },
    ], relatedCoins: ["BTC"],
  },
  {
    slug: "ethereum", title: "What Is Ethereum?", description: "Understand Ethereum, ETH, smart contracts, proof of stake, layer-2 networks and common risks.",
    answer: "Ethereum is a programmable public blockchain. ETH is used to pay fees, secure proof-of-stake consensus and interact with applications on Ethereum and related scaling networks.",
    sections: [
      { heading: "Smart contracts and applications", paragraphs: ["Smart contracts are programs stored and executed on the network. They can coordinate tokens, exchanges, lending markets and other applications, but code execution does not guarantee that an application is safe or economically sound."] },
      { heading: "Proof of stake and scaling", paragraphs: ["Validators lock ETH to participate in consensus. Layer-2 networks process activity away from Ethereum's base layer and submit proofs or transaction data back for settlement."], points: ["ETH pays transaction fees", "Validators help secure the chain", "Layer-2 designs have distinct trust and withdrawal assumptions"] },
      { heading: "Principal risks", paragraphs: ["Users face price volatility, smart-contract bugs, phishing, bridge failures, application governance risk and mistakes when moving assets between networks."] },
    ], relatedCoins: ["ETH"],
  },
  {
    slug: "xrp", title: "What Is XRP?", description: "A factual introduction to XRP, the XRP Ledger, consensus, settlement uses and risks.",
    answer: "XRP is the native asset of the XRP Ledger, a public ledger designed for fast settlement. It is not mined through proof of work.",
    sections: [
      { heading: "How the XRP Ledger reaches agreement", paragraphs: ["Validators exchange proposals and converge on a set of valid transactions. This model differs from both Bitcoin mining and Ethereum proof of stake."], points: ["Short settlement intervals", "Native transaction fees paid in XRP", "Built-in support for issued assets and exchange"] },
      { heading: "How XRP may be used", paragraphs: ["XRP can be transferred directly, used for ledger fees and reserves, or serve as a bridge asset where adequate liquidity exists. A possible use is not evidence of guaranteed adoption."] },
      { heading: "Principal risks", paragraphs: ["XRP remains volatile and exposed to regulatory, liquidity, custody and ecosystem risks. Users should distinguish the public ledger, the XRP asset and companies that build services around them."] },
    ], relatedCoins: ["XRP"],
  },
  {
    slug: "crypto-wallet", title: "What Is a Crypto Wallet?", description: "Learn what crypto wallets store, how private keys work and how to reduce custody mistakes.",
    answer: "A crypto wallet manages the keys used to authorize blockchain transactions. The assets remain recorded on a blockchain; the wallet controls the credentials that can move them.",
    sections: [
      { heading: "Custodial and self-custody wallets", paragraphs: ["A custodial service controls keys on a user's behalf. A self-custody wallet gives the user direct control and direct responsibility. Neither model removes risk; they distribute it differently."] },
      { heading: "Recovery phrases and signing", paragraphs: ["A recovery phrase can recreate the keys to a wallet. Anyone who obtains it can usually control the assets. Legitimate support staff should never need the phrase."], points: ["Keep recovery material offline", "Verify the destination and network", "Read every signing request before approval", "Test unfamiliar transfers with a small amount"] },
      { heading: "Common failure modes", paragraphs: ["Phishing pages, malicious approvals, address poisoning, device compromise, unsupported networks and lost recovery material are frequent causes of loss. Blockchain finality usually prevents chargebacks."] },
    ],
  },
  {
    slug: "bitcoin-etf", title: "What Is a Bitcoin ETF?", description: "Understand how spot Bitcoin ETFs provide price exposure, and how they differ from owning BTC directly.",
    answer: "A spot Bitcoin exchange-traded fund is a regulated investment product whose shares are designed to reflect the value of bitcoin held by the fund, less fees and operating effects.",
    sections: [
      { heading: "ETF shares versus BTC", paragraphs: ["ETF investors own fund shares, not bitcoin they can transfer on-chain. The fund and its service providers handle custody, creation and redemption, while shares trade through brokerage accounts during market hours."] },
      { heading: "Why investors use the structure", paragraphs: ["The ETF format may fit existing brokerage, reporting and retirement-account workflows. It avoids direct private-key management but introduces fund, custodian, tracking and market-structure dependencies."], points: ["Brokerage access", "Published fees and disclosures", "No direct on-chain use or self-custody"] },
      { heading: "Risks and due diligence", paragraphs: ["Bitcoin price risk remains. Investors should read the fund prospectus and check fees, spreads, liquidity, custody arrangements, tax treatment and jurisdiction-specific rules before making a decision."] },
    ], relatedCoins: ["BTC"],
  },
];

export function explainedGuide(slug: string) {
  return EXPLAINED_GUIDES.find((guide) => guide.slug === slug);
}
