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

## Migration History

This project migrated from Protractor to Playwright in 2024 during the Angular 20 upgrade. Legacy Protractor artifacts may still exist in `src/test-e2e/` but are no longer active.

## Further Reading

- [Playwright Documentation](https://playwright.dev)
- [Angular CLI E2E Testing](https://angular.io/guide/testing#end-to-end-testing)
- [Project Architecture Decision](/docs/decisions/e2e-test-location.md) (if exists)
