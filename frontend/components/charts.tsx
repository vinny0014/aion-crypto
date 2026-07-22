// Hand-rolled SVG charts: real data in, no static images, no layout shift
// (fixed viewBox), responsive by width.
import type { Kline } from "@/lib/api";

function scale(vals: number[], h: number, pad = 4): (v: number) => number {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  return (v) => h - pad - ((v - min) / range) * (h - pad * 2);
}

export function Sparkline({ data, up, w = 110, h = 32 }: { data: number[]; up: boolean; w?: number; h?: number }) {
  if (!data.length) return null;
  const y = scale(data, h);
  const step = w / (data.length - 1 || 1);
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const color = up ? "#22C55E" : "#EF4444";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function AreaChart({ klines, height = 220 }: { klines: Kline[]; height?: number }) {
  const closes = klines.map((k) => k[4]);
  const w = 720;
  const y = scale(closes, height, 12);
  const step = w / (closes.length - 1 || 1);
  const line = closes.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const min = Math.min(...closes), max = Math.max(...closes);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="Price chart">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={height * f} y2={height * f} stroke="rgba(255,255,255,0.06)" />
      ))}
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="#A855F7" strokeWidth="1.8" />
      <text x="8" y="16" className="fill-ink-dim" fontSize="11">{max.toLocaleString()}</text>
      <text x="8" y={height - 6} className="fill-ink-dim" fontSize="11">{min.toLocaleString()}</text>
    </svg>
  );
}

export function CandleChart({ klines, height = 260 }: { klines: Kline[]; height?: number }) {
  const w = 720;
  const highs = klines.map((k) => k[2]);
  const lows = klines.map((k) => k[3]);
  const y = scale([...highs, ...lows], height, 10);
  const bw = Math.max(2, (w / klines.length) * 0.6);
  const step = w / klines.length;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="Candlestick chart">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={height * f} y2={height * f} stroke="rgba(255,255,255,0.06)" />
      ))}
      {klines.map((k, i) => {
        const [, open, high, low, close] = k;
        const up = close >= open;
        const color = up ? "#22C55E" : "#EF4444";
        const x = i * step + step / 2;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(high)} y2={y(low)} stroke={color} strokeWidth="1" />
            <rect
              x={x - bw / 2}
              y={Math.min(y(open), y(close))}
              width={bw}
              height={Math.max(1.5, Math.abs(y(open) - y(close)))}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = 42, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label="Market dominance">
      {slices.map((s) => {
        const frac = s.value / total;
        const el = (
          <circle
            key={s.label}
            cx="60" cy="60" r={r} fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={`${frac * c} ${c}`} strokeDashoffset={-offset * c}
            transform="rotate(-90 60 60)"
          />
        );
        offset += frac;
        return el;
      })}
      <circle cx="60" cy="60" r="28" fill="#151521" />
    </svg>
  );
}

export function FearGreedGauge({ value }: { value: number }) {
  // semicircle gauge, value 0-100
  const angle = (value / 100) * 180 - 90;
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[220px]" role="img" aria-label={`Fear and greed index ${value}`}>
      <defs>
        <linearGradient id="fg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="url(#fg)" strokeWidth="14" strokeLinecap="round" />
      <g transform={`rotate(${angle} 100 105)`}>
        <line x1="100" y1="105" x2="100" y2="45" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="105" r="6" fill="#F8FAFC" />
    </svg>
  );
}
