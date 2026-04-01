# Branding Architecture

This document describes the unified branding and theming architecture
introduced by `StratosBrandingService`. It covers the design
rationale, the four-layer preference cascade, the initialization
flow, and how to customize branding for a deployment.

## Problem

The original system had five overlapping concerns spread across
multiple services:

1. `CompanyConfigService` -- loaded `company-config.json`, managed
   company name, logos, and login page appearance.
2. `StratosThemeService` -- managed dark/light mode, applied CSS
   variables, persisted branding overrides to localStorage.
3. A store-based `ThemeService` (NgRx) -- duplicated theme state in
   the store, created race conditions with the CSS-variable-based
   service.
4. `CustomizationService` -- mixed branding fields (company name,
   logo, copyright) alongside extension component slots.
5. `theme.config.ts` -- default/dark theme objects with no connection
   to the config file.

This led to:
- Conflicting sources of truth for company name, logo, and colors
- Theme mode loading before authentication (dark mode flash on login)
- No clear layering between config defaults and user preferences
- Extension slots entangled with branding state

## Solution: StratosBrandingService

A single service that owns all branding, theming, and preference
defaults, organized into four layers with strict activation order.

`CustomizationService` was stripped to extension component slots only
(see below).

## Four-Layer Cascade

```
Layer 1: Config (company-config.json)
  |  Defaults for everything: branding, colors, login, page size,
  |  view mode, sidebar
  |
  +-- Layer 2: Login (config.login.*)
  |     Login page only -- no user context yet, no dark/light mode
  |
  +---- Layer 3: User Preference (post-auth, localStorage)
  |       Overrides config: dark/light/system, sidebar, gravatar,
  |       polling, timeout
  |
  +------ Layer 4: Page Preference (per-list, localStorage)
            Overrides user/config: page size, card/table, sort, filters
```

### Layer 1: Config

Loaded from `company-config.json` (or built-in defaults). Sets all
visual properties: company identity, logos, brand colors, navigation
colors, layout colors, login page appearance, and preference defaults.

Applied synchronously from `defaultTheme` in the constructor, then
updated asynchronously when the config file loads.

### Layer 2: Login

A subset of Layer 1 that controls the login page: title, subtitle,
background image/color, card background, logo visibility. Applied in
the constructor so the login page renders correctly before any user
context exists.

Theme mode (dark/light) is intentionally NOT applied here -- the login
page always uses the config's colors without dark-mode overrides.

### Layer 3: User Preference

Activated after authentication by calling
`activateUserPreferences()`. Loads from localStorage:

- Theme mode (`stratos-theme-mode`): light, dark, or system
- Branding overrides (`stratos-branding`): custom logos, names

Falls back to `config.defaults.themeMode` if no localStorage value
exists.

### Layer 4: Page Preference

Per-list preferences managed by individual list components. The
branding service provides defaults via getter methods:

- `getDefaultPageSize()` -- from `config.defaults.pageSize`
- `getDefaultViewMode()` -- from `config.defaults.viewMode`
- `getDefaultSortDirection()` -- from `config.defaults.sortDirection`

List components read these defaults, then check localStorage for
per-list overrides. The branding service does not manage per-list
storage directly.

## Initialization Flow

```
1. App bootstrap
   |
   v
2. StratosBrandingService constructor
   |-- initializeBranding()
   |   |-- document.body.classList.add('theme-initializing')
   |   |-- checkAppVersion() -- clear stale prefs on upgrade
   |   |-- Set up prefers-color-scheme media query listener
   |   |-- applyTheme(defaultTheme) -- Layer 1 CSS vars
   |   |-- updateBranding(defaultTheme) -- page title, favicon
   |   |-- loadCompanyConfig() -- async HTTP fetch
   |   |   |-- Try /assets/company-config.json
   |   |   |-- Try /assets/config/company.json (fallback)
   |   |   |-- Use built-in defaults (final fallback)
   |   |   +-- setCompanyConfig() -> applyConfigToTheme()
   |   |       Maps config sections to theme:
   |   |         config.theme      -> setColors()
   |   |         config.logos      -> setCompanyBranding()
   |   |         config.login      -> setLoginCustomization()
   |   |         config.navigation -> setTheme()
   |   |         config.layout     -> setTheme()
   |   |
   |   +-- setTimeout 100ms -> remove 'theme-initializing'
   |
3. Login page renders (Layers 1+2 -- no dark mode)
   |
4. User authenticates
   |-- auth.effects.ts dispatches login success
   |-- Calls branding.activateUserPreferences()
   |   |-- Set userPrefsActive signal to true
   |   |-- loadBrandingFromStorage()
   |   |-- Load theme mode from storage or config defaults
   |   +-- applyThemeMode() -- dark/light class on <body>/<html>
   |
5. Dashboard renders (all four layers active)
```

### FOUC Prevention

The `theme-initializing` class on `<body>` disables CSS transitions
during initial theme application. It is removed after 100ms, allowing
smooth transitions for subsequent theme changes (e.g., toggling dark
mode).

### App Version Gate

On startup, `checkAppVersion()` compares the stored version
(`stratos-app-version` in localStorage) against the build version.
When they differ, non-user preference keys are cleared:

- `stratos-theme-mode`
- `stratos-branding`
- `stratos-company-config`
- `stratos-show-all-menu-items`

This prevents stale config from persisting across upgrades.

## File Map

| File | Role |
|------|------|
| `src/frontend/packages/theme/stratos-branding.service.ts` | Unified service -- all four layers |
| `src/frontend/packages/theme/company-config.interface.ts` | `CompanyConfig` TypeScript interface |
| `src/frontend/packages/theme/theme.config.ts` | `StratosTheme` interface, `defaultTheme`, `darkTheme` |
| `src/frontend/packages/theme/theme.module.ts` | Angular module |
| `src/frontend/packages/theme/index.ts` | Package exports |
| `src/frontend/packages/theme/styles/main.scss` | CSS custom properties (`:root`, `.dark-theme`) |
| `src/frontend/packages/theme/theme-transitions.scss` | FOUC prevention, reduced-motion support |
| `src/frontend/packages/store/src/effects/auth.effects.ts` | Calls `activateUserPreferences()` post-auth |
| `src/frontend/packages/core/src/core/customizations.types.ts` | `CustomizationService` (extension slots only) |
| `tailwind.config.js` | Maps CSS variables to semantic Tailwind tokens |

## CSS Custom Properties

`StratosBrandingService.applyTheme()` sets 40+ CSS custom properties
on `document.documentElement`:

- **Brand colors**: `--color-primary`, `--color-secondary`,
  `--color-accent`, `--color-success`, `--color-warning`,
  `--color-danger`, `--color-info`
- **Navigation**: `--nav-bg`, `--nav-text`, `--nav-text-muted`,
  `--nav-hover`, `--nav-active`, `--nav-border`, `--nav-tooltip`
- **Layout**: `--app-bg`, `--body-bg`, `--app-text`, `--text-muted`,
  `--header-bg`, `--header-text`, `--header-border`, `--content-bg`,
  `--content-secondary`, `--content-border`, `--content-text`,
  `--content-muted`
- **Branding**: `--logo-bg`
- **Login**: `--login-bg`, `--login-bg-image`, `--login-card-bg`
- **Cards**: `--card-bg`, `--card-border`, `--card-header-bg`,
  `--card-shadow`
- **Tables**: `--table-header-bg`, `--table-header-text`,
  `--table-row-hover`, `--table-border`
- **Inputs**: `--input-bg`, `--input-border`, `--input-text`,
  `--input-placeholder`, `--input-disabled-bg`
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`

Components consume these via Tailwind semantic classes (e.g.,
`bg-content-bg`, `text-content-text`) or direct `var()` references
in SCSS. See `docs/theming-architecture.md` for the full variable
table with light/dark values.

## How Extension Pages Inherit Theming

Extension pages inherit theming automatically because CSS custom
properties set on `:root` cascade to all descendants. There is no
per-endpoint override mechanism. Extensions should:

1. Use semantic Tailwind classes (`bg-content-bg`, `text-content-text`,
   `border-content-border`, etc.)
2. Use `var(--variable-name)` in custom SCSS when Tailwind classes are
   not sufficient
3. Avoid hardcoded hex colors or raw Tailwind grays

No special registration or configuration is needed for extension pages
to participate in the theme system.

## CustomizationService Scope

`CustomizationService` was stripped of all branding fields. It now
handles only extension component slots:

```typescript
interface CustomizationsMetadata {
  hasEula?: boolean;
  aboutInfoComponent?: any;
  supportInfoComponent?: any;
  noEndpointsComponent?: any;
  alwaysShowNavForEndpointTypes?: (epType: string) => boolean;
}
```

These slots allow extension packages (e.g., `example-extensions`) to
inject custom Angular components into predefined locations in the
shell (about page, support page, no-endpoints state).

## localStorage Keys

| Key | Value | Layer | Cleared on upgrade |
|-----|-------|-------|--------------------|
| `stratos-theme-mode` | `light` / `dark` / `system` | 3 | Yes |
| `stratos-branding` | JSON `{ branding, login }` | 3 | Yes |
| `stratos-company-config` | Full `CompanyConfig` JSON | 1 | Yes |
| `stratos-show-all-menu-items` | Boolean string | UI | Yes |
| `stratos-app-version` | Build version string | Gate | No |

Per-list localStorage keys (Layer 4) are managed by individual list
components and are not cleared on upgrade.

## How to Rebrand

1. Create or edit `/assets/company-config.json` in your deployment
   (or in the theme package source at
   `src/frontend/packages/theme/assets/company-config.json`)
2. Set company name, logos, colors, navigation appearance, layout
   colors, login page, and copyright
3. Optionally set `defaults` for user/page preferences
4. Build with `make build cf` and deploy -- zero code changes

See the theme package `README.md` for the complete
`company-config.json` schema with all fields documented.

## Testing

### Unit Tests

Unit tests for `StratosBrandingService` are in:

```
src/frontend/packages/core/src/shared/services/stratos-branding.service.spec.ts
```

Tests cover:
- Layer 1: default config application
- Layer 3: `activateUserPreferences()` behavior
- Theme mode persistence and resolution
- Idempotent activation (calling twice is a no-op)

### E2E Tests

E2E tests verify branding in the deployed application. Theming is
validated as part of the login and dashboard page tests. Tests run
against the deployed instance (not localhost) using the Playwright
test runner.

### Manual Verification

1. Clear localStorage and reload -- login page should show config
   branding without dark mode
2. Authenticate -- dashboard should reflect user's saved theme mode
3. Toggle dark/light -- all components should update, no hardcoded
   colors visible
4. Provide a custom `company-config.json` -- rebuild and verify all
   branding updates (logos, colors, login page, copyright)
