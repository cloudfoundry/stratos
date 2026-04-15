import { test, expect } from '../../fixtures/test-base';
import { HomePage } from '../../pages/home.page';

/**
 * Home Page E2E Tests
 * Migrated from src/test-e2e/home/home-e2e.spec.ts
 *
 * Tests the home/dashboard page functionality
 */
test.describe('Home', () => {
  test('should reach home page', async ({ connectedEndpointsUserPage }) => {
    // Page is already connected with endpoints as user
    const homePage = new HomePage(connectedEndpointsUserPage.page);

    // Navigate to home page
    await homePage.navigateTo();

    // Verify we're on the home page
    expect(await homePage.isDashboardPage()).toBeTruthy();
  });
});
