import { ApplicationsPage } from '../applications/applications.po';
import { CfTopLevelPage } from '../cloud-foundry/cf-level/cf-top-level-page.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { LoginPage } from '../login/login.po';
import { MenuComponent } from '../po/menu.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { SnackBarComponent } from '../po/snackbar.po';
import { ServicesPage } from '../services/services.po';
import { EndpointMetadata, EndpointsPage } from './endpoints.po';

describe('Endpoints', () => {
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CfTopLevelPage();
  const login = new LoginPage();

  describe('Workflow on log in (admin/non-admin + no endpoints/some endpoints) -', () => {
    describe('As Admin -', () => {

      describe('No registered endpoints', () => {
        beforeAll(() => {
          e2e.setup(ConsoleUserType.admin)
            .clearAllEndpoints();
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
          e2e.setup(ConsoleUserType.admin)
            .clearAllEndpoints()
            .registerDefaultCloudFoundry();
        });

        it('Should reach endpoint dashboard after log in', () => {
          expect(endpointsPage.isActivePage()).toBeTruthy();
        });

        it('Should show application wall with \'no clusters\' message', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.Applications);
          expect(applications.hasNoCloudFoundryMessage()).toBeTruthy();
        });

        it('Should show services view with \'no clusters\' message', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.Services);
          expect(services.hasNoCloudFoundryMessage()).toBeTruthy();
        });

        it('Should show Cloud Foundry view with \'no clusters\' message', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.CloudFoundry);
          expect(cloudFoundry.hasNoCloudFoundryMessage()).toBeTruthy();
        });

        it('Welcome snackbar message should be displayed', () => {
          endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
          const snackBar = new SnackBarComponent();
          expect(snackBar.isDisplayed()).toBeTruthy();
          expect(endpointsPage.isNoneConnectedSnackBar(snackBar)).toBeTruthy();
          snackBar.close();
        });
      });
    });

    describe('As Non-Admin -', () => {

      describe('No registered endpoints -', () => {
        beforeAll(() => {
          e2e.setup(ConsoleUserType.user)
            .clearAllEndpoints();
        });

        it('Should not display endpoint dashboard', () => {
          expect(endpointsPage.isNonAdminNoEndpointsPage()).toBeTruthy();
          expect(endpointsPage.isWelcomeMessageNonAdmin()).toBeTruthy();
        });
      });

      describe('Some registered endpoints -', () => {

        beforeAll(() => {
          beforeAll(() => {
            e2e.setup(ConsoleUserType.user)
              .clearAllEndpoints()
              .registerDefaultCloudFoundry();
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
                  const endpointConfig = e2e.secrets.getEndpointByName(ep.name);
                  expect(endpointConfig).not.toBeNull();
                  expect(endpointConfig.url).toEqual(ep.url);
                  expect(endpointConfig.typeLabel).toEqual(ep.type);

                  endpointsPage.table.getRowForEndpoint(ep.name).then(row => {
                    endpointsPage.table.openRowActionMenuByRow(row);
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

            it('Welcome snackbar message should be displayed', () => {
              endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
              const snackBar = new SnackBarComponent();
              expect(snackBar.isDisplayed()).toBeTruthy();
              expect(endpointsPage.isNoneConnectedSnackBar(snackBar)).toBeTruthy();
              snackBar.close();
            });
          });
        });
      });
    });
  });
});
