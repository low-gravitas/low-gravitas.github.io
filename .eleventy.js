// lowgravitas.com — Eleventy config
//
// Phase 1c: common.css ownership transferred to src/css/. Vendor generated
// assets served from vendor/generated/ → _site/vendor/.

import { execSync } from "node:child_process";

const buildHash = (process.env.GITHUB_SHA ?? execSync("git rev-parse HEAD").toString()).trim().slice(0, 8);

export default function (eleventyConfig) {
  // ── Passthrough copies ────────────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");

  // Vendor generated assets → _site/vendor/
  // vendor/ is in .gitignore (it's fetched, not committed). Eleventy 3 respects
  // .gitignore by default, so we must explicitly un-ignore the generated subtree.
  eleventyConfig.ignores.delete("vendor/generated");
  eleventyConfig.addPassthroughCopy({ "vendor/generated": "vendor" });

  // ── Cache-busting HTML transform ──────────────────────────────────────────
  // Appends ?v=<buildHash> to local CSS, JS, and vendor asset references in
  // rendered HTML. Skips absolute URLs, meta-refresh targets, and CSS url().
  eleventyConfig.addTransform("cache-bust", function (content) {
    if (!this.outputPath || !this.outputPath.endsWith(".html")) {
      return content;
    }

    const v = buildHash;

    // Rewrite <link rel="stylesheet" href="/css/..." or "/vendor/...">,
    //         <link rel="preload" href="/css/..." or "/vendor/...">,
    //         <script src="/js/..." or "/vendor/...">.
    // Skip absolute URLs and meta-refresh content attributes.
    return content.replace(
      /(<(?:link|script)\b[^>]*?\b(?:href|src)=")(\/(css|js|vendor)\/[^"?]+)(")/g,
      (match, pre, path, _dir, post) => `${pre}${path}?v=${v}${post}`
    );
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
