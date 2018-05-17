import { ApplicationsPage } from '../applications/applications.po';
import { CloudFoundryPage } from '../cloud-foundry/cloud-foundry.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { MenuComponent } from '../po/menu.po';
import { ServicesPage } from '../services/services.po';
import { EndpointsPage } from './endpoints.po';

describe('Endpoints', () => {
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CloudFoundryPage();

  describe('Unregister Endpoints -', () => {

    const toUnregister = e2e.secrets.getDefaultCFEndpoint();

    describe('As Admin -', () => {

      describe('Single endpoint -', () => {

        beforeAll(() => {
          // Only register the default Cloud Foundry endpoint
          e2e.setup(ConsoleUserType.admin)
          .clearAllEndpoints()
          .registerDefaultCloudFoundry();
        });

        it('Successfully unregister', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();

          // Should have a single row initially
          endpointsPage.table.getRows().then(rows => { expect(rows.length).toBe(1); });

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
          // Ensure we have multiple endpoints registered
          e2e.setup(ConsoleUserType.admin)
          .clearAllEndpoints()
          .registerMultipleCloudFoundries();
        });

        it('Successfully unregister', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();

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

    describe('As User -', () => {

      beforeAll(() => {
        e2e.setup(ConsoleUserType.admin)
        .loginAs(ConsoleUserType.user)
        .clearAllEndpoints()
        .registerDefaultCloudFoundry();
      });

      it('unregister is not visible', () => {
        expect(endpointsPage.isActivePage()).toBeTruthy();

        // Should have a single row initially
        endpointsPage.table.getRows().then(rows => { expect(rows.length).toBe(1); });

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
