import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");
const publicDir = path.resolve(process.cwd(), "public");

function resolveSha() {
  const candidates = [
    ["AION_BUILD_SHA", process.env.AION_BUILD_SHA],
    ["GITHUB_SHA", process.env.GITHUB_SHA],
    ["RENDER_GIT_COMMIT", process.env.RENDER_GIT_COMMIT],
    ["VERCEL_GIT_COMMIT_SHA", process.env.VERCEL_GIT_COMMIT_SHA],
  ];
  for (const [source, value] of candidates) {
    if (value && /^[0-9a-f]{7,40}$/i.test(value.trim())) {
      return { sha: value.trim().toLowerCase(), source };
    }
  }

  try {
    const sha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim().toLowerCase();
    if (/^[0-9a-f]{40}$/.test(sha)) return { sha, source: "git" };
  } catch {
    // The production preflight deliberately rejects an unverifiable build.
  }

  return { sha: "unknown", source: "unavailable" };
}

const release = resolveSha();
mkdirSync(publicDir, { recursive: true });
writeFileSync(
  path.join(publicDir, "build-info.json"),
  `${JSON.stringify({
    app: "AION Crypto",
    sha: release.sha,
    short_sha: release.sha === "unknown" ? "unknown" : release.sha.slice(0, 12),
    source: release.source,
    built_at: new Date().toISOString(),
  }, null, 2)}\n`,
  "utf8",
);

console.log(`AION build fingerprint: ${release.sha} (${release.source})`);
