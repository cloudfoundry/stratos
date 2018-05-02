import { E2EHelpers, ConsoleUserType } from '../helpers/e2e-helpers';
import { browser } from 'protractor';
import { ResetsHelpers } from '../helpers/reset-helpers';
import { EndpointsPage, EndpointMetadata, resetToLoggedIn } from './endpoints.po';
import { ApplicationsPage } from '../applications/applications.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { CloudFoundryPage } from '../cloud-foundry/cloud-foundry.po';
import { ServicesPage } from '../services/services.po';
import { SnackBarComponent } from '../po/snackbar.po';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { MenuComponent } from '../po/menu.po';

describe('Endpoints', () => {
  const helpers = new E2EHelpers();
  const secrets = new SecretsHelpers();
  const resets = new ResetsHelpers();
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CloudFoundryPage();

  describe('Unregister Endpoints -', () => {

    describe('As Admin -', () => {

      describe('Single endpoint -', () => {

        beforeAll(() => {
          const toUnregister = secrets.getDefaultCFEndpoint();
          // Only bind the default Cloud Foundry endpoint
          resetToLoggedIn(resets.resetAllEndpoints.bind(resets, null, null, false, toUnregister.name), true);
        });

        it('Successfully unregister', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();
          const toUnregister = secrets.getDefaultCFEndpoint();

          // Should have a single row initially
          endpointsPage.table.getRows().then(rows => { expect(rows.length).toBe(1) });

          // Get the row in the table for this endpoint
          endpointsPage.table.getRowForEndpoint(toUnregister.name).then(row => {
            endpointsPage.table.openActionMenu(row);
            const menu = new MenuComponent();
            menu.waitUntilShown();
            menu.clickItem('Unregister');
            // Should have removed the only row, so we should see welcome message again
            expect(endpointsPage.isWelcomeMessageAdmin()).toBeTruthy();
          });
        });
      });

      describe('Multiple endpoints -', () => {

        beforeAll(() => {
          const toUnregister = secrets.getDefaultCFEndpoint();
          // Ensure we have multiple endpoints registered
          resetToLoggedIn(resets.resetAllEndpoints.bind(resets, null, null, true), true);
        });

        it('Successfully unregister', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();
          const toUnregister = secrets.getDefaultCFEndpoint();

          // Current number of rows
          let endpointCount = 0;
          endpointsPage.table.getRows().then(rows => endpointCount = rows.length);

          // Get the row in the table for this endpoint
          endpointsPage.table.getRowForEndpoint(toUnregister.name).then(row => {
            endpointsPage.table.openActionMenu(row);
            const menu = new MenuComponent();
            menu.waitUntilShown();
            menu.clickItem('Unregister');
            endpointsPage.table.getRows().then(rows => {
              expect(rows.length).toBe(endpointCount - 1);
            });
          });
        });
      });
    });

    fdescribe('As User -', () => {

      beforeAll(() => {
        resetToLoggedIn(resets.resetAllEndpoints, false);
      });

      it('unregister is not visible', () => {
        const toUnregister = secrets.getDefaultCFEndpoint();
        expect(endpointsPage.isActivePage()).toBeTruthy();

        // Should have a single row initially
        endpointsPage.table.getRows().then(rows => { expect(rows.length).toBe(1) });

        // Get the row in the table for this endpoint
        endpointsPage.table.getRowForEndpoint(toUnregister.name).then(row => {
          endpointsPage.table.openActionMenu(row);
          const menu = new MenuComponent();
          menu.waitUntilShown();
          menu.getItemMap().then(items => {
            expect(items['unregister']).not.toBeDefined();
            expect(items['connect']).toBeDefined();
          });
        });
      });
    });
  });
});
