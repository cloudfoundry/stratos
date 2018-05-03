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
import { LoginPage } from '../login/login.po';

describe('Endpoints', () => {
  const helpers = new E2EHelpers();
  const secrets = new SecretsHelpers();
  const resets = new ResetsHelpers();
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CloudFoundryPage();
  const login = new LoginPage();

  describe('Workflow on log in (admin/non-admin + no endpoints/some endpoints) -', () => {
    describe('As Admin -', () => {

      describe('No registered endpoints', () => {
        beforeAll(() => {
          resetToLoggedIn(resets.removeAllEndpoints, true);
        });

        it('Should reach endpoints dashboard after log in', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();
          expect(endpointsPage.isWelcomeMessageAdmin()).toBeTruthy();
          expect(endpointsPage.list.isPresent()).toBeFalsy();
        });

        it('should show register button', () => {
          expect(endpointsPage.header.hasIconButton('add')).toBeTruthy();
        });

      });

      describe('Some registered endpoints', () => {
        beforeAll(() => {
          resetToLoggedIn(resets.resetAllEndpoints, true);
        });

        it('Should reach endpoint dashboard after log in', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();
        });

        it('Should show application wall with \'no clusters\' message', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.Applications);
          expect(applications.hasNoCloudFoundryMesasge()).toBeTruthy();
        });

        it('Should show services view with \'no clusters\' message', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.Services);
          expect(services.hasNoCloudFoundryMesasge()).toBeTruthy();
        });

        it('Should show Cloud Foundry view with \'no clusters\' message', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.CloudFoundry);
          expect(cloudFoundry.hasNoCloudFoundryMesasge()).toBeTruthy();
        });

        it('Welcome snackbar message should be displayed', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
          const snackBar = new SnackBarComponent();
          expect(snackBar.isDisplayed()).toBeTruthy();
          expect(snackBar.hasMessage(
            'There are no connected Cloud Foundry endpoints, connect with your personal credentials to get started.')
          ).toBeTruthy();
          snackBar.close();
        });
      });
    });

    describe('As Non-Admin -', () => {

      describe('No registered endpoints -', () => {
        beforeAll(() => {
          resetToLoggedIn(resets.removeAllEndpoints, false);
        });

        it('Should not display endpoint dashboard', () => {
          login.waitForNoEndpoints();
          expect(endpointsPage.isNonAdminNoEndpointsPage()).toBeTruthy();
          expect(endpointsPage.isWelcomeMessageNonAdmin()).toBeTruthy();
        });
      });

      describe('Some registered endpoints -', () => {

        beforeAll(() => {
          resetToLoggedIn(resets.resetAllEndpoints, false);
        });

        describe('endpoints table -', () => {
          it('should be displayed', () => {
            expect(endpointsPage.isActivePage()).toBeTruthy();
          });

          it('should not show register button', () => {
            expect(endpointsPage.header.hasIconButton('add')).toBeFalsy();
          });

          it('should show at least one endpoint', () => {
            expect(endpointsPage.list.isDisplayed).toBeTruthy();
            expect(endpointsPage.list.isTableView()).toBeTruthy();
            expect(endpointsPage.list.table.getRows().count()).toBeGreaterThan(0);
          });

          it('should show correct table content', () => {
            // For each endpoint
            // 1) we show the correct type
            // 2) the icon is the correct 'disconnected' one
            // 3) the address is correct
            // 4) the 'connect' button is available in the action menu

            const endpointsTable = endpointsPage.table;
            endpointsTable.getRows().map(row => endpointsTable.getEndpointData(row)).then(data => {
              data.forEach((ep: EndpointMetadata) => {
                const endpointConfig = secrets.getEndpointByName(ep.name);
                expect(endpointConfig).not.toBeNull();
                expect(endpointConfig.url).toEqual(ep.url);
                expect(endpointConfig.typeLabel).toEqual(ep.type);

                endpointsPage.table.getRowForEndpoint(ep.name).then(row => {
                  endpointsPage.table.openActionMenu(row);
                  const menu = new MenuComponent();
                  menu.waitUntilShown();
                  menu.getItemMap().then(items => {
                    expect(items['connect']).toBeDefined();
                    expect(items['disconnect']).not.toBeDefined();
                  });
                  menu.close();
                });
              });
            });
          });
        });
      });
    });
  });
});
