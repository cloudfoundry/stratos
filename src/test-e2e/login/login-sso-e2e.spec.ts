import { browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ssoHelper } from '../helpers/sso-helper';
import { SSOLoginPage } from './sso-login.po';

describe('SSO Login', () => {
  const loginPage = new SSOLoginPage();

  beforeAll(() => {
    e2e.setup(ConsoleUserType.admin)
      .doNotLogin();
    loginPage.logoutUAA();
  });

  beforeEach(() => {
    loginPage.navigateTo();
    // We're expecting Stratos to be configured with SSO login
    expect(ssoHelper.ssoEnabled).toBeTruthy();

    // Turn off angular checking, as the UAA is not an angular app
    browser.waitForAngularEnabled(false);
  });

  afterAll(() => {
    browser.waitForAngularEnabled(true);
  });

  it('- should reach log in page', () => {
    expect(loginPage.isLoginPage()).toBeTruthy();
    expect(loginPage.loginButton().isPresent()).toBeTruthy();
    e2e.sleep(4000);
  });

  it('- should reject bad user', () => {
    loginPage.loginButton().click();
    expect(loginPage.isUAALoginPage()).toBeTruthy();
    loginPage.enterLogin('badusername', 'badpassword');
    loginPage.submit();
    expect(loginPage.isLoginError()).toBeTruthy();
  });

  it('- should reject bad password', () => {
    loginPage.loginButton().click();
    expect(loginPage.isUAALoginPage()).toBeTruthy();
    loginPage.enterLogin(e2e.secrets.getConsoleAdminUsername(), 'badpassword');
    loginPage.submit();
    expect(loginPage.isLoginError()).toBeTruthy();
  });

  it('- should accept correct details', () => {
    loginPage.loginButton().click();
    expect(loginPage.isUAALoginPage()).toBeTruthy();
    loginPage.enterLogin(e2e.secrets.getConsoleAdminUsername(), e2e.secrets.getConsoleAdminPassword());
    loginPage.submit();
    loginPage.waitForApplicationPage();
    expect(loginPage.isLoginPage()).toBeFalsy();
  });
});
