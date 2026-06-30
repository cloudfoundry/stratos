# Login Routing — Company-Config Key Audit

Verified against `src/frontend/packages/theme/company-config.interface.ts` and
`src/frontend/packages/theme/stratos-branding.service.ts` (`applyConfigToTheme`).

## Keys that reach runtime via company-config.json

These are the ONLY properties for which a `config` routing entry is valid.
All other style facets (typography, spacing, border-radius, etc.) route to
`theme.css` only; Phase 3 runtime will wire them up.

| routing.json `config` value | CompanyConfig path          | Populated by element                    |
|-----------------------------|-----------------------------|-----------------------------------------|
| `backgroundColor`           | `login.backgroundColor`     | `auth.login.page` (surface.background)  |
| `cardBackground`            | `login.cardBackground`      | `auth.login.page.card` (surface.background) |
| `title`                     | `login.title`               | `auth.login.page.card.title` (content)  |
| `subtitle`                  | `login.subtitle`            | `auth.login.page.card.subtitle` (content) |
| `customMessage`             | `login.customMessage`       | `auth.login.page.card.message` (content) |
| `inputBorder`               | `login.inputBorder`         | `auth.login.page.card.username/password` (text.color) |
| `showTitle` (visibility)    | `login.showTitle`           | `auth.login.page.card.title` (visibilityConfig) |
| `showLogo` (visibility)     | `login.showLogo`            | `auth.login.page.card.logo` (visibilityConfig) |
| `logos.main`                | `logos.main`                | `auth.login.page.card.logo` (asset)     |
| `logos.loginBackground`     | `logos.loginBackground`     | `auth.login.page.background` (asset)    |
| `theme.primary`             | `theme.primary`             | `auth.login.page.card.sign-in` (text.color) |
| `theme.danger`              | `theme.danger`              | `auth.login.page.error` (text.color)    |

## Namespace resolution

Container `auth.login → login` (routing.json `containers` map). Config keys
WITHOUT a `.` (e.g. `backgroundColor`) get the `login.` prefix; keys WITH a `.`
(e.g. `logos.main`, `theme.primary`) bypass the namespace and use their literal
dot-path directly.

## Phase 3 deferred

Typography (`text.fontFamily`, `text.fontSize`, `text.fontWeight`, `text.lineHeight`),
surface border (`surface.border`, `surface.borderRadius`), and spacing facets have
no company-config keys today. They project to `theme.css` only via the scoped-block
emitter. Runtime consumption is planned for Phase 3.
