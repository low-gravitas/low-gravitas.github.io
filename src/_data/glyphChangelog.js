// src/_data/glyphChangelog.js — build-time fetcher for per-release glyph diffs
//
// Downloads glyph-changes.json from each GitHub release asset, enriches removed
// glyphs with reassignment info (checked against the current vendor/glyphs.json),
// and returns a newest-first array for the /symbol-font/changelog/ page.

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const REPO = "low-gravitas/low-gravitas-symbol-font";
const ROOT = resolve(import.meta.dirname, "../..");

async function fetchGitHub(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "lowgravitas.github.io/build",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${url}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchAsset(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "lowgravitas.github.io/build" },
  });
  if (!res.ok) throw new Error(`Asset ${url}: ${res.status} ${res.statusText}`);
  return res.json();
}

function addChar(g) {
  return { ...g, char: String.fromCodePoint(parseInt(g.hex, 16)) };
}

export default async function () {
  let currentHexes = new Set();
  try {
    const raw = JSON.parse(await readFile(join(ROOT, "vendor/glyphs.json"), "utf8"));
    currentHexes = new Set(raw.map((g) => g.hex.toUpperCase()));
  } catch {
    // vendor not yet fetched — proceed without reassignment enrichment
  }

  let releases;
  try {
    releases = await fetchGitHub(
      `https://api.github.com/repos/${REPO}/releases?per_page=100`
    );
  } catch (err) {
    console.warn(`[glyphChangelog] Failed to fetch releases: ${err.message}`);
    return [];
  }

  const results = [];

  for (const release of releases) {
    const asset = release.assets?.find((a) => a.name === "glyph-changes.json");
    if (!asset) continue;

    let changes;
    try {
      changes = await fetchAsset(asset.browser_download_url);
    } catch (err) {
      console.warn(`[glyphChangelog] Skipping ${release.tag_name}: ${err.message}`);
      continue;
    }

    const summary = changes.summary ?? { added: 0, removed: 0, renamed: 0 };
    if (summary.added + summary.removed + summary.renamed === 0) continue;

    const added = (changes.added ?? []).map(addChar);
    const renamed = (changes.renamed ?? []).map(addChar);

    // Preview: Custom-set glyphs first, then others, capped at 5 added + 3 renamed.
    const customFirst = (arr) => [
      ...arr.filter((g) => g.set === "Custom"),
      ...arr.filter((g) => g.set !== "Custom"),
    ];

    results.push({
      version: release.tag_name,
      date: release.published_at.slice(0, 10),
      htmlUrl: release.html_url,
      summary,
      added,
      removed: (changes.removed ?? []).map((g) => ({
        ...addChar(g),
        reassigned: currentHexes.has(g.hex.toUpperCase()),
      })),
      renamed,
      preview: {
        added: customFirst(added).slice(0, 5),
        renamed: customFirst(renamed).slice(0, 3),
      },
    });
  }

  results.sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true })
  );
  return results;
}
