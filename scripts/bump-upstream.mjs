// scripts/bump-upstream.mjs — local-run: update artifact pins to latest or explicit tags
//
// Usage:
//   node scripts/bump-upstream.mjs              # resolve latest for both
//   node scripts/bump-upstream.mjs --theme=vX.Y.Z
//   node scripts/bump-upstream.mjs --symbol-font=vA.B.C
//   node scripts/bump-upstream.mjs --theme=vX.Y.Z --symbol-font=vA.B.C
//
// Never auto-commits. Prints a diff summary and commit reminder.

import { readFile, writeFile } from "node:fs/promises";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { resolve, join } from "node:path";

const execFile = promisify(execFileCb);

const TAG_RE = /^v\d+\.\d+\.\d+$/;
const ROOT = resolve(import.meta.dirname, "..");
const ARTIFACTS_JSON = join(ROOT, "artifacts.json");
const LOCK_JSON = join(ROOT, "artifacts.lock.json");

const REPOS = {
  "theme": "low-gravitas/low-gravitas-theme",
  "symbol-font": "low-gravitas/low-gravitas-symbol-font",
};

// ── Parse CLI args ─────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith("--"))
    .map(a => {
      const [key, val] = a.slice(2).split("=");
      return [key, val];
    })
);

// ── Resolve target tags ────────────────────────────────────────────────────

async function resolveTag(key) {
  const explicit = args[key];

  if (explicit) {
    if (!TAG_RE.test(explicit)) {
      console.error(`FATAL: invalid tag format --${key}=${explicit} (expected vX.Y.Z)`);
      process.exit(1);
    }
    return explicit;
  }

  // Resolve latest release
  const repo = REPOS[key];
  try {
    const { stdout } = await execFile("gh", [
      "api", `repos/${repo}/releases/latest`, "-q", ".tag_name",
    ]);
    return stdout.trim();
  } catch (err) {
    console.error(`FATAL: could not resolve latest release for ${repo}`);
    console.error(err.stderr || err.message);
    process.exit(1);
  }
}

async function verifyTagExists(key, tag) {
  const repo = REPOS[key];
  try {
    await execFile("gh", ["api", `repos/${repo}/releases/tags/${tag}`]);
  } catch {
    console.error(`FATAL: release ${tag} does not exist on ${repo}`);
    process.exit(1);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const oldPins = JSON.parse(await readFile(ARTIFACTS_JSON, "utf8"));
let oldLock;
try {
  oldLock = JSON.parse(await readFile(LOCK_JSON, "utf8"));
} catch {
  oldLock = {};
}

const newPins = { ...oldPins };

for (const key of Object.keys(REPOS)) {
  const tag = await resolveTag(key);
  await verifyTagExists(key, tag);
  newPins[key] = tag;
}

// Write updated pins
await writeFile(ARTIFACTS_JSON, JSON.stringify(newPins, null, 2) + "\n");

// For explicitly-targeted or changed repos, remove their lock entries so
// fetch-artifacts doesn't reject intentional SHA changes as tampering.
// (Uses explicit CLI args rather than pin diff so re-runs after a partial
// failure don't silently skip the cleanup.)
const REPO_FILES = {
  "theme": ["low-gravitas.css", "palette.json", "code-samples.html"],
  "symbol-font": ["LowGravitasSymbols.ttf", "LowGravitasSymbols.woff2", "low-gravitas-symbols.css", "glyphs.json"],
};
const bumpedRepos = new Set(
  Object.keys(REPOS).filter(key => args[key] !== undefined || newPins[key] !== oldPins[key])
);
if (bumpedRepos.size > 0) {
  for (const key of bumpedRepos) {
    for (const file of (REPO_FILES[key] || [])) {
      delete oldLock[file];
    }
  }
  await writeFile(LOCK_JSON, JSON.stringify(oldLock, null, 2) + "\n");
}

// Run fetch + stage + verify
console.log("Fetching artifacts...");
const { execSync } = await import("node:child_process");
execSync("node scripts/fetch-artifacts.mjs", { cwd: ROOT, stdio: "inherit" });
execSync("node scripts/stage-vendor.mjs", { cwd: ROOT, stdio: "inherit" });
execSync("node scripts/verify-palette.mjs", { cwd: ROOT, stdio: "inherit" });

// Read new lock for diff
const newLock = JSON.parse(await readFile(LOCK_JSON, "utf8"));

// ── Diff summary ───────────────────────────────────────────────────────────

// File → repo-key mapping for grouped display
const FILE_OWNERS = {
  "low-gravitas.css": "theme",
  "palette.json": "theme",
  "code-samples.html": "theme",
  "LowGravitasSymbols.ttf": "symbol-font",
  "LowGravitasSymbols.woff2": "symbol-font",
  "low-gravitas-symbols.css": "symbol-font",
  "glyphs.json": "symbol-font",
};

console.log("\n── Bump summary ──────────────────────────────────────────");
for (const key of Object.keys(REPOS)) {
  const from = oldPins[key];
  const to = newPins[key];
  const changed = from !== to ? "→" : "=";
  console.log(`${key}:  ${from} ${changed} ${to}`);

  for (const [file, owner] of Object.entries(FILE_OWNERS)) {
    if (owner !== key) continue;
    const sha = newLock[file] || "(missing)";
    const oldSha = oldLock[file] || "(new)";
    const marker = oldSha === sha ? "  " : "* ";
    const oldDisplay = typeof oldSha === "string" && oldSha !== "(new)" ? oldSha.slice(0, 12) : oldSha;
    const newDisplay = typeof sha === "string" && sha !== "(missing)" ? sha.slice(0, 12) : sha;
    console.log(`  ${marker}${file.padEnd(30)} ${oldDisplay}… → ${newDisplay}…`);
  }
}

console.log(`\nNext:  git add artifacts.json artifacts.lock.json \\`);
console.log(`       && git commit -m "bump upstream: theme=${newPins["theme"]} symbol-font=${newPins["symbol-font"]}" \\`);
console.log(`       && git push`);
