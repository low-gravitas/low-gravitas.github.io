// src/_data/codeSamples.js — parses vendor/code-samples.html into per-language blocks
import { readFile } from "node:fs/promises";

export default async function () {
  const html = await readFile("vendor/code-samples.html", "utf8");

  // Extract inner content of each <code>...</code> block by language.
  // Throws on miss — empty code blocks would ship silently otherwise.
  const extract = (lang) => {
    const re = new RegExp(
      `<pre[^>]*\\blgz-code-sample--${lang}\\b[^>]*>\\s*<code\\b[^>]*>([\\s\\S]*?)</code>\\s*</pre>`
    );
    const m = html.match(re);
    if (!m) throw new Error(`codeSamples: missing block for language "${lang}"`);
    return m[1];
  };

  return {
    python: extract("python"),
    js: extract("js"),
  };
}
