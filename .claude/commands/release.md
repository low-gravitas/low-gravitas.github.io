---
description: "Build, deploy, or update lowgravitas.com — bump upstream artifacts, publish content changes, or trigger a manual redeploy"
---

# Release / Deploy — lowgravitas.com

This is an Eleventy 3 static site. Artifacts (CSS, TTF, JSON) are fetched from sibling repo releases via `scripts/fetch-artifacts.mjs`. Artifact pins live in `artifacts.json` (tags) and `artifacts.lock.json` (SHA-256 hashes). Deploy is automatic on push to main via `.github/workflows/build.yml`.

Ask the user which scenario applies, or infer from context:

1. **Upstream version bump** — a new zen-theme or symbol-font release needs to be pulled in
2. **Content changes** — blog post, CSS edit, template change, etc.
3. **Manual redeploy** — no code changes, just re-run the deploy workflow

---

## Scenario 1: Upstream version bump

Run all commands from the repo root using `git -C` or tool paths as needed.

1. Run the bump script. To resolve the latest releases automatically:
   ```
   node scripts/bump-upstream.mjs
   ```
   Or with explicit tags:
   ```
   node scripts/bump-upstream.mjs --zen=vX.Y.Z --font=vA.B.C
   ```
2. Review the diff summary the script prints (old -> new SHAs for each artifact). Confirm the changes look correct.
3. Build and test:
   ```
   pnpm run build
   pnpm test
   ```
4. Start the dev server and visually check key pages:
   ```
   pnpm run dev
   ```
   Check: `/`, `/zen-theme/`, `/symbol-font/`, `/symbol-font/browser/`, `/blog/`
5. Commit only `artifacts.json` and `artifacts.lock.json`. Do not commit fetched or generated vendor files.
6. Push to main. The workflow deploys automatically.
7. Monitor the deploy:
   ```
   gh -R low-gravitas/low-gravitas.github.io run list --workflow build.yml --limit 1
   ```
   Wait for it to succeed, including the health-check step.

---

## Scenario 2: Content changes

1. Make changes in `src/`.
2. Build locally or use the dev server for live reload:
   ```
   pnpm run build
   ```
   or:
   ```
   pnpm run dev
   ```
3. Verification by content type:
   - **Blog posts**: verify the post renders at its URL, check the blog index at `/blog/`, verify RSS feed at `/blog/feed.xml`. Posts with `draft: true` in frontmatter render at their URL but are excluded from the blog index.
   - **CSS changes**: check affected pages visually, verify the theme toggle works on both dark and light modes.
   - **Template changes**: check all pages that use the modified template.
4. Run tests:
   ```
   pnpm test
   ```
5. Commit and push to main. The workflow deploys automatically.
6. After deploy, spot-check production URLs.

---

## Scenario 3: Manual redeploy

No code changes needed. Trigger the workflow directly:

```
gh -R low-gravitas/low-gravitas.github.io workflow run build.yml --ref main
```

Monitor:

```
gh -R low-gravitas/low-gravitas.github.io run list --workflow build.yml --limit 1
```

---

## Post-deploy verification checklist

After every deploy, verify the following on production (lowgravitas.com):

- [ ] `/` — landing page loads, nav links work, theme toggle works
- [ ] `/zen-theme/` — palette swatches render, demo sections toggle between dark/light, global theme toggle syncs demos
- [ ] `/symbol-font/` — version and glyph count display, icon set pills populate
- [ ] `/symbol-font/browser/` — glyphs load in grid, search works, glyph count shown
- [ ] `/blog/` — index loads (shows posts or "No posts yet"), RSS feed link works
- [ ] `/blog/feed.xml` — valid XML, self-link points to `/blog/feed.xml`
- [ ] `/sitemap.xml` — lists all non-redirect pages
- [ ] Redirect stubs respond correctly:
  - `/low-gravitas-zen-theme/` redirects to `/zen-theme/`
  - `/low-gravitas-symbol-font/` redirects to `/symbol-font/`
  - `/low-gravitas-symbol-font/browser.html` redirects to `/symbol-font/browser/`

Report any failures to the user with the specific URL and observed behavior.
