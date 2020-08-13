import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { HomePage } from './home.po';

describe('Home', () => {
  const dashboardPage = new HomePage();

  beforeAll(() => {
    e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user);
  });

  beforeEach(() => {
    dashboardPage.navigateTo();
  });

  it('- should reach home page', () => {
    expect(dashboardPage.isActivePage()).toBeTruthy();
  });
});
