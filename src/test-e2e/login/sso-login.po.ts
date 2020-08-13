import { browser, by, element, promise, protractor } from 'protractor';
import { E2EHelpers } from '../helpers/e2e-helpers';

const LOGIN_FAIL_MSG = 'Unable to verify email or password. Please try again.';
const until = protractor.ExpectedConditions;

export class SSOLoginPage {

  static ssoLoginURL: string;
  static ssoLastUsername: string;

  helpers = new E2EHelpers();

  navigateTo() {
    return browser.get('/login');
  }

  isLoginPage(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => url === browser.baseUrl + '/login');
  }

  isUAALoginPage(): promise.Promise<boolean> {
    const welcome = element(by.css('.island > h1'));
    return welcome.getText().then(text => text.indexOf('Welcome') === 0);
  }

    getTitle() {
    return element(by.css('app-root h1')).getText();
  }

  enterLogin(username: string, password: string) {
    const usernameField = element(by.css('input[name="username"]'));
    const passwordField = element(by.css('input[name="password"]'));
    usernameField.clear();
    passwordField.clear();
    usernameField.sendKeys(username);
    return passwordField.sendKeys(password);
  }

  submit() {
    const submitField = element(by.css('input[type="submit"]'));
    return submitField.click();
  }

  loginButton() {
    return this.helpers.getForm('loginForm').element(by.css('button[type="submit"]'));
  }

  getLoginError() {
    return element(by.css('.alert-error')).getText();
  }

  login(username: string, password: string) {
    // If this is a different user to last time, then logout first
    if (SSOLoginPage.ssoLastUsername && SSOLoginPage.ssoLastUsername !== username) {
      browser.waitForAngularEnabled(false);
      this.logoutUAA();
    }

    browser.waitForAngularEnabled(false);
    this.navigateTo();
    this.loginButton().click();

    const that = this;
    // We only need to login once, then we are logged in with SSO, so subsequent login
    // do not need to enter credentials - we need to detect this!
    browser.getTitle().then(function (title) {
      if (title.indexOf('Stratos') === -1) {
        if (!SSOLoginPage.ssoLoginURL) {
          // SSO Login
          browser.getCurrentUrl().then(url => {
            SSOLoginPage.ssoLoginURL = url;
          });
        }

        // Login is required
        // Page was redirected to UAA login, so need to disable wait for Angaulr again
        browser.waitForAngularEnabled(false);
        that.enterLogin(username, password);
        that.submit();

        SSOLoginPage.ssoLastUsername = username;

        // UAA might ask us to confirm which scopes we are happy to share
        browser.driver.sleep(3000);
        element(by.id('authorize')).isPresent().then(exists => {
          if (exists) {
            element(by.id('authorize')).click();
          }
          browser.waitForAngularEnabled(true);
        });
      } else {
        browser.waitForAngularEnabled(true);
        browser.wait(() => {
          return browser.getCurrentUrl().then(function (url) {
            return !url.endsWith('/login');
          });
        }, 10000, 'timed out waiting for login');
      }
    });

    // Wait for the page to be ready
    return browser.getCurrentUrl().then((url: string) => {
      if (url.endsWith('/noendpoints')) {
        return this.waitForNoEndpoints();
      } else {
        return this.waitForApplicationPage();
      }
    });
  }

  waitForLoggedIn() {
    return browser.wait(until.presenceOf(element(by.tagName('app-dashboard-base'))), 5000);
  }

  isLoginError() {
    return this.getLoginError().then(text => text === LOGIN_FAIL_MSG);
  }

  waitForDashboardPage() {
    return browser.wait(until.presenceOf(element(by.tagName('app-dashboard-base'))), 5000);
  }

  // Wait until an application page is shown (one that uses the dashboard base)
  waitForApplicationPage() {
    // return browser.wait(until.presenceOf(element(by.tagName('app-application-wall'))), 5000);
    return browser.wait(until.presenceOf(element(by.tagName('app-dashboard-base'))), 5000);
  }

  waitForLogin() {
    return browser.wait(until.presenceOf(element(by.tagName('app-login-page'))), 10000);
  }

  waitForNoEndpoints() {
    return browser.wait(until.presenceOf(element(by.tagName('app-no-endpoints-non-admin'))), 10000);
  }

  logoutUAA() {
    if (SSOLoginPage.ssoLoginURL) {
      return browser.driver.get(this.getLogoutUrl());
    }
  }

  private getLogoutUrl(): string {
    const parts = SSOLoginPage.ssoLoginURL.split('/');
    parts[parts.length - 1] = 'logout.do';
    let logoutUrl = '';
    for (let i = 0; i < parts.length; i++) {
      if (i !== 0) {
        logoutUrl += '/';
      }
      logoutUrl += parts[i];
    }
    return logoutUrl;
  }

}
