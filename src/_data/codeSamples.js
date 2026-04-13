// src/_data/codeSamples.js — parses vendor/code-samples.html into per-language blocks
import { readFile } from "node:fs/promises";

export default async function () {
  const html = await readFile("vendor/code-samples.html", "utf8");

  // Extract inner content of each <code>...</code> block by language
  const extract = (lang) => {
    const re = new RegExp(
      `<pre class="lgz-code-sample lgz-code-sample--${lang}"><code>([\\s\\S]*?)</code></pre>`
    );
    const m = html.match(re);
    return m ? m[1] : "";
  };

  return {
    python: extract("python"),
    js: extract("js"),
  };
}
