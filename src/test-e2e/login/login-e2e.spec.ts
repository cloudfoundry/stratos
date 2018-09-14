import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { LoginPage } from './login.po';

describe('Login', () => {
  const loginPage = new LoginPage();

  beforeAll(() => {
    e2e.setup(ConsoleUserType.admin)
      .doNotLogin();
  });

  beforeEach(() => {
    loginPage.navigateTo();
  });

  it('- should reach log in page', () => {
    expect(loginPage.isLoginPage()).toBeTruthy();
    expect(loginPage.loginButton().isPresent()).toBeTruthy();
  });

  it('- should reject bad user', () => {
    loginPage.enterLogin('badusername', 'badpassword');
    expect(loginPage.loginButton().isEnabled()).toBeTruthy();

    loginPage.loginButton().click();
    expect(loginPage.isLoginError()).toBeTruthy();
    expect(loginPage.isLoginPage()).toBeTruthy();
  });

  it('- should reject bad password', () => {
    loginPage.enterLogin(e2e.secrets.getConsoleAdminUsername(), 'badpassword');
    expect(loginPage.loginButton().isEnabled()).toBeTruthy();

    loginPage.loginButton().click();
    expect(loginPage.isLoginError()).toBeTruthy();
    expect(loginPage.isLoginPage()).toBeTruthy();
  });

  it('- should accept correct details', () => {
    loginPage.enterLogin(e2e.secrets.getConsoleAdminUsername(), e2e.secrets.getConsoleAdminPassword());
    expect(loginPage.loginButton().isEnabled()).toBeTruthy();

    loginPage.loginButton().click();
    loginPage.waitForApplicationPage();
    expect(loginPage.isLoginPage()).toBeFalsy();
  });
});
