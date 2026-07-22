import Link from "next/link";

const COLS: [string, [string, string][]][] = [
  ["Explore", [["Markets", "/markets"], ["Coins", "/coins"], ["News", "/news"], ["Analysis", "/analysis"], ["Research", "/research"]]],
  ["Resources", [["Learn", "/learn"], ["Guides", "/guides"], ["Glossary", "/glossary"], ["Status", "/status"], ["Search", "/search"]]],
  ["Tools", [["Watchlist", "/watchlist"], ["Newsletter", "/newsletter"], ["Categories", "/categories"], ["Tags", "/tags"]]],
  ["Company", [["About", "/about"], ["Contact", "/contact"], ["Editorial Policy", "/editorial-policy"], ["Corrections", "/corrections-policy"]]],
  ["Legal", [["Privacy", "/privacy"], ["Terms", "/terms"], ["Disclaimer", "/disclaimer"], ["Risk Disclosure", "/risk-disclosure"]]],
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-bg-soft/40">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-3 py-10 sm:px-5 md:grid-cols-[1.3fr_repeat(5,1fr)]">
        <div>
          <div className="font-display text-lg font-bold">AION <span className="text-primary-glow">CRYPTO</span></div>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-dim">
            Crypto market intelligence: real-time data, news and analysis for the crypto world. Informational only — never investment advice.
          </p>
        </div>
        {COLS.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink">{title}</h3>
            <ul className="mt-3 space-y-2">
              {links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-ink-dim hover:text-ink">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line py-4 text-center text-[12px] text-ink-dim">
        © {new Date().getFullYear()} AION Crypto. Market data provided by public exchange APIs. Crypto assets are volatile; you can lose money.
      </div>
    </footer>
  );
}
