import { browser, by, element, promise, protractor } from 'protractor';

import { E2EHelpers } from '../helpers/e2e-helpers';
import { ssoHelper } from '../helpers/sso-helper';
import { Component } from '../po/component.po';
import { SSOLoginPage } from './sso-login.po';

const LOGIN_FAIL_MSG = 'Username and password combination incorrect. Please try again.';
const until = protractor.ExpectedConditions;

export class LoginPage {

  helpers = new E2EHelpers();

  navigateTo() {
    return browser.get('/login');
  }

  isLoginPage(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => url === browser.baseUrl + '/login');
  }

  getTitle() {
    return element(by.css('app-root h1')).getText();
  }

  enterLogin(username: string, password: string) {
    const formFields = this.helpers.getFormFields('loginForm');
    formFields.get(0).clear();
    formFields.get(1).clear();
    formFields.get(0).sendKeys(username);
    return formFields.get(1).sendKeys(password);
  }

  loginButton() {
    return this.helpers.getForm('loginForm').element(by.css('button[type="submit"]'));
  }

  getLoginError() {
    return element(by.id('login-error-message')).getText();
  }

  login(username: string, password: string) {
    if (ssoHelper.ssoEnabled) {
      const ssoLoginPage = new SSOLoginPage();
      return ssoLoginPage.login(username, password);
    } else {
      return this.nonSSOLogin(username, password);
    }
  }

  nonSSOLogin(username: string, password: string) {
    this.navigateTo();
    this.enterLogin(username, password);
    this.loginButton().click();

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

  waitForDashboardPage() {
    return browser.wait(until.presenceOf(element(by.tagName('app-dashboard-base'))), 5000);
  }

  // Wait until an application page is shown (one that uses the dashboard base)
  waitForApplicationPage() {
    return browser.wait(until.presenceOf(element(by.tagName('app-dashboard-base'))), 5000);
    // return browser.wait(until.presenceOf(element(by.tagName('app-application-wall'))), 5000);
  }

  waitForLogin() {
    return browser.wait(until.presenceOf(element(by.id('app-login-page'))), 10000);
  }

  waitForNoEndpoints() {
    return browser.wait(until.presenceOf(element(by.tagName('app-no-endpoints-non-admin'))), 10000);
  }

  waitForLoading() {
    return Component.waitUntilNotShown(element(by.id('login__loading')));
  }

}
