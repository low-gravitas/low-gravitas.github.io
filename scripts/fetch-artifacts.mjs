// scripts/fetch-artifacts.mjs — hardened artifact fetcher for lowgravitas.com
//
// Downloads pinned release artifacts from zen-theme and symbol-font repos,
// verifies SHA-256 against artifacts.lock.json, and populates vendor/.
// Supports LGZ_USE_VENDOR_LOCAL=1 for local development with sibling repos.

import { readFile, writeFile, mkdir, rename, rm, stat, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { join, resolve } from "node:path";

const execFile = promisify(execFileCb);

// ── Hardcoded repo map ─────────────────────────────────────────────────────
// artifacts.json carries tags only; repo ownership lives here, not in config.
const REPO_MAP = {
  "zen-theme": {
    repo: "low-gravitas/low-gravitas-zen-theme",
    files: ["low-gravitas-zen.css", "palette.json", "code-samples.html"],
  },
  "symbol-font": {
    repo: "low-gravitas/low-gravitas-symbol-font",
    files: ["LowGravitasSymbols.ttf", "low-gravitas-symbols.css", "glyphs.json"],
  },
};

const TAG_RE = /^v\d+\.\d+\.\d+$/;
const ROOT = resolve(import.meta.dirname, "..");
const VENDOR = join(ROOT, "vendor");
const VENDOR_TMP = join(ROOT, "vendor.tmp");
const ARTIFACTS_JSON = join(ROOT, "artifacts.json");
const LOCK_JSON = join(ROOT, "artifacts.lock.json");

// ── Helpers ────────────────────────────────────────────────────────────────

async function sha256(filePath) {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

async function fileExists(filePath) {
  try {
    const s = await stat(filePath);
    return s.size > 0;
  } catch {
    return false;
  }
}

function sentinelPath(pins) {
  return join(VENDOR, `.fetched-${pins["zen-theme"]}-${pins["symbol-font"]}`);
}

// ── Vendor-local override ──────────────────────────────────────────────────

const VENDOR_LOCAL_DIRS = {
  "zen-theme": join(ROOT, "vendor-local", "low-gravitas-zen-theme"),
  "symbol-font": join(ROOT, "vendor-local", "low-gravitas-symbol-font"),
};

async function fetchFromVendorLocal(pins) {
  if (process.env.CI) {
    console.error("FATAL: LGZ_USE_VENDOR_LOCAL=1 is not allowed in CI.");
    process.exit(1);
  }

  console.warn("⚠ LGZ_USE_VENDOR_LOCAL=1 — using local sibling repo outputs.");

  await rm(VENDOR_TMP, { recursive: true, force: true });
  await mkdir(VENDOR_TMP, { recursive: true });

  for (const [key, { files }] of Object.entries(REPO_MAP)) {
    const srcDir = VENDOR_LOCAL_DIRS[key];
    console.warn(`  ${key} (shadowing pinned ${pins[key]}): ${srcDir}`);
    for (const file of files) {
      const src = join(srcDir, file);
      const dest = join(VENDOR_TMP, file);
      if (!(await fileExists(src))) {
        console.error(`FATAL: vendor-local file missing: ${src}`);
        process.exit(1);
      }
      await copyFile(src, dest);
      console.warn(`    ${file}`);
    }
  }

  // Compute SHAs and write lock
  const lock = {};
  for (const { files } of Object.values(REPO_MAP)) {
    for (const file of files) {
      lock[file] = await sha256(join(VENDOR_TMP, file));
    }
  }
  await writeFile(LOCK_JSON, JSON.stringify(lock, null, 2) + "\n");

  // Atomic swap
  await rm(VENDOR, { recursive: true, force: true });
  await rename(VENDOR_TMP, VENDOR);

  // Write sentinel
  await writeFile(sentinelPath(pins), new Date().toISOString());
  console.log("vendor/ populated from vendor-local.");
}

// ── gh release download ────────────────────────────────────────────────────

async function ghDownload(repo, tag, file, destDir) {
  try {
    await execFile("gh", [
      "release", "download", tag,
      "--repo", repo,
      "--pattern", file,
      "--dir", destDir,
    ]);
  } catch (err) {
    console.error(`FATAL: gh release download failed for ${repo}@${tag}/${file}`);
    console.error(err.stderr || err.message);
    process.exit(1);
  }
}

async function fetchFromRemote(pins) {
  // Validate tags
  for (const [key, tag] of Object.entries(pins)) {
    if (!TAG_RE.test(tag)) {
      console.error(`FATAL: invalid tag format for ${key}: "${tag}" (expected vX.Y.Z)`);
      process.exit(1);
    }
  }

  // Check sentinel — skip if tags match AND all files present AND SHAs match
  const sentinel = sentinelPath(pins);
  if (await fileExists(sentinel)) {
    let lock;
    try {
      lock = JSON.parse(await readFile(LOCK_JSON, "utf8"));
    } catch {
      lock = {};
    }

    let allValid = Object.keys(lock).length > 0;
    for (const { files } of Object.values(REPO_MAP)) {
      for (const file of files) {
        const fp = join(VENDOR, file);
        if (!(await fileExists(fp))) {
          allValid = false;
          break;
        }
        const hash = await sha256(fp);
        if (hash !== lock[file]) {
          allValid = false;
          break;
        }
      }
      if (!allValid) break;
    }

    if (allValid) {
      console.log("vendor/ up to date (sentinel + SHA match). Skipping fetch.");
      return;
    }
    console.log("Sentinel found but SHA mismatch — re-fetching.");
  }

  // Load existing lock for comparison (TOFU: empty on first run)
  let existingLock;
  try {
    existingLock = JSON.parse(await readFile(LOCK_JSON, "utf8"));
  } catch {
    existingLock = {};
  }
  const isTofu = Object.keys(existingLock).length === 0;

  if (isTofu) {
    console.log("TOFU: first run — lock file will be written from downloaded bytes.");
  }

  // Download into vendor.tmp/
  await rm(VENDOR_TMP, { recursive: true, force: true });
  await mkdir(VENDOR_TMP, { recursive: true });

  for (const [key, { repo, files }] of Object.entries(REPO_MAP)) {
    const tag = pins[key];
    console.log(`Fetching ${key}@${tag} from ${repo}...`);
    for (const file of files) {
      await ghDownload(repo, tag, file, VENDOR_TMP);
    }
  }

  // Verify presence + non-zero bytes + SHA
  const newLock = {};
  for (const { files } of Object.values(REPO_MAP)) {
    for (const file of files) {
      const fp = join(VENDOR_TMP, file);
      if (!(await fileExists(fp))) {
        console.error(`FATAL: expected artifact missing after download: ${file}`);
        process.exit(1);
      }
      newLock[file] = await sha256(fp);
    }
  }

  // On non-TOFU runs, verify SHAs match lock
  if (!isTofu) {
    for (const [file, expectedHash] of Object.entries(existingLock)) {
      if (newLock[file] !== expectedHash) {
        console.error(`FATAL: SHA-256 mismatch for ${file}`);
        console.error(`  expected: ${expectedHash}`);
        console.error(`  got:      ${newLock[file]}`);
        console.error("If this is an intentional update, run bump-upstream.mjs first.");
        process.exit(1);
      }
    }
  }

  // Write lock file (TOFU or verified-identical)
  await writeFile(LOCK_JSON, JSON.stringify(newLock, null, 2) + "\n");

  // Atomic swap: vendor.tmp/ → vendor/
  await rm(VENDOR, { recursive: true, force: true });
  await rename(VENDOR_TMP, VENDOR);

  // Write sentinel
  await writeFile(sentinelPath(pins), new Date().toISOString());
  console.log("vendor/ populated and SHA-verified.");
}

// ── Main ───────────────────────────────────────────────────────────────────

const pins = JSON.parse(await readFile(ARTIFACTS_JSON, "utf8"));

if (process.env.LGZ_USE_VENDOR_LOCAL === "1") {
  await fetchFromVendorLocal(pins);
} else {
  await fetchFromRemote(pins);
}
