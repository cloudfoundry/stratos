# Stratos Branding and Theming System

This package provides Stratos with a unified branding and theming
system built on Tailwind CSS and Angular signals. A single service
(`StratosBrandingService`) replaces the previous
`CompanyConfigService` + `StratosThemeService` split and manages a
four-layer preference cascade.

## Four-Layer Cascade

```
Layer 1: Config (company-config.json)
  Defaults for everything: branding, colors, login, page size, view mode, sidebar

  Layer 2: Login (config.login.*)
    Login page only -- no user context yet, no dark/light mode

    Layer 3: User Preference (post-auth, localStorage)
      Overrides config: dark/light/system, sidebar, gravatar, polling, timeout

      Layer 4: Page Preference (per-list, localStorage)
        Overrides user/config: page size, card/table, sort, filters
```

| Layer | When | What it controls | Source |
|-------|------|-----------------|--------|
| 1 | Bootstrap | Company name, logos, all colors, navigation, layout, defaults | `company-config.json` |
| 2 | Login page render | Login-specific appearance (title, subtitle, background, card) | `config.login.*` |
| 3 | Post-authentication | Theme mode, sidebar state, polling, session timeout, gravatar | localStorage or config defaults |
| 4 | Per-list interaction | Page size, card/table view, sort direction, filters | localStorage per list |

Layers 1 and 2 are applied in the constructor. Layer 3 is activated
only after authentication via `activateUserPreferences()`. Layer 4
defaults are exposed as getter methods but managed by individual
list components.

## How to Rebrand

Edit or provide a `company-config.json` file. No code changes required.

### Configuration Load Order

At startup, `StratosBrandingService` attempts to load configuration
from these locations in order:

1. `/assets/company-config.json` (primary)
2. `/assets/config/company.json` (environment-specific fallback)
3. Built-in defaults (if neither file exists)

### Complete company-config.json Schema

```json
{
  "company": {
    "name": "Acme Corp",
    "displayName": "Acme Cloud",
    "website": "https://acme.example.com",
    "supportEmail": "support@acme.example.com"
  },
  "logos": {
    "main": "/assets/acme-logo.png",
    "navigation": "/assets/acme-nav-logo.png",
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
    "cardBackground": "#ffffff",
    "customMessage": "Welcome to Acme Cloud"
  },
  "footer": {
    "copyright": "2026 Acme Corp. All rights reserved.",
    "additionalInfo": "Version 5.0"
  },
  "defaults": {
    "themeMode": "light",
    "sidebarOpen": true,
    "sidebarPinned": true,
    "pollingEnabled": true,
    "sessionTimeout": true,
    "gravatarEnabled": true,
    "pageSize": 9,
    "pageSizeCards": [5, 9, 18],
    "pageSizeTable": [5, 10, 25, 50],
    "viewMode": "cards",
    "sortDirection": "asc"
  }
}
```

### Field Reference

| Section | Field | Required | Description |
|---------|-------|----------|-------------|
| `company.name` | string | Yes | Company name used in branding and page title |
| `company.displayName` | string | No | Display name (falls back to `name`) |
| `company.website` | string | No | Company website URL |
| `company.supportEmail` | string | No | Support contact email |
| `logos.main` | string | Yes | Main logo for login page and headers |
| `logos.navigation` | string | Yes | Logo for expanded navigation bar |
| `logos.navigationIcon` | string | Yes | Icon-only logo for collapsed nav |
| `logos.favicon` | string | Yes | Browser favicon |
| `logos.loginBackground` | string | No | Login page background image |
| `theme.primary` | hex color | Yes | Primary brand color |
| `theme.secondary` | hex color | Yes | Secondary brand color |
| `theme.accent` | hex color | Yes | Accent highlights |
| `theme.success` | hex color | Yes | Success status color |
| `theme.warning` | hex color | Yes | Warning status color |
| `theme.danger` | hex color | Yes | Error/danger color |
| `theme.info` | hex color | Yes | Informational color |
| `navigation.background` | color | Yes | Sidebar background |
| `navigation.text` | color | Yes | Sidebar text color |
| `navigation.hover` | color | Yes | Sidebar hover effect |
| `navigation.active` | color | Yes | Active nav item highlight |
| `layout.background` | color | Yes | Page background |
| `layout.text` | color | Yes | Primary text color |
| `layout.headerBackground` | color | Yes | Header bar background |
| `layout.headerText` | color | Yes | Header bar text |
| `login.title` | string | Yes | Login page heading |
| `login.subtitle` | string | No | Subtitle under heading |
| `login.showLogo` | boolean | Yes | Show/hide logo on login |
| `login.showTitle` | boolean | Yes | Show/hide title on login |
| `login.backgroundColor` | color | No | Login page background color |
| `login.cardBackground` | color | No | Login card background |
| `login.customMessage` | string | No | Custom message on login page |
| `footer.copyright` | string | No | Copyright text |
| `footer.additionalInfo` | string | No | Additional footer info |
| `defaults.themeMode` | `light`/`dark`/`system` | No | Default theme mode |
| `defaults.sidebarOpen` | boolean | No | Sidebar open by default |
| `defaults.sidebarPinned` | boolean | No | Sidebar pinned by default |
| `defaults.pollingEnabled` | boolean | No | Polling enabled by default |
| `defaults.sessionTimeout` | boolean | No | Session timeout enabled |
| `defaults.gravatarEnabled` | boolean | No | Gravatar enabled |
| `defaults.pageSize` | number | No | Default items per page |
| `defaults.pageSizeCards` | number[] | No | Page size options for card view |
| `defaults.pageSizeTable` | number[] | No | Page size options for table view |
| `defaults.viewMode` | `table`/`cards` | No | Default list view mode |
| `defaults.sortDirection` | `asc`/`desc` | No | Default sort direction |

## Service API Summary

### Signals (Reactive State)

| Signal | Type | Description |
|--------|------|-------------|
| `theme` | `Signal<StratosTheme>` | Current resolved theme |
| `themeMode` | `Signal<ThemeMode>` | Current mode: `light`, `dark`, or `system` |
| `isDarkMode` | `Signal<boolean>` | Resolved dark mode state |
| `config` | `Signal<CompanyConfig>` | Current company configuration |
| `userPrefsActive` | `Signal<boolean>` | Whether Layer 3 has been activated |

### Theme Mode

| Method | Description |
|--------|-------------|
| `setThemeMode(mode)` | Set to `light`, `dark`, or `system` |
| `getThemeMode()` | Get current mode |
| `toggleTheme()` | Toggle between light and dark |

### Branding Accessors

| Method | Returns |
|--------|---------|
| `getCompanyName()` | Company name string |
| `getCopyrightText()` | Copyright text |
| `getMainLogo()` | Main logo URL |
| `getNavigationLogo()` | Nav bar logo URL |
| `getNavigationIcon()` | Collapsed nav icon URL |
| `getLoginTitle()` | Login page title |
| `getLoginSubtitle()` | Login page subtitle |
| `getBrandingInfo()` | Full branding object |
| `getLoginConfig()` | Full login config object |

### Config Defaults (Layer 4)

| Method | Default |
|--------|---------|
| `getDefaultPageSize()` | `9` |
| `getDefaultViewMode()` | `'cards'` |
| `getDefaultSortDirection()` | `'asc'` |
| `getDefaultSidebarOpen()` | `true` |
| `getDefaultPollingEnabled()` | `true` |

### Runtime Overrides

| Method | Description |
|--------|-------------|
| `setCompanyBranding(branding)` | Override branding (logos, names) |
| `setLoginCustomization(login)` | Override login appearance |
| `setColors(colors)` | Override color scheme |
| `setTheme(theme)` | Override full theme |
| `setCompanyConfig(config)` | Replace full config |

### Config Export/Import

| Method | Description |
|--------|-------------|
| `exportConfig()` | Export config as JSON string |
| `importConfig(json)` | Import config from JSON string |
| `resetToDefault()` | Reset to built-in defaults |
| `exportTheme()` | Export resolved theme as JSON |
| `importTheme(json)` | Import theme from JSON |
| `resetTheme()` | Reset theme (clear branding overrides) |

## Initialization Flow

```
1. App bootstrap --> StratosBrandingService constructor
   |
2. initializeBranding()
   |-- Add 'theme-initializing' class (FOUC prevention)
   |-- Check app version (clear stale prefs on upgrade)
   |-- Set up prefers-color-scheme media query listener
   |-- Apply defaultTheme CSS vars (Layer 1)
   |-- Start async load of company-config.json (updates Layer 1)
   |-- setTimeout 100ms --> remove 'theme-initializing' class
   |
3. Login page renders (Layers 1+2 only -- no dark/light mode)
   |
4. User authenticates
   |-- auth.effects.ts calls branding.activateUserPreferences()
   |
5. activateUserPreferences() (Layer 3)
   |-- Load branding overrides from localStorage
   |-- Load theme mode from localStorage or config defaults
   |-- Apply theme mode (adds/removes dark-theme class)
   |
6. Dashboard renders (all four layers active)
   |-- Per-list components read Layer 4 defaults via getters
   |-- Users interact --> preferences saved to localStorage
```

## CustomizationService (Extension Slots Only)

`CustomizationService` is a separate service that handles extension
component injection. It has no role in branding, colors, or theming.

| Slot | Type | Purpose |
|------|------|---------|
| `aboutInfoComponent` | Component | Custom about page content |
| `supportInfoComponent` | Component | Custom support page content |
| `noEndpointsComponent` | Component | Custom no-endpoints page |
| `alwaysShowNavForEndpointTypes` | Function | Force nav items for endpoint types |
| `hasEula` | boolean | Whether EULA acceptance is required |

## Extension Theming

Extension pages inherit theming automatically through CSS custom
properties on `:root`. There is no per-endpoint override mechanism.
Extensions should use semantic Tailwind classes
(`bg-content-bg`, `text-content-text`, etc.) to participate in the
theme system.

## Key Files

| File | Purpose |
|------|---------|
| `stratos-branding.service.ts` | Unified branding service (all four layers) |
| `company-config.interface.ts` | `CompanyConfig` TypeScript interface |
| `theme.config.ts` | `StratosTheme` interface, `defaultTheme`, `darkTheme` |
| `theme.module.ts` | Angular module |
| `index.ts` | Package exports |
| `styles/main.scss` | CSS custom properties (`:root`, `.dark-theme`) |
| `theme-transitions.scss` | FOUC prevention, smooth transitions |

## localStorage Keys

| Key | Content | Layer |
|-----|---------|-------|
| `stratos-theme-mode` | `light` / `dark` / `system` | 3 |
| `stratos-branding` | `{ branding: {...}, login: {...} }` | 3 |
| `stratos-company-config` | Full `CompanyConfig` JSON | 1 |
| `stratos-app-version` | Build version string | Version gate |
| `stratos-show-all-menu-items` | Boolean | UI preference |

On app version change, non-user keys are cleared to prevent stale
config from persisting across upgrades.
