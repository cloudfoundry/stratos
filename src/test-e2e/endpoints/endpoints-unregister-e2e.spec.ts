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
          endpointsPage.cards.waitUntilShown();

          // Should have a single row initially
          expect(endpointsPage.cards.getCardCount()).toBe(1);

          // Get the row in the table for this endpoint
          endpointsPage.cards.findCardByTitle(toUnregister.name).then(card => {
            card.openActionMenu();
            const menu = new MenuComponent();
            menu.waitUntilShown();
            menu.clickItem('Unregister');
            menu.waitUntilNotShown();
            ConfirmDialogComponent.expectDialogAndConfirm('Unregister', 'Unregister Endpoint');
            endpointsPage.list.waitForNoLoadingIndicator();
            // Should have removed the only row, so we should see welcome message again
            expect(endpointsPage.isWelcomeMessageAdmin(false)).toBeTruthy();
          });
        });
      });

      // Skip test if we only have one Cloud Foundry endpoint
      describe('Multiple endpoints -', () => {
        if (!e2e.secrets.haveSingleCloudFoundryEndpoint) {
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
            endpointsPage.cards.getCardCount().then(count => endpointCount = count);

            // Get the row in the table for this endpoint
            endpointsPage.cards.findCardByTitle(toUnregister.name).then(card => {
              card.openActionMenu();
              const menu = new MenuComponent();
              menu.waitUntilShown();
              menu.clickItem('Unregister');
              ConfirmDialogComponent.expectDialogAndConfirm('Unregister', 'Unregister Endpoint');
              endpointsPage.list.waitForNoLoadingIndicator();
              expect(endpointsPage.cards.getCardCount()).toBe(endpointCount - 1);
            });
          });
        }
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
        expect(endpointsPage.cards.getCardCount()).toBe(1);

        // Get the row in the table for this endpoint
        endpointsPage.cards.findCardByTitle(toUnregister.name).then(card => {
          card.openActionMenu();
          const menu = new MenuComponent();
          menu.waitUntilShown();
          menu.getItemMap().then(items => {
            expect(items.unregister).not.toBeDefined();
            expect(items.connect).toBeDefined();
          });
        });
      });
    });
  });
});
