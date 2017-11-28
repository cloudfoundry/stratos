import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import { ElementFinder } from 'protractor/built/element';
import { protractor } from 'protractor/built';
import { getConsole } from '@ngrx/effects/src/effects_module';
import { e2eSecrets } from '../e2e.secrets';
import { browser, element, by, ElementArrayFinder, promise } from 'protractor';

export class E2EHelpers {

  secrets = e2eSecrets;

  constructor() { }

  getHost(): string {
    return browser.baseUrl;
  }

  getConsoleAdminUsername(): string {
    return this.secrets.consoleUsers.admin.username;
  }

  getConsoleAdminPassword(): string {
    return this.secrets.consoleUsers.admin.password;
  }

  getConsoleNonAdminUsername(): string {
    return this.secrets.consoleUsers.nonAdmin.username;
  }

  getConsoleNonAdminPassword(): string {
    return this.secrets.consoleUsers.nonAdmin.password;
  }

  newBrowser() {
    return browser.forkNewDriverInstance(true);
  }

  loadApp(keepCookies): promise.Promise<any> {
    if (!keepCookies) {
      browser.manage().deleteAllCookies();
    }
    return browser.get('/');
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
   * Manage requests + sessions
   */

  /**
   * @createReqAndSession
   * @description
   * @param {object?} optionalReq - convenience, wraps in promise as if req did not exist
   * @param {string?} username -
   * @param {string?} password -
   * @returns {Promise} A promise containing req
   */
  createReqAndSession(optionalReq, username, password): promise.Promise<any> {
    let req;

    if (!optionalReq) {
      req = this.newRequest();

      username = username || this.getConsoleAdminUsername();
      password = password || this.getConsoleAdminPassword();

      return this.createSession(req, username, password).then(() => {
        return req;
      });
    } else {
      return new promise.Promise(() => optionalReq);
    }
  }

  /**
   * @newRequest
   * @description Create a new request
   * @returns {object} A newly created request
   */
  newRequest() {
    const cookieJar = request.jar();
    const skipSSlValidation = browser.params.skipSSlValidation;
    let ca;

    if (skipSSlValidation) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    } else if (browser.params.caCert) {
      let caCertFile = path.join(__dirname, '..', 'dev-ssl');
      caCertFile = path.join(caCertFile, browser.params.caCert);
      if (fs.existsSync(caCertFile)) {
        ca = fs.readFileSync(caCertFile);
      }
    }

    return request.defaults({
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      agentOptions: {
        ca: ca
      },
      jar: cookieJar
    });
  }

  /**
   * @sendRequest
   * @description Send request
   * @param {object} req - the request
   * @param {object} options -
   * @param {object?} body - the request body
   * @param {object?} formData - the form data
   * @returns {Promise} A promise
   */
  sendRequest(req, options, body, formData): promise.Promise<any> {
    return new promise.Promise((resolve, reject) => {
      options.url = this.getHost() + '/' + options.url;
      if (body) {
        options.body = JSON.stringify(body);
      } else if (formData) {
        options.formData = formData;
      }

      let data = '';
      let rejected;
      req(options)
        .on('data', (responseData) => {
          data += responseData;
        })
        .on('error', (error) => {
          reject(`send request failed: ${error}`);
        })
        .on('response', (response) => {
          if (response.statusCode > 399) {
            reject('failed to send request: ' + JSON.stringify(response));
            rejected = true;
          }
        })
        .on('end', () => {
          if (!rejected) {
            resolve(data);
          }
        });
    });
  }

  /**
   * @createSession
   * @description Create a session
   * @param {object} req - the request
   * @param {string} username - the console username
   * @param {string} password - the console password
   * @returns {Promise} A promise
   */
  createSession(req, username, password): promise.Promise<any> {
    return new promise.Promise((resolve, reject) => {
      const options = {
        formData: {
          username: username || 'dev',
          password: password || 'dev'
        }
      };
      req.post(this.getHost() + '/pp/v1/auth/login/uaa', options)
        .on('error', reject)
        .on('response', (response) => {
          if (response.statusCode === 200) {
            resolve(true);
          } else {
            console.log('Failed to create session. ' + JSON.stringify(response));
            reject('Failed to create session');
          }
        });
    });
  }

  /**
   * @isSetupMode
   * @description Check if console is in setup mode
   * @returns {Promise} A promise
   */
  isSetupMode() {
    const req = this.newRequest();
    return new Promise((resolve, reject) => {
      return req.post(this.getHost() + '/pp/v1/auth/login/uaa', {})
        .on('error', reject)
        .on('response', (response) => {
          if (response.statusCode === 503) {
            resolve();
          } else {
            reject();
          }
        });
    });
  }

  /**
   * @forceDate
   * @description Force the Date constructor to always return a given YEAR/MONTH/DAY
   * @param {number} year - the year
   * @param {number} month - the month
   * @param {number} day - the day
   */
  forceDate(year, month, day) {
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
