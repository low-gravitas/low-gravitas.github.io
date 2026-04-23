# Claude instructions — lowgravitas.com

Eleventy 3.x static site. Source in `src/`, build output in `_site/`, vendor
artifacts fetched to `vendor/` at build time (SHA-pinned via `artifacts.json`
and `artifacts.lock.json`).

## Running the dev server

Always start it on **port 4747** so it lines up with puma-dev:

```
bin/dev
# or
pnpm dev        # same thing via package.json
```

puma-dev proxies both `https://lowgravitas.test` and
`https://www.lowgravitas.test` to `localhost:4747` (config files:
`~/.puma-dev/lowgravitas`, `~/.puma-dev/www.lowgravitas`). Test by
pointing the browser at `https://lowgravitas.test` — you get real HTTPS,
cookies on the right domain, and live reload.

If you change the dev port, update **both** puma-dev files to match.
The `bin/dev` script honors a `PORT=` env var override.

## File editing conventions

- Edit source in `src/`, never the generated `_site/` output.
- Vendor CSS/fonts in `vendor/` are fetched artifacts — edit upstream, not here.
- Root-relative or relative asset paths only (GitHub Pages / CORS).
- `design-system/` holds design prototypes (`components-v2.html`,
  `patterns-v1.html`, `demos.css`). Served at `/design-system/` only in
  dev — production builds exclude it via `ignores.add("design-system")`
  in `.eleventy.js`. Treat `patterns-v1.html` as the copy-paste-ready
  spec for site components; changes there should track site markup.

## Build and test

```
pnpm build   # prebuild (fetch-artifacts, stage-vendor, verify-palette) + eleventy
pnpm test    # fixture tests for the cache-bust HTML transform
pnpm clean   # rm -rf _site
```

The `prebuild` npm hook runs the vendor pipeline, so CI and local `pnpm
build` share one path — don't duplicate the fetch steps in a workflow.

## Architecture notes

### Theme system

- `data-theme` is set on `<html>` by an **inline head script** in
  `src/_includes/layouts/base.njk` before any stylesheet loads.
- The head script reads `localStorage.theme`, falling back to OS preference
  (`matchMedia('(prefers-color-scheme: light)')`). It's the single source
  of truth — CSS only needs `[data-theme="light"]` / `[data-theme="dark"]`
  selectors, no parallel `@media (prefers-color-scheme: light)` blocks.
- `src/js/theme-toggle.js` handles the click on the nav toggle and OS
  preference changes after page load.
- If you move the inline head script, make sure it still runs **before**
  any `<link rel="stylesheet">` — otherwise FOUC returns.

### CSS layers

`common.css` declares `@layer tokens, base, components, pages;`.
- `tokens` — raw scale tokens (`--text-*`, `--radius-*`, `--shadow-*`,
  `--leading-*`, `--dur-*`, `--ease-*`, `--font-*`) stay unprefixed and
  are shared with vendor. The site semantic layer uses `--lg-*` prefixes
  (`--lg-bg`, `--lg-surface-*`, `--lg-accent`, `--lg-accent-fg`, `--lg-text`,
  etc.) with `[data-theme="light"]` overrides.
- `base` — reset, self-hosted `@font-face` declarations, body, headings,
  links, skip-link, aurora background, reduced-motion.
- `components` — `.iri-rim` rotating rim system, `.btn`, `.card`,
  `.callout`, `.segmented`, `.pill`, `.badge`, form controls
  (`.input`, `.textarea`, `.select`, `.check`, `.radio`, `.toggle`,
  `.slider`), modal/tooltip/toast/popover, top-nav, hero, footer.
- `pages` — page-scoped CSS in `theme.css` (palette strip + IDE/terminal
  mocks with zen palette scoped via `--z-*`) and `symbol-font.css` (glyph
  browser toolbar + virtual card grid + modal + selection panel).

`blog.css` extends `.prose` for blog-post typography, code blocks, and
images; `.post-content` and `.page-content` layer on top.

### Symbol font loading

- `@font-face` lives in `common.css` — always available with `font-display:
  swap`, no preload (it's 2.7 MB; preloading blocked LCP on every page).
- The full 620 KB `low-gravitas-symbols.css` (11,800+ named `.lg-*`
  classes) is only loaded when a page sets `symbolsCss: true` in its
  front matter — currently just the glyph browser.
- Pages using raw Unicode codepoints with `class="lg"` get the font via
  `common.css`; they don't need the full symbols CSS.

### Vendor artifact pipeline

- `artifacts.json` pins tags (e.g. `theme: v2.0.0`). `artifacts.lock.json`
  stores SHA-256 hashes per file. Both are committed.
- `scripts/fetch-artifacts.mjs` downloads pinned releases, verifies hashes
  (TOFU on first run), uses `vendor/.fetched-<tag>` sentinel for skip-if-
  unchanged, supports `LGZ_USE_VENDOR_LOCAL=1` for sibling-repo dev work.
- `scripts/stage-vendor.mjs` copies pristine vendor files to
  `vendor/generated/` and rewrites `@font-face url()` with cache-busting
  query strings.
- `scripts/bump-upstream.mjs` automates tag bumps with a diff summary.
- `scripts/verify-palette.mjs` is a contract test on the palette shape.
- `scripts/build-utils.mjs` owns `buildHash` and the `cacheBust` HTML
  transform, shared by `.eleventy.js`, `src/_data/site.js`, and
  `scripts/test-cache-bust.mjs`.

### Code samples

`src/theme/index.njk` can consume `vendor/code-samples.html` (generated
upstream from `palette.toml`) via `src/_data/codeSamples.js` if the page
wants to use upstream-authored highlighted code. Current markup uses
inline tk-* spans. Syntax-highlighted markup uses semantic classes
(`tk-keyword`, `tk-string`, etc.) that resolve through the `--z-*` tokens
scoped in `theme.css`.

## Deferred / known gaps

- Glyph browser modal still uses custom `<div>` backdrop + dialog instead
  of the native `<dialog>` element (the blog lightbox uses `<dialog>`).
  Would benefit from consolidation but is a ~90-line refactor.
- `--text-dim` contrast on `--grad-surface` light end may fail WCAG AA —
  needs a design decision on whether to darken the dim tone or lighten
  the surface.

## Working with Claude

- User prefers terse output, no trailing summaries of the diff.
- No `Co-Authored-By` trailer on commits (memory: `feedback_no_coauthored.md`).
- `Todo.local.md` is gitignored — safe for scratch checklists.
- Editing CSS? Double-check the light-mode tokens in `common.css`
  `[data-theme="light"]` blocks — a single-selector change now propagates
  to both explicit and OS-preference light modes.
