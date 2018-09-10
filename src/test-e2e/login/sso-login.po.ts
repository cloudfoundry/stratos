import { browser, by, element, promise, protractor } from 'protractor';
import { E2EHelpers } from '../helpers/e2e-helpers';

const LOGIN_FAIL_MSG = 'Unable to verify email or password. Please try again.';
const until = protractor.ExpectedConditions;

export class SSOLoginPage {

  helpers = new E2EHelpers();

  navigateTo() {
    return browser.get('/login');
  }

  isLoginPage(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => url === browser.baseUrl + '/login');
  }

  isUAALoginPage(): promise.Promise<boolean> {
    const welcome = element(by.css('.island > h1'));
    return welcome.getText().then(text => text === 'Welcome!');
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
    browser.waitForAngularEnabled(false);
    this.navigateTo();
    this.loginButton().click();
    this.enterLogin(username, password);
    this.submit();

    browser.waitForAngularEnabled(true);

    browser.wait(() => {
      return browser.getCurrentUrl().then(function (url) {
        return !url.endsWith('/login');
      });
    }, 10000, 'timed out waiting for login');

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

  // Wait until an application page is shown (one that uses the dashboard base)
  waitForApplicationPage() {
    return browser.wait(until.presenceOf(element(by.tagName('app-dashboard-base'))), 5000);
  }

  waitForLogin() {
    return browser.wait(until.presenceOf(element(by.tagName('app-login-page'))), 10000);
  }

  waitForNoEndpoints() {
    return browser.wait(until.presenceOf(element(by.tagName('app-no-endpoints-non-admin'))), 10000);
  }

}
