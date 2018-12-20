import { E2EHelpers, ConsoleUserType } from '../helpers/e2e-helpers';
import { HomePage } from './home.po';

describe('Home', () => {
  const helpers = new E2EHelpers();
  const dashboardPage = new HomePage();

  beforeAll(() => {
    helpers.setupApp(ConsoleUserType.admin);
  });

  beforeEach(() => {
    dashboardPage.navigateTo();
  });

  it('- should reach home page', () => {
    expect(dashboardPage.isActivePage()).toBeTruthy();
  });
});
