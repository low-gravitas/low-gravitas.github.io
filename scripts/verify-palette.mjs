// scripts/verify-palette.mjs — contract test for vendor/palette.json
//
// Asserts the palette file parses as JSON and contains the expected
// top-level structure + key palette/token names used by the hub's templates.
// Uses JSON.parse + key-presence assertions only. No eval, no dynamic import.

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PALETTE_PATH = join(ROOT, "vendor", "palette.json");

const palette = JSON.parse(await readFile(PALETTE_PATH, "utf8"));

// ── Structure assertions ───────────────────────────────────────────────────

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(typeof palette.version === "string", "missing palette.version");
assert(typeof palette.generated_from === "string", "missing palette.generated_from");

for (const variant of ["dark", "light"]) {
  assert(typeof palette[variant] === "object", `missing palette.${variant}`);
  assert(typeof palette[variant].palette === "object", `missing palette.${variant}.palette`);
  assert(typeof palette[variant].tokens === "object", `missing palette.${variant}.tokens`);

  // Palette colors used by templates
  const paletteKeys = [
    "red", "green", "yellow", "blue", "magenta", "cyan",
    "bg-deep", "accent",
  ];
  for (const key of paletteKeys) {
    assert(key in palette[variant].palette, `missing palette.${variant}.palette.${key}`);
  }

  // Token aliases used by templates
  const tokenKeys = [
    "text", "text-dim", "surface-raised", "bg", "surface",
  ];
  for (const key of tokenKeys) {
    assert(key in palette[variant].tokens, `missing palette.${variant}.tokens.${key}`);
  }
}

console.log("verify-palette: OK");
