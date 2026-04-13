// Shared build utilities for .eleventy.js, data files, and tests.
import { execSync } from "node:child_process";

// 8-char build hash used for cache-busting. Prefers CI env var over local git.
export const buildHash = (
  process.env.GITHUB_SHA ?? execSync("git rev-parse HEAD").toString()
).trim().slice(0, 8);

// Append ?v=<hash> to local /css, /js, /vendor asset references in HTML.
// Skips absolute URLs and paths that already have a query string.
export function cacheBust(content, v) {
  return content.replace(
    /(<(?:link|script)\b[^>]*?\b(?:href|src)=")(\/(css|js|vendor)\/[^"?]+)(")/g,
    (_match, pre, path, _dir, post) => `${pre}${path}?v=${v}${post}`
  );
}
