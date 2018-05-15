import { DashboardPage } from './dashboard.po';
import { E2EHelpers, ConsoleUserType } from '../helpers/e2e-helpers';
import { browser } from 'protractor';

// Dashboard page not implemented
xdescribe('Dashboard', () => {
  const helpers = new E2EHelpers();
  const dashboardPage = new DashboardPage();

  beforeAll(() => {
    helpers.setupApp(ConsoleUserType.admin);
  });

  beforeEach(() => {
    dashboardPage.navigateTo();
  });

  it('- should reach dashboard page', () => {
    expect(dashboardPage.isDashboardPage()).toBeTruthy();
  });
});
