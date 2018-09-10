import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { MenuComponent } from '../po/menu.po';
import { EndpointsPage } from './endpoints.po';

describe('Endpoints', () => {
  const endpointsPage = new EndpointsPage();

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
            endpointsPage.table.openRowActionMenuByRow(row);
            const menu = new MenuComponent();
            menu.waitUntilShown();
            menu.clickItem('Unregister');
            ConfirmDialogComponent.expectDialogAndConfirm('Unregister', 'Unregister Endpoint');
            endpointsPage.table.waitUntilNotBusy();
            // Should have removed the only row, so we should see welcome message again
            expect(endpointsPage.isWelcomeMessageAdmin()).toBeTruthy();
          });
        });
      });

      // Skip test if we only have one Cloud Foundry endpoint
      describe('Multiple endpoints -', e2e.secrets.haveSingleCloudFoundryEndpoint, () => {
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
            endpointsPage.table.openRowActionMenuByRow(row);
            const menu = new MenuComponent();
            menu.waitUntilShown();
            menu.clickItem('Unregister');
            ConfirmDialogComponent.expectDialogAndConfirm('Unregister', 'Unregister Endpoint');
            endpointsPage.table.waitUntilNotBusy();
            endpointsPage.table.getRows().then(rows => {
              expect(rows.length).toBe(endpointCount - 1);
            });
          });
        });
      });
    });

    describe('As User -', () => {

      beforeAll(() => {
        e2e.setup(ConsoleUserType.user)
          .clearAllEndpoints()
          .registerDefaultCloudFoundry();
      });

      it('unregister is not visible', () => {
        expect(endpointsPage.isActivePage()).toBeTruthy();

        // Should have a single row initially
        endpointsPage.table.getRows().then(rows => { expect(rows.length).toBe(1); });

        // Get the row in the table for this endpoint
        endpointsPage.table.getRowForEndpoint(toUnregister.name).then(row => {
          endpointsPage.table.openRowActionMenuByRow(row);
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
