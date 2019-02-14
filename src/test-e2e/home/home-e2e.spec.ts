import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { HomePage } from './home.po';
import { EndpointsPage } from '../endpoints/endpoints.po';

fdescribe('Home', () => {
  const toConnect = e2e.secrets.getDefaultCFEndpoint();
  const dashboardPage = new HomePage();
  const endpointPage = new EndpointsPage();

  beforeAll(() => {
    e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);
  });

  // beforeEach(async () => {

  // });

  it('- should reach home page', async () => {
    await dashboardPage.navigateTo();
    const isActive = await dashboardPage.isActivePage();
    expect(isActive).toBeTruthy();
  });

  fit('- should have favorites list', async () => {
    await endpointPage.navigateTo();
    await endpointPage.table.setEndpointAsFavorite(toConnect.name);
    // await dashboardPage.navigateTo();
    // await dashboardPage.favoritesList.waitUntilShown();
    // const starShown = await dashboardPage.favoritesList.endpointCard.isFavoriteStarShown();
    // expect(starShown).toBe(true);
  });
});
