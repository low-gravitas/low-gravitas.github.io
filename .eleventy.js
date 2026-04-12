// lowgravitas.com — Eleventy config
//
// Phase 1c: common.css ownership transferred to src/css/. Vendor generated
// assets served from vendor/generated/ → _site/vendor/.

import { execSync } from "node:child_process";
import rssPlugin from "@11ty/eleventy-plugin-rss";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";

const buildHash = (process.env.GITHUB_SHA ?? execSync("git rev-parse HEAD").toString()).trim().slice(0, 8);
const isProduction = process.env.NODE_ENV === "production";

export default function (eleventyConfig) {
  // ── Plugins ─────────────────────────────────────────────────────────────
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);

  // ── Markdown ────────────────────────────────────────────────────────────
  eleventyConfig.setLibrary("md", markdownIt({ html: true, linkify: true, typographer: true }));

  // ── Collections ─────────────────────────────────────────────────────────
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/blog/posts/*.md")
      .filter((post) => !isProduction || !post.data.draft)
      .sort((a, b) => b.date - a.date)
  );

  // ── Filters ─────────────────────────────────────────────────────────────
  eleventyConfig.addFilter("readableDate", (dateObj) =>
    new Date(dateObj).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
    })
  );
  eleventyConfig.addFilter("htmlDateString", (dateObj) =>
    new Date(dateObj).toISOString().split("T")[0]
  );
  eleventyConfig.addFilter("readingTime", (content) => {
    const words = content.replace(/<[^>]*>/g, "").trim().split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  });

  // Relative luminance → black or white label for swatch contrast
  eleventyConfig.addFilter("contrastLabel", (hex) => {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const srgb = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const L = 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
    return L > 0.179 ? "#000000" : "#ffffff";
  });

  // ── Shortcodes ──────────────────────────────────────────────────────────
  eleventyConfig.addShortcode("image", function (src, alt, layout, caption) {
    layout = layout || "center";
    const fullSrc = `/${src}`;
    const captionHtml = caption ? `\n  <figcaption>${caption}</figcaption>` : "";
    return (
      `<figure class="img-${layout}">` +
      `\n  <a href="${fullSrc}" class="img-link">` +
      `\n    <img src="${fullSrc}" alt="${alt}" loading="lazy">` +
      `\n  </a>${captionHtml}` +
      `\n</figure>`
    );
  });

  // ── Code block enhancement transform ────────────────────────────────────
  eleventyConfig.addTransform("codeBlockEnhance", function (content) {
    if (!this.outputPath || !this.outputPath.endsWith(".html")) return content;
    return content.replace(
      /<!--\s*code-meta:\s*(\{[^}]+\})\s*-->\s*(<pre\b)/g,
      (match, jsonStr, preTag) => {
        try {
          const meta = JSON.parse(jsonStr);
          const attrs = [];
          if (meta.title) attrs.push(`data-title="${meta.title}"`);
          if (meta.lineNumbers) attrs.push("data-line-numbers");
          if (meta.highlight) attrs.push(`data-highlight="${meta.highlight}"`);
          if (meta.noLang) attrs.push("data-no-lang");
          return `${preTag} ${attrs.join(" ")}`;
        } catch {
          return match;
        }
      }
    );
  });

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
