# Stratos E2E Testing

This directory contains end-to-end (e2e) tests for the Stratos application using Playwright.

## Why E2E Tests Are at Project Root

This directory is intentionally located at `/e2e` (project root) rather than within `/src`. This follows:

- **Angular CLI conventions**: Angular projects place e2e tests at root by default
- **Playwright best practices**: E2E test infrastructure belongs at project root
- **Architectural separation**: E2E tests are test infrastructure, not application source code

### Key Principles

**E2E tests are NOT source code** - They:
- Test the compiled/built application (not source files)
- Never get deployed to production
- Have development-only dependencies (Playwright, test fixtures)
- Validate the integrated system (frontend + backend)

**The `/src` directory is for application source** - It contains:
- Code that compiles into production artifacts
- Code with runtime dependencies
- Code that end-users interact with

### Monorepo Context

In this multi-language monorepo:
- `src/frontend/packages/` - Angular application source
- `src/jetstream/` - Go backend source
- `/e2e` - Test infrastructure that validates the full stack

E2E tests don't "belong" to frontend or backend source - they test the **integrated system**.

## Directory Structure

```
e2e/
├── components/      # Reusable UI component abstractions
├── fixtures/        # Test data and mock fixtures
├── helpers/         # Shared test utilities
├── pages/           # Page Object Model classes
├── scripts/         # Test-specific scripts
└── tests/           # Actual test specifications
```

## Running E2E Tests

```bash
# Run all e2e tests
bun run e2e

# Run with UI mode (interactive)
bun run e2e:ui

# Run in debug mode
bun run e2e:debug

# Run specific test file
bunx playwright test e2e/tests/application/application-wall.spec.ts
```

## Configuration

E2E test configuration is in `playwright.config.ts` at project root.

## Writing Tests

Follow the Page Object Model pattern:
1. Create page objects in `e2e/pages/`
2. Create reusable components in `e2e/components/`
3. Write test specs in `e2e/tests/`

Example:
```typescript
import { test, expect } from '../fixtures/fixtures';
import { ApplicationsPage } from '../pages/applications.page';

test('should display applications', async ({ page }) => {
  const appsPage = new ApplicationsPage(page);
  await appsPage.goto();
  await expect(appsPage.heading).toBeVisible();
});
```

## Role suites

`e2e/tests/roles/` holds one directory per CF role plus `every-role.spec.ts`,
run by the `role-*` projects in `playwright.config.ts`, each on its own saved
session (`e2e/.auth/role-<role>.json`, written by `e2e/auth.roles.setup.ts`).
They assert what a role can do, what the console must refuse, and carry a
canary per file written to assert the leak and marked with `test.fail()`, so
the run only stays green while the refusal holds.

The console must use UAA auth (`AUTH_ENDPOINT_TYPE=remote`), where a console
user is a CF user: local auth has one console user and cannot express roles.
jetstream reads the environment before `config.properties`, so:

```bash
AUTH_ENDPOINT_TYPE=remote UAA_ENDPOINT=https://uaa.example.com \
CONSOLE_CLIENT=cf CONSOLE_ADMIN_SCOPE=cloud_controller.admin SKIP_SSL_VALIDATION=true \
E2E_PROFILE=<profile> bunx playwright test --project='role-*'
```

Each CF endpoint entry in the profile needs a `creds.roles` block (see
`secrets.yaml.template`); a role whose entry is missing fails its setup
rather than running as another identity.

The suite reads `secrets.yaml` from the repo root (git-ignored), not a copy
under `e2e/`. After a `@playwright/test` bump, run `bunx playwright install
chromium` once: each Playwright version wants its own browser build, and a
missing one fails every project at the admin setup.

## Migration History

This project migrated from Protractor to Playwright in 2024 during the Angular 20 upgrade. Legacy Protractor artifacts may still exist in `src/test-e2e/` but are no longer active.

## Further Reading

- [Playwright Documentation](https://playwright.dev)
- [Angular CLI E2E Testing](https://angular.io/guide/testing#end-to-end-testing)
- [Project Architecture Decision](/docs/decisions/e2e-test-location.md) (if exists)
