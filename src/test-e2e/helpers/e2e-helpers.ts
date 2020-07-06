import { browser, by, element as protractorElement, ElementArrayFinder } from 'protractor';
import { promise, protractor } from 'protractor/built';
import { ElementFinder } from 'protractor/built/element';

import { LoginPage } from '../login/login.po';
import { SecretsHelpers } from './secrets-helpers';


export enum ConsoleUserType {
  admin = 1,
  user = 2
}

export class E2EHelpers {

  static e2eItemPrefix = 'acceptance.e2e.';
  static customOrgSpaceLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_ORG_SPACE_LABEL || process.env.USER);

  secrets = new SecretsHelpers();

  constructor() { }

  // This makes identification of acceptance test apps easier in case they leak
  static createCustomName = (prefix: string, isoTime?: string) =>
    prefix + '.' + (isoTime || (new Date()).toISOString().replace(/[-:.]+/g, ''))

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
      // Allow GitHub API Url to be overridden
      const gitHubUrl = this.secrets.getStratosGitHubApiUrl();
      if (gitHubUrl) {
        browser.executeScript('window.sessionStorage.setItem("STRATOS_GITHUB_API_URL", "' + gitHubUrl + '");');
      }
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
    return protractorElement(by.css('form[name="' + formName + '"]'));
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

  scrollIntoView(element: ElementFinder) {
    return browser.controlFlow().execute(() => {
      browser.executeScript('arguments[0].scrollIntoView(true)', element.getWebElement());
    });
  }

  scrollToTop() {
    return browser.executeScript('window.scrollTo(0,0);');
  }

  scrollToBottom() {
    return browser.executeScript('window.scrollTo(0, document.body.scrollHeight);');
  }

  waitForElementAndClick(element) {
    const until = protractor.ExpectedConditions;
    browser.wait(until.presenceOf(element), 10000);
    return element.click();
  }

  // Cloud Foundry
  getCustomOrgSpaceLabel(isoTime, orgSpace) {
    return E2EHelpers.customOrgSpaceLabel + '.' + orgSpace + '.' + (isoTime || (new Date()).toISOString());
  }

  getEndpointGuid(info, name: string): string {
    expect(info).toBeDefined();
    expect(info.endpoints).toBeDefined();

    let endpointGuid = null;
    Object.keys(info.endpoints).forEach((type) => {
      const endpoints = info.endpoints[type];
      Object.keys(endpoints).forEach((guid) => {
        const endpoint = endpoints[guid];
        if (endpoint.name === name && !endpointGuid) {
          endpointGuid = guid;
        }
      });
    });

    return endpointGuid;
  }

}
