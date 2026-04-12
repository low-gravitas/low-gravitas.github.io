// lowgravitas.com — Eleventy config
//
// Phase 1a: minimal viable 11ty build. Renders the landing page at /
// using the existing root-level CSS/TTF via passthrough copy. Phases
// 1b (vendor pipeline), 1c (common.css @layer ownership), and 1d
// (sitemap, redirects) layer onto this.

export default function (eleventyConfig) {
  // ── Passthrough copies ────────────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");

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
