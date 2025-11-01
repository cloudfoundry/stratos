import { test, expect } from '../../fixtures/test-base';
import { EndpointsPage } from '../../pages/endpoints/endpoints.page';
import { ApplicationsPage } from '../../pages/application/applications.page';
import { HomePage } from '../../pages/home.page';
import { MenuComponent } from '../../components';
import { SnackBarComponent } from '../../components';

/**
 * Endpoints E2E Tests
 * Migrated from src/test-e2e/endpoints/endpoints-e2e.spec.ts
 *
 * Tests endpoint page behavior for admin and non-admin users
 * with various endpoint registration states
 */
test.describe('Endpoints', () => {
  test.describe('Workflow on log in (admin/non-admin + no endpoints/some endpoints)', () => {

    test.describe('As Admin', () => {
      test.describe('No registered endpoints', () => {
        test('should reach endpoints dashboard after log in', async ({ noEndpointsAdminPage }) => {
          const endpointsPage = new EndpointsPage(noEndpointsAdminPage);

          // Should be on endpoints page
          expect(await endpointsPage.isActivePage()).toBeTruthy();

          // Should show admin welcome message
          expect(await endpointsPage.isWelcomeMessageAdmin(false)).toBeTruthy();

          // Should not show list (no endpoints)
          expect(await endpointsPage.list.isDisplayed()).toBeFalsy();
        });

        test('should show register button', async ({ noEndpointsAdminPage }) => {
          const endpointsPage = new EndpointsPage(noEndpointsAdminPage);

          // Admin should see add button
          expect(await endpointsPage.header.hasIconButton('add')).toBeTruthy();
        });
      });

      test.describe('Some registered endpoints', () => {
        test('should reach endpoint dashboard after log in', async ({ registeredEndpointsPage }) => {
          const endpointsPage = new EndpointsPage(registeredEndpointsPage);

          expect(await endpointsPage.isActivePage()).toBeTruthy();
        });

        test('welcome snackbar message should be displayed', async ({ registeredEndpointsPage }) => {
          const endpointsPage = new EndpointsPage(registeredEndpointsPage);
          await endpointsPage.waitForPage();

          // Wait for snackbar
          const snackbar = new SnackBarComponent(registeredEndpointsPage);
          await snackbar.waitUntilShown();

          // Should have message about connecting endpoints
          const message = await snackbar.getMessage();
          expect(message.length).toBeGreaterThan(0);

          // Close snackbar
          await snackbar.close();
        });

        test('should show application wall with no clusters message', async ({ registeredEndpointsPage, secrets }) => {
          const endpointsPage = new EndpointsPage(registeredEndpointsPage);

          // Navigate to applications
          await endpointsPage.sideNav.goto('Applications');

          const applicationsPage = new ApplicationsPage(registeredEndpointsPage);

          // Should show "no clusters" message since endpoints not connected
          expect(await applicationsPage.hasNoCloudFoundryMessage()).toBeTruthy();
        });

        test('should show services view with no clusters message', async ({ registeredEndpointsPage }) => {
          const endpointsPage = new EndpointsPage(registeredEndpointsPage);

          // Navigate to services
          await endpointsPage.sideNav.goto('Services');

          // Should show "no clusters" message
          const noCloudFoundryMessage = registeredEndpointsPage.locator('app-no-content-message, .no-content-message');
          await expect(noCloudFoundryMessage).toBeVisible();
        });
      });
    });

    test.describe('As Non-Admin', () => {
      test.describe('No registered endpoints', () => {
        test('should not display endpoint dashboard', async ({ noEndpointsUserPage }) => {
          const endpointsPage = new EndpointsPage(noEndpointsUserPage);

          // Should show non-admin no endpoints page
          expect(await endpointsPage.isNonAdminNoEndpointsPage()).toBeTruthy();
          expect(await endpointsPage.isWelcomeMessageNonAdmin()).toBeTruthy();
        });
      });

      test.describe('Some registered endpoints', () => {
        test('should reach endpoint page', async ({ page, secrets, endpointManager }) => {
          // Setup: clear and register (but don't connect) as admin
          await endpointManager.clearAllEndpoints();
          await endpointManager.registerDefaultCloudFoundry();

          // Now login as user
          await page.goto('/login');
          await page.locator('input[name="username"]').first().fill(secrets.console.user.username);
          await page.locator('input[name="password"]').first().fill(secrets.console.user.password);
          await page.locator('button[type="submit"]').click();
          await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });

          const endpointsPage = new EndpointsPage(page);
          await endpointsPage.waitForPage();

          // Wait for and close snackbar
          const snackbar = new SnackBarComponent(page);
          try {
            await snackbar.waitUntilShown();
            await snackbar.close();
          } catch {
            // Snackbar may not appear
          }

          // Should be on endpoints page
          expect(await endpointsPage.isActivePage()).toBeTruthy();
        });

        test('should not show register button', async ({ page, secrets, endpointManager }) => {
          // Setup
          await endpointManager.clearAllEndpoints();
          await endpointManager.registerDefaultCloudFoundry();

          // Login as user
          await page.goto('/login');
          await page.locator('input[name="username"]').first().fill(secrets.console.user.username);
          await page.locator('input[name="password"]').first().fill(secrets.console.user.password);
          await page.locator('button[type="submit"]').click();
          await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });

          const endpointsPage = new EndpointsPage(page);
          await endpointsPage.waitForPage();

          // User should NOT see add button
          expect(await endpointsPage.header.hasIconButton('add')).toBeFalsy();
        });

        test('should show at least one endpoint', async ({ page, secrets, endpointManager }) => {
          // Setup
          await endpointManager.clearAllEndpoints();
          await endpointManager.registerDefaultCloudFoundry();

          // Login as user
          await page.goto('/login');
          await page.locator('input[name="username"]').first().fill(secrets.console.user.username);
          await page.locator('input[name="password"]').first().fill(secrets.console.user.password);
          await page.locator('button[type="submit"]').click();
          await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });

          const endpointsPage = new EndpointsPage(page);
          await endpointsPage.waitForPage();

          // Close snackbar if present
          const snackbar = new SnackBarComponent(page);
          try {
            await snackbar.waitUntilShown();
            await snackbar.close();
          } catch {
            // Snackbar may not appear
          }

          // Should show list
          expect(await endpointsPage.list.isDisplayed()).toBeTruthy();

          // Should be in cards view
          expect(await endpointsPage.list.isCardsView()).toBeTruthy();

          // Should have 1 endpoint
          const cardCount = await endpointsPage.list.cards.getCardCount();
          expect(cardCount).toBe(1);
        });

        test('should show correct cards content', async ({ page, secrets, endpointManager }) => {
          // Setup
          await endpointManager.clearAllEndpoints();
          await endpointManager.registerDefaultCloudFoundry();

          // Login as user
          await page.goto('/login');
          await page.locator('input[name="username"]').first().fill(secrets.console.user.username);
          await page.locator('input[name="password"]').first().fill(secrets.console.user.password);
          await page.locator('button[type="submit"]').click();
          await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });

          const endpointsPage = new EndpointsPage(page);
          await endpointsPage.waitForPage();

          // Close snackbar if present
          const snackbar = new SnackBarComponent(page);
          try {
            await snackbar.waitUntilShown();
            await snackbar.close();
          } catch {
            // Snackbar may not appear
          }

          // Get default CF name from secrets
          const cfName = secrets.cloudfoundry[0].name;

          // Get endpoint data
          const endpointData = await endpointsPage.cards.getEndpointDataForEndpoint(cfName);

          // Verify endpoint configuration matches secrets
          const endpointConfig = secrets.cloudfoundry.find(ep => ep.name === endpointData.name);
          expect(endpointConfig).toBeDefined();
          if (endpointConfig) {
            expect(endpointConfig.url).toEqual(endpointData.url);
            expect(endpointConfig.typeLabel || 'Cloud Foundry').toEqual(endpointData.type);
          }

          // Find the card and check menu
          const card = await endpointsPage.cards.findCardByTitle(cfName);
          await card.openActionMenu();

          const menu = new MenuComponent(page);
          await menu.waitUntilShown();

          const items = await menu.getItemMap();

          // Should have connect option (not connected yet)
          expect(items.connect).toBeDefined();

          // Should NOT have disconnect option (not connected)
          expect(items.disconnect).toBeUndefined();

          await menu.close();
        });
      });
    });
  });
});
