// scripts/stage-vendor.mjs — copy pristine vendor/ → vendor/generated/ with rewrites
//
// 1. Prunes vendor/generated/ at entry (stale file protection on pin bumps).
// 2. Copies theme CSS, TTF, WOFF2, glyphs.json verbatim.
// 3. Rewrites low-gravitas-symbols.css @font-face url() with ?v=<pinned-tag>.
// 4. Leaves pristine vendor/ untouched (SHA-locked).
// 5. Idempotent: running twice produces byte-identical output.

import { readFile, writeFile, copyFile, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const VENDOR = join(ROOT, "vendor");
const GENERATED = join(VENDOR, "generated");
const ARTIFACTS_JSON = join(ROOT, "artifacts.json");

// Files copied verbatim (no rewrite needed)
const VERBATIM = [
  "low-gravitas.css",
  "LowGravitasSymbols.ttf",
  "LowGravitasSymbols.woff2",
  "glyphs.json",
];

// ── Main ───────────────────────────────────────────────────────────────────

const pins = JSON.parse(await readFile(ARTIFACTS_JSON, "utf8"));
const fontTag = pins["symbol-font"];

// 1. Prune generated/ entirely
await rm(GENERATED, { recursive: true, force: true });
await mkdir(GENERATED, { recursive: true });

// 2. Copy verbatim files
for (const file of VERBATIM) {
  await copyFile(join(VENDOR, file), join(GENERATED, file));
}

// 3. Rewrite low-gravitas-symbols.css @font-face url() with cache-bust param
const symbolsCss = await readFile(join(VENDOR, "low-gravitas-symbols.css"), "utf8");
const rewritten = symbolsCss.replace(
  /url\((['"]?)([^)'"]+)\1\)/g,
  (match, quote, path) => {
    // Only rewrite relative font file references, not data: URIs or absolute URLs
    if (path.startsWith("data:") || path.startsWith("http")) return match;
    return `url(${quote}${path}?v=${fontTag}${quote})`;
  }
);
await writeFile(join(GENERATED, "low-gravitas-symbols.css"), rewritten);

console.log(`vendor/generated/ staged (symbol-font cache-bust: ?v=${fontTag}).`);
