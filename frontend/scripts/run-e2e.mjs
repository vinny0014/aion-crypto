// E2E runner.
//
// Default: delegate straight to Playwright, which uses its own bundled
// Chromium (install once with `npx playwright install --with-deps chromium`).
// This is the stable path for CI and developer machines.
//
// Opt-in for constrained hosts: E2E_USE_SPARTICUZ=1 extracts the
// @sparticuz/chromium binary to /tmp and exports
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH for playwright.config.ts.
import { createReadStream, createWriteStream, chmodSync, existsSync, renameSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { createBrotliDecompress } from "node:zlib";

const env = { ...process.env };

if (process.env.E2E_USE_SPARTICUZ === "1" && !process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
  const executablePath = "/tmp/aion-crypto-chromium-138";
  const compressedPath = path.resolve("node_modules", "@sparticuz", "chromium", "bin", "chromium.br");
  const packageBin = path.dirname(compressedPath);

  if (!statIsComplete(executablePath)) {
    const partialPath = `${executablePath}.partial`;
    await new Promise((resolve, reject) => {
      const input = createReadStream(compressedPath);
      const output = createWriteStream(partialPath, { mode: 0o700 });
      input.on("error", reject);
      output.on("error", reject);
      output.on("close", resolve);
      input.pipe(createBrotliDecompress()).pipe(output);
    });
    renameSync(partialPath, executablePath);
    chmodSync(executablePath, 0o700);
  }
  if (!existsSync("/tmp/libGLESv2.so")) {
    await extractTar(path.join(packageBin, "swiftshader.tar.br"), "/tmp");
  }
  if (!existsSync("/tmp/fonts/fonts.conf")) {
    await extractTar(path.join(packageBin, "fonts.tar.br"), "/tmp");
  }
  env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = executablePath;
}

const command = path.resolve("node_modules", ".bin", process.platform === "win32" ? "playwright.cmd" : "playwright");
const child = spawn(command, ["test", ...process.argv.slice(2)], { stdio: "inherit", env });

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

function statIsComplete(file) {
  try {
    return statSync(file).size > 150_000_000;
  } catch {
    return false;
  }
}

function extractTar(source, destination) {
  return new Promise((resolve, reject) => {
    const input = createReadStream(source);
    const tar = spawn("tar", ["--extract", "--file", "-", "--directory", destination, "--no-same-owner"], {
      stdio: ["pipe", "inherit", "inherit"],
    });
    input.on("error", reject);
    tar.on("error", reject);
    tar.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`tar exited with ${code}`))));
    input.pipe(createBrotliDecompress()).pipe(tar.stdin);
  });
}
