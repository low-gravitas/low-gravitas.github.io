---
name: design-system-check
description: Use when editing CSS or HTML markup for the lowgravitas site — any time a new class, component, or layout pattern is needed, before writing new CSS.
---

# Design System Check

Before writing any new CSS or HTML patterns, check the design system files first.

## Files to Check

| File | Contains |
|------|----------|
| `design-system/patterns-v1.html` | Page-level layouts: hero, card grids, feeds, timeline entries, teaser strips |
| `design-system/components-v2.html` | Reusable components: `.btn`, `.badge`, `.pill`, `.card`, `.callout`, form controls, overlays |

## Decision Tree

1. Need a component or layout? → Read the relevant design-system file first
2. **Match found** → Copy and use it; write no new CSS
3. **Close match** → Extend with a modifier class; update the design system to match
4. **Nothing matches** → Create it; add it to the design system before or alongside shipping

## Token Defaults (reach for these before writing custom values)

- Surfaces: `--lg-bg`, `--lg-grad-surface`, `--lg-grad-pressed`, `--lg-surface-*`
- Text: `--lg-text`, `--lg-text-dim`, `--lg-text-faint`, `--lg-accent-fg`
- Borders: `--lg-border-subtle`, `--lg-border-light`, `--lg-border-medium`
- Scale: `--text-xs/sm/base`, `--radius-sm/md/lg`, `--shadow-raised-sm`, `--dur-fast`

## After Shipping New Patterns

Add them to the design system immediately — don't wait:
- New page sections → `patterns-v1.html`
- New reusable components → `components-v2.html`

## Common Failures

- Writing `display: flex; align-items: center; gap: …` from scratch when `.btn`, `.card`, or another component already handles that layout
- Defining new semantic color variables when `--lg-accent-fg`, `--lg-text-dim` etc. cover the need
- Shipping new utility classes (`.summary-pill`, `.wn-chip`) without adding them to `components-v2.html`
- Shipping new page patterns (changelog timeline, teaser strip) without adding them to `patterns-v1.html`
