# Theming Architecture

This document describes how the Stratos theme system works, how CSS
variables flow through the application, and how to use semantic tokens
correctly in templates and styles.

## System Overview

The theme system has five layers that work together. For the
service-level architecture and four-layer preference cascade, see
[branding-architecture.md](branding-architecture.md).

```
┌─────────────────────────────────────────────────────┐
│  StratosBrandingService (Angular)                   │
│  Unified service: loads company-config.json,        │
│  applies branding/colors/login, manages dark/light  │
│  mode, persists preferences to localStorage         │
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
| `src/frontend/packages/theme/company-config.interface.ts` | CompanyConfig interface — company info, logos, colors, login, footer |
| `src/frontend/packages/theme/stratos-branding.service.ts` | Unified service — config loading, mode switching, CSS variables, branding |
| `src/frontend/packages/theme/theme.config.ts` | Light/dark theme definitions (StratosTheme interface) |
| `src/frontend/packages/theme/styles/main.scss` | CSS custom properties (:root defaults, .dark-theme overrides), component base styles |
| `src/frontend/packages/theme/theme-transitions.scss` | FOUC prevention, smooth transitions, reduced-motion support |
| `tailwind.config.js` | Semantic color tokens mapping CSS variables to Tailwind classes |
| `src/frontend/packages/core/src/shared/components/theme-toggle/` | Toggle button UI |
| `src/frontend/packages/core/src/features/login/login-page/` | Login page component (themed via signals) |

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
1. StratosBrandingService constructor
   │
2. initializeBranding() — Layers 1+2 only
   ├── Add 'theme-initializing' class (disables transitions)
   ├── checkAppVersion() — clear stale prefs on upgrade
   ├── Set up prefers-color-scheme media query listener
   ├── applyTheme(defaultTheme) — Layer 1 CSS vars
   ├── Async load company-config.json (updates Layer 1)
   └── setTimeout 100ms → remove 'theme-initializing' class
   │
3. Login page renders (Layers 1+2 — no dark/light mode)
   │
4. User authenticates → auth.effects.ts
   │
5. activateUserPreferences() — Layer 3
   ├── Load branding overrides from localStorage
   ├── Load theme mode from localStorage or config defaults
   └── applyThemeMode(mode)
       ├── Resolve mode → boolean isDark
       │   └── 'system' checks prefers-color-scheme
       ├── Toggle CSS classes: dark-theme on <body>, dark on <html>
       ├── Select base theme: darkTheme or defaultTheme
       ├── Merge custom branding overrides
       └── applyTheme() → set 40+ CSS variables on <html>
   │
6. Dashboard renders (all four layers active)
```

## Persistence

| Key | Content | Purpose |
|-----|---------|---------|
| `stratos-theme-mode` | `'light'` / `'dark'` / `'system'` | User's mode preference (Layer 3) |
| `stratos-branding` | JSON `{ branding: {...}, login: {...} }` | Custom branding overrides (Layer 3) |
| `stratos-company-config` | Full `CompanyConfig` JSON | Loaded config (Layer 1) |
| `stratos-app-version` | Build version string | Version gate |

Theme mode and branding are independent so that:
- Switching dark/light preserves custom branding
- Custom branding doesn't store color values that conflict with mode

Non-user keys are cleared on app version change to prevent stale
config from persisting across upgrades.

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
   `applyTheme()` in `stratos-branding.service.ts`
6. Optionally add a semantic Tailwind token in `tailwind.config.js`
   under `theme.extend.colors`

## Company Branding

`StratosBrandingService` is the primary entry point for deployers who
want to customize the look and feel of Stratos for their organization.

### Configuration File

At startup, `StratosBrandingService` attempts to load branding from:

1. `/assets/company-config.json` (primary)
2. `/assets/config/company.json` (environment-specific fallback)
3. Built-in defaults (if neither file exists)

### CompanyConfig Interface

```typescript
interface CompanyConfig {
  company: {
    name: string;          // Company name
    website?: string;      // Company website URL
    supportEmail?: string; // Support contact
  };
  logos: {
    main: string;           // Login page and headers
    navigation: string;     // Navigation bar logo
    navigationIcon: string; // Collapsed nav icon
    favicon: string;        // Browser tab icon
    loginBackground?: string; // Login page background image
  };
  theme: {
    primary: string;   // Primary brand color
    secondary: string; // Secondary brand color
    accent: string;    // Accent highlights
    success: string;   // Success status
    warning: string;   // Warning status
    danger: string;    // Error/danger
    info: string;      // Informational
  };
  navigation: {
    background: string; // Sidebar background
    text: string;       // Sidebar text
    hover: string;      // Hover effect
    active: string;     // Active item highlight
  };
  layout: {
    background: string;       // Page background
    text: string;             // Primary text color
    headerBackground: string; // Header bar background
    headerText: string;       // Header bar text
  };
  login: {
    title: string;           // Login page heading
    subtitle?: string;       // Subtitle under heading
    showLogo: boolean;       // Show/hide logo
    showTitle: boolean;      // Show/hide title
    backgroundColor?: string; // Page background color
    cardBackground?: string;  // Login form card color
    customMessage?: string;   // Custom message text
  };
  footer: {
    copyright?: string;      // Copyright text
    additionalInfo?: string; // Extra footer text
  };
  defaults?: {
    themeMode?: 'light' | 'dark' | 'system';
    sidebarOpen?: boolean;
    sidebarPinned?: boolean;
    pollingEnabled?: boolean;
    sessionTimeout?: boolean;
    gravatarEnabled?: boolean;
    pageSize?: number;
    pageSizeCards?: number[];
    pageSizeTable?: number[];
    viewMode?: 'table' | 'cards';
    sortDirection?: 'asc' | 'desc';
  };
}
```

### Example: company-config.json

```json
{
  "company": {
    "name": "Acme Corp",
    "website": "https://acme.example.com",
    "supportEmail": "support@acme.example.com"
  },
  "logos": {
    "main": "/assets/acme-logo.png",
    "navigation": "/assets/acme-logo.png",
    "navigationIcon": "/assets/acme-icon.png",
    "favicon": "/assets/acme-favicon.ico",
    "loginBackground": "/assets/acme-login-bg.jpg"
  },
  "theme": {
    "primary": "#1a73e8",
    "secondary": "#00897b",
    "accent": "#ff6f00",
    "success": "#2e7d32",
    "warning": "#f57f17",
    "danger": "#c62828",
    "info": "#1565c0"
  },
  "navigation": {
    "background": "#1a237e",
    "text": "#ffffff",
    "hover": "rgba(255, 255, 255, 0.1)",
    "active": "rgba(255, 255, 255, 0.2)"
  },
  "layout": {
    "background": "#fafafa",
    "text": "#212121",
    "headerBackground": "#1a73e8",
    "headerText": "#ffffff"
  },
  "login": {
    "title": "Acme Cloud Console",
    "subtitle": "Powered by Cloud Foundry",
    "showLogo": true,
    "showTitle": true,
    "backgroundColor": "#1a1a2e",
    "cardBackground": "#ffffff"
  },
  "footer": {
    "copyright": "© 2026 Acme Corp. All rights reserved."
  }
}
```

### How Branding Flows

```
company-config.json
  │
  ▼
StratosBrandingService.loadCompanyConfig()
  ├── config.theme      → setColors()
  ├── config.logos       → setCompanyBranding()
  ├── config.login       → setLoginCustomization()
  ├── config.navigation  → setTheme()
  └── config.layout      → setTheme()
       │
       ▼
  applyTheme()
       │
       ▼
  CSS variables on <html> element
       │
       ▼
  Tailwind classes resolve to new values
```

Branding is persisted to `localStorage` under the
`stratos-company-config` key so it survives page refreshes.

For the full service API and four-layer cascade details, see
[branding-architecture.md](branding-architecture.md).

## Login Page Theming

The login page uses Angular signals to reactively apply theme values.
All visual properties come from the `StratosTheme` object, which is
populated either by `theme.config.ts` defaults or by the company
config.

### Login Page Structure

```
┌─────────────────────────────────────────────┐
│  login.backgroundImage / backgroundColor    │
│                                             │
│        ┌─────────────────────┐              │
│        │ login.cardBackground│              │
│        │                     │              │
│        │  [logo]  Title      │              │
│        │          Subtitle   │              │
│        │                     │              │
│        │  [ Username       ] │              │
│        │  [ Password       ] │              │
│        │  [ Sign In        ] │              │
│        └─────────────────────┘              │
│                                             │
└─────────────────────────────────────────────┘
```

### Themeable Login Properties

| Property | Source | Controls |
|----------|--------|----------|
| Background image | `login.backgroundImage` | Full-screen page background |
| Background color | `login.backgroundColor` | Fallback when no image |
| Card background | `login.cardBackground` | Login form card |
| Logo | `branding.logo` | Image in card header |
| Title | `branding.displayName` or `branding.loginTitle` | Main heading |
| Subtitle | `branding.loginSubtitle` | Text below heading |

### Login Page Signals

The login component exposes these as computed signals that
automatically update when the theme changes:

- `loginBackground()` — CSS `background-image` value
- `loginBackgroundColor()` — CSS `background-color` value
- `loginCardBackground()` — card `background-color`
- `themeLogo()` — logo image URL
- `themeTitle()` — heading text
- `themeSubtitle()` — subtitle text

## Styling Common Elements

### Cards

```html
<div class="card bg-card-bg border border-card-border rounded-lg
  shadow-sm">
  <div class="bg-card-header-bg px-4 py-3 border-b
    border-card-border">
    <h3 class="text-content-text font-medium">Card Title</h3>
  </div>
  <div class="p-4 text-content-text">
    <p class="text-content-muted">Secondary information</p>
  </div>
</div>
```

### Tables

```html
<table class="w-full">
  <thead>
    <tr class="bg-table-header-bg text-table-header-text">
      <th class="border-b border-table-border px-4 py-2">Name</th>
    </tr>
  </thead>
  <tbody>
    <tr class="hover:bg-table-row-hover border-b border-table-border">
      <td class="px-4 py-2 text-content-text">Value</td>
    </tr>
  </tbody>
</table>
```

### Buttons

```html
<!-- Primary action -->
<button class="btn btn-primary">Save</button>

<!-- Danger action -->
<button class="bg-danger text-white px-4 py-2 rounded">Delete</button>

<!-- Ghost/subtle action -->
<button class="text-content-muted hover:text-content-text">
  Cancel
</button>
```

### Form Inputs

```html
<input class="input w-full" placeholder="Filter by Name">

<!-- Disabled -->
<input class="input w-full bg-input-disabled-bg" disabled>
```

The `.input` class applies `--input-bg`, `--input-border`,
`--input-text`, and `--input-placeholder` variables. Focus states
use `--input-focus-border`.

### Status Badges

```html
<span class="bg-status-success-bg text-status-success-text
  border border-status-success-border px-2 py-0.5 rounded text-xs">
  Running
</span>

<span class="bg-status-warning-bg text-status-warning-text
  border border-status-warning-border px-2 py-0.5 rounded text-xs">
  Stopped
</span>

<span class="bg-status-danger-bg text-status-danger-text
  border border-status-danger-border px-2 py-0.5 rounded text-xs">
  Error
</span>
```

## Dark Mode Testing Checklist

When styling a new component or modifying existing styles, verify
in both light and dark mode:

1. **Text readability** — content text and muted text are legible
2. **Backgrounds** — cards, inputs, and content areas contrast with
   the page background
3. **Borders** — visible but not overpowering
4. **Hover states** — distinguishable from resting state
5. **Status colors** — success/warning/danger badges remain clear
6. **Form inputs** — placeholder text visible, focus ring clear,
   disabled state distinguishable
7. **No hardcoded colors** — grep your changes for hex values
   (`#fff`, `#1e293b`) and raw Tailwind grays (`text-gray-`,
   `bg-gray-`, `border-gray-`)
