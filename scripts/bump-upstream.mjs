// scripts/bump-upstream.mjs — local-run: update artifact pins to latest or explicit tags
//
// Usage:
//   node scripts/bump-upstream.mjs              # resolve latest for both
//   node scripts/bump-upstream.mjs --zen=vX.Y.Z
//   node scripts/bump-upstream.mjs --font=vA.B.C
//   node scripts/bump-upstream.mjs --zen=vX.Y.Z --font=vA.B.C
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
  "zen-theme": "low-gravitas/low-gravitas-zen-theme",
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
  const argKey = key === "zen-theme" ? "zen" : "font";
  const explicit = args[argKey];

  if (explicit) {
    if (!TAG_RE.test(explicit)) {
      console.error(`FATAL: invalid tag format --${argKey}=${explicit} (expected vX.Y.Z)`);
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
  "low-gravitas-zen.css": "zen-theme",
  "palette.json": "zen-theme",
  "code-samples.html": "zen-theme",
  "LowGravitasSymbols.ttf": "symbol-font",
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
console.log(`       && git commit -m "bump upstream: zen=${newPins["zen-theme"]} font=${newPins["symbol-font"]}" \\`);
console.log(`       && git push`);
