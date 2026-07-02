# Tailwind CSS v4 Usage

This document describes how Stratos uses Tailwind CSS v4: where the
configuration lives, how the cascade layers interact with our SCSS,
which dark-mode rules apply to which token families, and the gotchas
that only show up at build or dev-server time. For the token system
itself — semantic colors, CSS variables, branding — see
[theming-architecture.md](theming-architecture.md).

## CSS-First Configuration

Tailwind v4 has no `tailwind.config.js`. All configuration lives in
`src/frontend/packages/theme/styles/tailwind.css` as CSS directives:

| Directive | Purpose |
|-----------|---------|
| `@import 'tailwindcss'` | Pulls in the framework (preflight, utilities) |
| `@plugin` | Loads `@tailwindcss/forms` (class strategy) and `@tailwindcss/typography` |
| `@custom-variant dark` | Defines `dark:` as descendants of `.dark` — distinct from `.dark-theme` (see below) |
| `@source` | Tells the scanner which files to read for class names (`packages/*/src/**/*.{html,ts}`) |
| `@source inline(...)` | Safelists classes composed dynamically in code, e.g. `bg-brand-{400,500,600}` |
| `@theme` | Design tokens — every `--color-*`, `--text-*`, `--spacing-*`, etc. becomes a utility |

The file is the single source of truth for tokens. `@keyframes`
referenced by `--animate-*` tokens live at the root of the same file,
below the `@theme` block.

## Build Order

Global styles are listed in `angular.json` and processed in order:

```json
"styles": [
  "src/frontend/packages/theme/styles/tailwind.css",
  "src/frontend/packages/theme/styles/main.scss",
  "src/frontend/packages/theme/theme-transitions.scss",
  "src/frontend/packages/core/src/styles.scss",
  "node_modules/xterm/css/xterm.css"
]
```

Order matters: `tailwind.css` must come first so PostCSS processes it
before any SCSS. `main.scss` then defines the runtime CSS variables
(`:root` / `.dark-theme`) that the `@theme` layout tokens reference.
Do not fold these files into each other or import one from another —
the split is deliberate.

## Cascade Layers — Read This Before Debugging Specificity

Tailwind v4 emits everything inside CSS cascade layers:

```
@layer theme, base, components, utilities;
```

Our SCSS (`main.scss`, `core/src/styles.scss`, the `core/sass/*`
partials, and every component stylesheet) is **unlayered**. Per the
cascade spec, unlayered author CSS beats layered CSS **regardless of
specificity or source order**. This has three practical consequences:

1. **A utility class cannot override an unlayered rule.** If a global
   SCSS rule sets a property, adding `text-sm` or `bg-content-bg` to
   the element does nothing — silently. The escape hatch is the `!`
   prefix (`!text-sm`), but needing it is a signal the global rule is
   in the wrong place.

2. **Global element defaults belong in `@layer base`.** A rule like
   the icon font's `font-size: 24px` is a *default*, not a mandate.
   Wrapping it in `@layer base { ... }` keeps it as the fallback while
   letting any utility override it naturally. Unlayered global rules
   that fight utilities are bugs waiting to be filed (see issue
   [#5539](https://github.com/cloudfoundry/stratos/issues/5539)).

3. **Component SCSS always wins over utilities.** Component
   stylesheets are unlayered, so a component rule beats a template
   utility on the same element. Keep component SCSS to what utilities
   cannot express; when a component rule and a template class both set
   the same property, the class is dead code.

If a utility "doesn't work", check layers before specificity — grep
for an unlayered rule setting the same property.

## Dark Mode — Two Mechanisms, Two Token Families

Stratos has two dark-mode selectors that do different jobs:

- `.dark` on `<html>` drives the Tailwind `dark:` variant
  (via `@custom-variant`).
- `.dark-theme` on `<body>` drives the runtime CSS-variable overrides
  in `main.scss`.

Both are toggled together by `StratosBrandingService`. Which one you
rely on depends on the token family:

### Rule 1: Semantic singletons adapt automatically — no `dark:`

Tokens like `text-danger`, `bg-primary`, `text-content-muted`,
`bg-content-bg`, `ring-primary`, `bg-tentative`, and the input tokens
resolve to CSS variables that `.dark-theme` overrides at runtime. Use
them bare:

```html
<!-- Correct — adapts to dark mode by itself -->
<span class="text-danger">Failed</span>
<div class="bg-content-bg text-content-text">...</div>
```

Pairing these with `dark:` variants is redundant and eventually wrong
(double-adaptation when the variable flips).

### Rule 2: Numbered scales are static — pair with `dark:`

The `*-50` … `*-900` scales (`brand-500`, `danger-shade-700`,
`success-600`, …) are fixed Material palette values that do not shift
with the theme. If a scale color needs a dark-mode counterpart, say
so explicitly:

```html
<!-- Correct — scale colors need explicit dark pairing -->
<span class="text-success-shade-700 dark:text-success-shade-300">
  Running
</span>
```

When in doubt: singleton → bare, numbered → paired.

## `@apply` in Component SCSS

Component stylesheets that use `@apply` must start with:

```scss
@reference 'tailwindcss';
```

This imports utility *definitions* without duplicating their output.
Two constraints:

1. **Only core utilities work.** `@reference 'tailwindcss'` does not
   see our `@theme` tokens, so `@apply text-content-muted` fails —
   **at build time only**. Vitest does not compile component SCSS
   through PostCSS, so the unit suite stays green while `ng build`
   breaks. Use the CSS variable directly instead:

```scss
// Incorrect — builds break, tests don't catch it
.hint { @apply text-content-muted; }

// Correct
.hint { color: var(--content-muted); }
```

2. **Prefer template classes over `@apply`.** `@apply` in component
   SCSS produces unlayered output that then beats utilities (see the
   layers section). Reach for it only when a selector can't be
   expressed in the template (pseudo-elements, third-party DOM).

## Dev-Server Gotcha: Transitive Sass Partials Don't Hot-Reload

The files listed in `angular.json` hot-reload correctly. Files pulled
in transitively via `@use` (e.g. `core/sass/icons.scss` from
`core/src/styles.scss`) trigger a rebuild that reports
`No output file changes` — the browser keeps the stale CSS with no
reload. This is an Angular CLI watch/diff limitation (see issue
[#5540](https://github.com/cloudfoundry/stratos/issues/5540)).

Workaround: after editing a partial, touch and save its parent
`styles.scss` to force the stylesheet update, or restart `ng serve`.
Do not "fix" this by adding partials to `angular.json` — that
duplicates their output into the bundle.

## Checklist for Style Changes

1. **New color/size/shadow token** → add to `@theme` in
   `tailwind.css`; if it must adapt to dark mode, define it as a
   `var()` reference and add the runtime pair to `:root` /
   `.dark-theme` in `main.scss`.
2. **Semantic tokens over raw colors** — `bg-content-bg`, never
   `bg-white`; see the migration table in
   [theming-architecture.md](theming-architecture.md).
3. **Global element default** → `@layer base`, never unlayered.
4. **Dynamically composed class names** → safelist via
   `@source inline(...)` or the scanner will tree-shake them.
5. **`ng build` is the gate.** SCSS/`@apply` breakage does not show
   up in vitest. Build before claiming a style change works.
6. Verify in both light and dark mode — checklist at the end of
   [theming-architecture.md](theming-architecture.md).
