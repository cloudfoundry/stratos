# Theming Architecture

This document describes how the Stratos theme system works, how CSS
variables flow through the application, and how to use semantic tokens
correctly in templates and styles.

## System Overview

The theme system has four layers that work together:

```
┌─────────────────────────────────────────────────────┐
│  StratosThemeService (Angular)                      │
│  Sets inline CSS variables on <html>                │
│  Manages dark/light mode + branding persistence     │
├─────────────────────────────────────────────────────┤
│  main.scss (:root / .dark-theme)                    │
│  Defines all CSS custom properties                  │
│  Dark overrides via .dark-theme selector on <body>  │
├─────────────────────────────────────────────────────┤
│  tailwind.config.js                                 │
│  Maps CSS variables to semantic Tailwind tokens     │
│  e.g. text-content-text → var(--content-text)       │
├─────────────────────────────────────────────────────┤
│  Component templates                                │
│  Use semantic tokens: bg-content-bg, text-primary   │
│  NOT raw colors: bg-white, text-gray-500            │
└─────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/frontend/packages/theme/theme.service.ts` | Angular service — mode switching, CSS variable application, branding persistence |
| `src/frontend/packages/theme/theme.config.ts` | Light/dark theme definitions (StratosTheme interface) |
| `src/frontend/packages/theme/styles/main.scss` | CSS custom properties (:root defaults, .dark-theme overrides), component base styles |
| `src/frontend/packages/theme/theme-transitions.scss` | FOUC prevention, smooth transitions, reduced-motion support |
| `tailwind.config.js` | Semantic color tokens mapping CSS variables to Tailwind classes |
| `src/frontend/packages/core/src/shared/components/theme-toggle/` | Toggle button UI |

## CSS Variable Categories

### Brand Colors

Set by the theme service and used for primary interactive elements.

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--color-primary` | `#3b82f6` | `#60a5fa` | Buttons, links, active states |
| `--color-secondary` | `#60a5fa` | `#38bdf8` | Secondary actions |
| `--color-accent` | `#60a5fa` | `#38bdf8` | Accents, highlights |
| `--color-success` | `#22c55e` | `#4ade80` | Success states, running apps |
| `--color-warning` | `#f59e0b` | `#fbbf24` | Warning badges |
| `--color-danger` | `#ef4444` | `#f87171` | Errors, delete actions |
| `--color-info` | `#3b82f6` | `#60a5fa` | Info badges |

### Navigation

Controls the left sidebar.

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--nav-bg` | `#1e293b` | `#0f172a` | Sidebar background |
| `--nav-text` | `#ffffff` | `#f1f5f9` | Menu item text |
| `--nav-text-muted` | `rgba(255,255,255,0.7)` | `rgba(241,245,249,0.7)` | Secondary nav text |
| `--nav-hover` | `rgba(255,255,255,0.1)` | `rgba(241,245,249,0.1)` | Hover background |
| `--nav-active` | `rgba(255,255,255,0.15)` | `rgba(241,245,249,0.15)` | Active item background |
| `--nav-border` | `rgba(255,255,255,0.1)` | `rgba(241,245,249,0.1)` | Separator lines |

### Layout

Controls the main page structure outside of content areas.

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--app-bg` | `#f8fafc` | `#0f172a` | Page background (html) |
| `--body-bg` | `#f1f5f9` | `#020617` | Body background |
| `--app-text` | `#1e293b` | `#f1f5f9` | Default text color |
| `--text-muted` | `#64748b` | `#94a3b8` | Secondary text |
| `--header-bg` | `#ffffff` | `#1e293b` | Top header bar |
| `--header-text` | `#1e293b` | `#f1f5f9` | Header text |
| `--header-border` | `#e2e8f0` | `#334155` | Header bottom border |

### Content

Controls content areas, cards, and panels within the page.

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--content-bg` | `#ffffff` | `#1e293b` | Content area background |
| `--content-secondary` | `#f8fafc` | `#0f172a` | Alternating row, secondary bg |
| `--content-border` | `#e2e8f0` | `#334155` | Content area borders |
| `--content-text` | `#1e293b` | `#f1f5f9` | Content text |
| `--content-muted` | `#64748b` | `#94a3b8` | Muted/secondary text |

### Cards

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--card-bg` | `#ffffff` | `#1e293b` | Card background |
| `--card-border` | `#e5e7eb` | `#334155` | Card borders |
| `--card-header-bg` | `#f9fafb` | `#0f172a` | Card header sections |
| `--card-shadow` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.3)` | Card elevation shadow |

### Tables

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--table-header-bg` | `#f9fafb` | `#0f172a` | Table header row |
| `--table-header-text` | `#1e293b` | `#cbd5e1` | Table header text |
| `--table-row-hover` | `#f9fafb` | `#334155` | Row hover highlight |
| `--table-border` | `#e5e7eb` | `#334155` | Row dividers |

### Inputs

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--input-bg` | `#ffffff` | `#1e293b` | Input background |
| `--input-border` | `#d1d5db` | `#475569` | Input border |
| `--input-text` | `#1e293b` | `#f1f5f9` | Input text |
| `--input-placeholder` | `#9ca3af` | `#64748b` | Placeholder text |
| `--input-focus-border` | `var(--color-primary)` | `var(--color-primary)` | Focus ring |
| `--input-disabled-bg` | `#f3f4f6` | `#0f172a` | Disabled state |

### Status Badges

Each status has background, text, and border variants:

| Status | Light bg/text/border | Dark bg/text/border |
|--------|---------------------|---------------------|
| Success | `#dcfce7` / `#166534` / `#86efac` | `#14532d` / `#86efac` / `#22c55e` |
| Warning | `#fef3c7` / `#92400e` / `#fcd34d` | `#78350f` / `#fcd34d` / `#f59e0b` |
| Danger | `#fee2e2` / `#991b1b` / `#fca5a5` | `#7f1d1d` / `#fca5a5` / `#ef4444` |
| Info | `#dbeafe` / `#1e40af` / `#93c5fd` | `#1e3a8a` / `#93c5fd` / `#3b82f6` |

## Screen Region Map

```
┌──────────────────────────────────────────────────────────┐
│ --header-bg / --header-text                    [Toggle]  │
├────────┬─────────────────────────────────────────────────┤
│        │ --app-bg (page background)                      │
│ --nav  │  ┌──────────────────────────────────────────┐   │
│  -bg   │  │ .card  →  --card-bg / --card-border      │   │
│        │  │                                          │   │
│ --nav  │  │  --content-text (body text)               │   │
│  -text │  │  --content-muted (secondary text)         │   │
│        │  │                                          │   │
│ --nav  │  │  ┌──────────────────────────────────┐    │   │
│  -hover│  │  │ table  →  --table-header-bg      │    │   │
│        │  │  │           --table-border          │    │   │
│ --nav  │  │  │           --table-row-hover       │    │   │
│  -active  │  └──────────────────────────────────┘    │   │
│        │  │                                          │   │
│        │  │  ┌────────────────┐                      │   │
│        │  │  │ input →        │                      │   │
│        │  │  │ --input-bg     │                      │   │
│        │  │  │ --input-border │                      │   │
│        │  │  └────────────────┘                      │   │
│        │  └──────────────────────────────────────────┘   │
├────────┴─────────────────────────────────────────────────┤
│ paginator area  →  --content-bg / --content-border       │
└──────────────────────────────────────────────────────────┘
```

## Using Semantic Tokens in Templates

### Correct: Semantic Tailwind classes

These resolve to CSS variables and respond to dark/light mode:

```html
<!-- Backgrounds -->
<div class="bg-content-bg">          <!-- var(--content-bg) -->
<div class="bg-app-bg">             <!-- var(--app-bg) -->
<div class="bg-nav-bg">             <!-- var(--nav-bg) -->

<!-- Text -->
<span class="text-content-text">    <!-- var(--content-text) -->
<span class="text-content-muted">   <!-- var(--content-muted) -->
<span class="text-nav-text">        <!-- var(--nav-text) -->
<span class="text-header-text">     <!-- var(--header-text) -->

<!-- Borders -->
<div class="border-content-border"> <!-- var(--content-border) -->
<div class="border-nav-border">     <!-- var(--nav-border) -->

<!-- Brand colors -->
<button class="bg-primary">         <!-- var(--color-primary) -->
<span class="text-danger">          <!-- var(--color-danger) -->
<span class="text-success">         <!-- var(--color-success) -->
```

### Incorrect: Raw Tailwind colors

These are hardcoded and will NOT respond to dark/light mode:

```html
<!-- DON'T use these -->
<div class="bg-white">              <!-- Always white -->
<div class="bg-gray-50">            <!-- Always light gray -->
<span class="text-gray-500">        <!-- Always medium gray -->
<span class="text-gray-900">        <!-- Always dark -->
<div class="border-gray-200">       <!-- Always light border -->
```

### Migration patterns

| Instead of | Use |
|-----------|-----|
| `bg-white` | `bg-content-bg` |
| `bg-gray-50` | `bg-content-secondary` |
| `text-gray-900` | `text-content-text` |
| `text-gray-500` / `text-gray-600` | `text-content-muted` |
| `border-gray-200` | `border-content-border` |
| `hover:bg-gray-50` | `hover:bg-content-secondary` |
| `bg-gray-100` (input disabled) | Use `--input-disabled-bg` variable |

### Using CSS variables directly in SCSS

When Tailwind classes aren't sufficient:

```scss
// Correct — uses CSS variable
.my-component {
  background-color: var(--card-bg);
  border-color: var(--card-border);
  color: var(--content-text);
}

// Incorrect — hardcoded hex color
.my-component {
  background-color: #ffffff;
  border-color: #e5e7eb;
  color: #1e293b;
}
```

## Initialization Sequence

```
1. StratosThemeService constructor
   │
2. initializeTheme()
   ├── Add 'theme-initializing' class (disables transitions)
   ├── Set up prefers-color-scheme media query listener
   ├── Load custom branding from localStorage ('stratos-branding')
   ├── Load saved mode from localStorage ('stratos-theme-mode')
   │   └── Default: 'light' (if no saved preference)
   │
3. applyThemeMode(mode)
   ├── Resolve mode → boolean isDark
   │   └── 'system' checks window.matchMedia('(prefers-color-scheme: dark)')
   ├── Toggle CSS classes on DOM:
   │   ├── <body>: add/remove 'dark-theme'
   │   └── <html>: add/remove 'dark'
   ├── Select base theme: darkTheme or defaultTheme
   ├── Merge custom branding overrides
   └── applyTheme() → set 40+ CSS variables on <html>
   │
4. updateBranding() → set page title and favicon
   │
5. setTimeout 100ms → remove 'theme-initializing' class
   └── Transitions now enabled for smooth theme switching
```

## Persistence

Two independent localStorage keys:

| Key | Content | Purpose |
|-----|---------|---------|
| `stratos-theme-mode` | `'light'` / `'dark'` / `'system'` | User's mode preference |
| `stratos-branding` | JSON `{ branding: {...}, login: {...} }` | Custom company branding |

These are independent so that:
- Switching dark/light preserves custom branding
- Custom branding doesn't store color values that conflict with mode

## Build Integration

Theme styles are included globally via `angular.json`:

```json
"styles": [
  "src/frontend/packages/theme/styles/main.scss",
  "src/frontend/packages/theme/theme-transitions.scss",
  "src/frontend/packages/core/src/styles.scss",
  "node_modules/xterm/css/xterm.css"
]
```

Order matters — `main.scss` defines CSS variables first, then
transitions, then component styles.

## Adding a New CSS Variable

1. Add to `:root` in `main.scss` with light mode value
2. Add to `.dark-theme` in `main.scss` with dark mode value
3. Add to `defaultTheme` in `theme.config.ts` (must match `:root`)
4. Add to `darkTheme` in `theme.config.ts` (must match `.dark-theme`)
5. If needed as inline style, add `root.style.setProperty()` call in
   `applyTheme()` in `theme.service.ts`
6. Optionally add a semantic Tailwind token in `tailwind.config.js`
   under `theme.extend.colors`

## Known Gaps

As of 2026-03-19:

- **38+ template files** use raw gray classes without dark mode variants
- **16+ files** use `bg-white` without `dark:` or semantic alternatives
- **308+ hardcoded hex colors** in SCSS files across 27 files
- **Page side nav** has no dark mode support
- **Dialog/snackbar services** generate hardcoded Tailwind classes

See FWT-811 comments for the full gap analysis.
