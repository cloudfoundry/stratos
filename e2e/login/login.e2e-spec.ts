import { E2EHelpers } from '../helpers/e2e-helpers';
import { AppPage } from '../app.po';
import { LoginPage } from './login.po';
import { e2eSecrets } from '../e2e.secrets';
import { browser } from 'protractor';


describe('Login', () => {
  const helpers = new E2EHelpers();
  const loginPage = new LoginPage();
  const secrets = e2eSecrets;

  beforeAll(() => {
  });

  beforeEach(() => {
    loginPage.navigateTo();
    helpers.setBrowserNormal();
  });

  it('- should reach log in page', () => {
    expect<any>(loginPage.isLoginPage()).toBeTruthy();
    expect<any>(loginPage.getTitle()).toEqual('Login');
  });

  it('- should reject bad user', () => {
    loginPage.enterLogin('badusername', 'badpassword');
    expect(loginPage.loginButton().isEnabled()).toBeTruthy();

    loginPage.loginButton().click();
    expect(loginPage.getLoginError()).toEqual(`Couldn't log in, please try again.`);
    expect<any>(loginPage.isLoginPage()).toBeTruthy();
    browser.driver.sleep(15000);
  });

  it('- should reject bad password', () => {
    loginPage.enterLogin(helpers.getConsoleAdminUsername(), 'badpassword');
    expect(loginPage.loginButton().isEnabled()).toBeTruthy();

    loginPage.loginButton().click();
    expect(loginPage.getLoginError()).toEqual(`Couldn't log in, please try again.`);
    expect<any>(loginPage.isLoginPage()).toBeTruthy();
    browser.driver.sleep(15000);
  });

  it('- should accept correct details', () => {
    loginPage.enterLogin(helpers.getConsoleAdminUsername(), helpers.getConsoleAdminPassword());
    expect(loginPage.loginButton().isEnabled()).toBeTruthy();

    loginPage.loginButton().click();
    expect<any>(loginPage.isLoginPage()).toBeFalsy();
    browser.driver.sleep(15000);
  });
});
