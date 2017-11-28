import { E2EHelpers } from '../helpers/e2e-helpers';
import { element, by, browser, promise } from 'protractor';

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
    return element(by.css('.login-message.login-message--show.login-message-error')).getText();
  }
}
