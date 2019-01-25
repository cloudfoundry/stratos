import { e2e } from '../e2e';
import { LoginPage } from '../login/login.po';

describe('Check Availability of an existing system', () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    loginPage.navigateTo();
  });

  it('Should reach log in page', () => {
    expect(loginPage.isLoginPage()).toBeTruthy();
    expect(loginPage.loginButton().isPresent()).toBeTruthy();
  });

  it('Should be able to login', () => {
    loginPage.enterLogin(e2e.secrets.getConsoleAdminUsername(), e2e.secrets.getConsoleAdminPassword());
    expect(loginPage.loginButton().isEnabled()).toBeTruthy();

    loginPage.loginButton().click();
    loginPage.waitForApplicationPage();
    expect(loginPage.isLoginPage()).toBeFalsy();
  });
});
