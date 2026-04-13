// scripts/test-cache-bust.mjs — fixture test for the cache-busting HTML transform
//
// Exercises the actual cacheBust function from build-utils.mjs (the same one
// .eleventy.js uses) against known HTML fixtures. Runs as `pnpm test`.

import { cacheBust } from "./build-utils.mjs";

const HASH = "abc12345";

// ── Fixtures ───────────────────────────────────────────────────────────────

const tests = [
  {
    name: "rewrites CSS link",
    input: '<link rel="stylesheet" href="/css/common.css">',
    expected: `<link rel="stylesheet" href="/css/common.css?v=${HASH}">`,
  },
  {
    name: "rewrites vendor CSS link",
    input: '<link rel="stylesheet" href="/vendor/low-gravitas-zen.css">',
    expected: `<link rel="stylesheet" href="/vendor/low-gravitas-zen.css?v=${HASH}">`,
  },
  {
    name: "rewrites JS script src",
    input: '<script src="/js/theme-toggle.js"></script>',
    expected: `<script src="/js/theme-toggle.js?v=${HASH}"></script>`,
  },
  {
    name: "rewrites font preload",
    input: '<link rel="preload" href="/vendor/LowGravitasSymbols.ttf" as="font" type="font/ttf" crossorigin>',
    expected: `<link rel="preload" href="/vendor/LowGravitasSymbols.ttf?v=${HASH}" as="font" type="font/ttf" crossorigin>`,
  },
  {
    name: "skips absolute URLs",
    input: '<link rel="stylesheet" href="https://example.com/style.css">',
    expected: '<link rel="stylesheet" href="https://example.com/style.css">',
  },
  {
    name: "skips meta-refresh",
    input: '<meta http-equiv="refresh" content="0;url=/zen-theme/">',
    expected: '<meta http-equiv="refresh" content="0;url=/zen-theme/">',
  },
  {
    name: "skips non-local paths",
    input: '<link rel="stylesheet" href="/other/style.css">',
    expected: '<link rel="stylesheet" href="/other/style.css">',
  },
  {
    name: "handles multiple tags",
    input: [
      '<link rel="stylesheet" href="/css/common.css">',
      '<link rel="stylesheet" href="/vendor/low-gravitas-zen.css">',
      '<script src="/js/glyph-browser.js"></script>',
    ].join("\n"),
    expected: [
      `<link rel="stylesheet" href="/css/common.css?v=${HASH}">`,
      `<link rel="stylesheet" href="/vendor/low-gravitas-zen.css?v=${HASH}">`,
      `<script src="/js/glyph-browser.js?v=${HASH}"></script>`,
    ].join("\n"),
  },
];

// ── Run tests ──────────────────────────────────────────────────────────────

let failures = 0;

for (const { name, input, expected } of tests) {
  const result = cacheBust(input, HASH);
  if (result !== expected) {
    console.error(`FAIL: ${name}`);
    console.error(`  expected: ${expected}`);
    console.error(`  got:      ${result}`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}

console.log(`test-cache-bust: ${tests.length} tests passed.`);
