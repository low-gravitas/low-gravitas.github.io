// lowgravitas.com — Eleventy config
//
// Phase 1b: vendor pipeline added. Root-level CSS/TTF passthrough retained
// for the landing page (1c moves ownership to src/css/ + vendor/generated/).

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

  // 1a-only: serve the existing root-level mirrored CSS/TTF from _site/
  // so the landing renders via `eleventy --serve` without moving ownership
  // yet. Phase 1c replaces these with src/css/common.css + vendor/generated/
  // and this block is removed then.
  eleventyConfig.addPassthroughCopy({
    "low-gravitas-common.css": "low-gravitas-common.css",
    "low-gravitas-zen.css": "low-gravitas-zen.css",
    "low-gravitas-symbols.css": "low-gravitas-symbols.css",
    "site.css": "site.css",
    "LowGravitasSymbols.ttf": "LowGravitasSymbols.ttf",
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
