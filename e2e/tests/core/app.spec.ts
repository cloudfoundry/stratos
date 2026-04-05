import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/login.page';

/**
 * Application Entry Point Tests
 * Migrated from src/test-e2e/app.e2e-spec.ts
 *
 * Basic application availability test
 */
test.describe('App', () => {
  test('should reach log in page', async ({ unauthenticatedPage }) => {
    // Navigate to root — unauthenticated users should be redirected to login
    await unauthenticatedPage.goto('/');

    const loginPage = new LoginPage(unauthenticatedPage);
    expect(await loginPage.isLoginPage()).toBeTruthy();
  });
});
