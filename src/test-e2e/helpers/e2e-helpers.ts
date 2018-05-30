import { ElementArrayFinder, browser, by, element } from 'protractor';
import { promise, protractor } from 'protractor/built';
import { ElementFinder } from 'protractor/built/element';
import { LoginPage } from '../login/login.po';
import { SecretsHelpers } from './secrets-helpers';

// This makes identification of acceptance test apps easier in case they leak


export enum ConsoleUserType {
  admin = 1,
  user = 2
}

export class E2EHelpers {

  static e2eItemPrefix = 'acceptance.e2e.';

  secrets = new SecretsHelpers();

  constructor() { }

  static createCustomName = (prefix: string, isoTime?: string) => prefix + '.' + (isoTime || (new Date()).toISOString());

  getHost(): string {
    return browser.baseUrl;
  }

  newBrowser() {
    return browser.forkNewDriverInstance(true);
  }

  setupApp(loginUser?: ConsoleUserType, keepCookies?: boolean): promise.Promise<any> {

    this.setBrowserNormal();
    if (!keepCookies) {
      browser.manage().deleteAllCookies();
    }

    browser.get('/').then(() => {
      browser.executeScript('window.sessionStorage.setItem("STRATOS_DISABLE_ANIMATIONS", true);');
    });

    if (loginUser) {
      // When required we should check that the PP is setup correctly (contains correct endpoints with correct state) before running
      // attempting to log in.

      // Guide through login pages
      const loginPage = new LoginPage();
      if (loginUser as ConsoleUserType === ConsoleUserType.admin) {
        return loginPage.login(this.secrets.getConsoleAdminUsername(), this.secrets.getConsoleAdminPassword());
      } else {
        return loginPage.login(this.secrets.getConsoleNonAdminUsername(), this.secrets.getConsoleNonAdminPassword());
      }
    } else {
      return promise.fulfilled(true);
    }
  }

  setBrowserNormal() {
    browser.manage().window().setSize(1366, 768);
  }

  setBrowserSmall() {
    browser.manage().window().setSize(640, 480);
  }

  setBrowserWidthSmall() {
    browser.manage().window().setSize(640, 768);
  }

  setBrowserSize(width, height) {
    browser.manage().window().setSize(width, height);
  }

  /*
   * Form helpers
   */
  getForm(formName): ElementFinder {
    return element(by.css('form[name="' + formName + '"]'));
  }

  getFormFields(formName): ElementArrayFinder {
    return this.getForm(formName).all(by.css('input, textarea, select'));
  }

  getFormField(formName, fieldName): ElementFinder {
    return this.getForm(formName).element(by.css('[name="' + fieldName + '"]'));
  }

  getAttribute(field, attr): ElementFinder {
    return field.getAttribute(attr);
  }

  getFieldType(field): ElementFinder {
    return this.getAttribute(field, 'type');
  }

  /**
   * @forceDate
   * @description Force the Date constructor to always return a given YEAR/MONTH/DAY
   */
  forceDate(year: number, month: number, day: number) {
    browser.driver.executeScript('' +
      '__forceDate_oldDate=Date; Date = function(){ return new __forceDate_oldDate(' + year + ', ' + month + ',' + day + ')};'
    );
  }

  /**
   * @resetDate
   * @description Reset the Date constructor back to normal
   */
  resetDate() {
    browser.driver.executeScript('' +
      'Date=__forceDate_oldDate; delete __forceDate_oldDate;'
    );
  }


  hasClass(element, cls) {
    return element.getAttribute('class')
      .then((classes) => {
        return classes.split(' ').indexOf(cls) !== -1;
      });
  }

  isButtonEnabled(element) {
    return element.getAttribute('disabled')
      .then((isDisabled) => {
        if (isDisabled === 'true') {
          return false;
        }
        if (isDisabled === 'false') {
          return true;
        }
        return isDisabled !== 'disabled';
      })
      .catch(() => {
        // no disabled attribute --> enabled button
        return true;
      });
  }

  scrollIntoView(element) {
    return browser.controlFlow().execute(() => {
      browser.executeScript('arguments[0].scrollIntoView(true)', element.getWebElement());
    });
  }

  waitForElementAndClick(element) {
    const until = protractor.ExpectedConditions;
    browser.wait(until.presenceOf(element), 10000);
    return element.click();
  }



}
