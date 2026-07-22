import type { Config } from "tailwindcss";

// AION Crypto design tokens — dark terminal, neon purple/cyan, financial density
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#07070B", soft: "#111119" },
        card: "#151521",
        primary: { DEFAULT: "#7C3AED", glow: "#A855F7" },
        accent: { cyan: "#22D3EE", green: "#22C55E", red: "#EF4444", btc: "#F59E0B" },
        ink: { DEFAULT: "#F8FAFC", dim: "#94A3B8" },
        line: "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-grotesk)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(124,58,237,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset",
      },
    },
  },
  plugins: [],
};
export default config;
