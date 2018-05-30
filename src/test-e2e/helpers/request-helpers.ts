import * as fs from 'fs';
import * as path from 'path';
import { browser, promise } from 'protractor';
import * as request from 'request-promise-native';

import { E2E, e2e } from '../e2e';
import { ConsoleUserType } from './e2e-helpers';

// This helper is used internaly - tests should not need to use this class

export class RequestHelpers {


  constructor() { }

  getHost(): string {
    return browser.baseUrl;
  }

  /**
 * @newRequest
 * @description Create a new request
 */
  newRequest() {
    const cookieJar = request.jar();
    const skipSSLValidation = browser.params.skipSSLValidation;
    let ca;

    if (skipSSLValidation) {
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
   */
  sendRequest(req, options, body?, formData?): promise.Promise<any> {

    const p = promise.defer<any>();

    options.url = this.getHost() + '/' + options.url;
    if (body) {
      options.body = JSON.stringify(body);
    } else if (formData) {
      options.formData = formData;
    }

    E2E.debugLog('REQ: ' + options.method + ' ' + options.url);
    E2E.debugLog('   > ' + JSON.stringify(options));

    req(options).then((response) => {
      E2E.debugLog('OK');
      p.fulfill(response);
    }).catch((e) => {
      E2E.debugLog('ERROR');
      E2E.debugLog(e.statusCode + ' : ' + e.message);
      p.reject(e);
    });

    return p.promise;
  }

  /**
   * @createSession
   * @description Create a session
   * @param {object} req - the request
   */
  createSession(req, userType: ConsoleUserType): promise.Promise<any> {
    const creds = e2e.secrets.getConsoleCredentials(userType);
    const formData = {
      username: creds.username || 'dev',
      password: creds.password || 'dev'
    };
    return this.sendRequest(req, { method: 'POST', url: 'pp/v1/auth/login/uaa' }, null, formData);
  }

  // /**
  //  * @isSetupMode
  //  * @description Check if console is in setup mode
  //  */
  // isSetupMode(): Promise<any> {
  //   const req = this.newRequest();
  //   return new Promise((resolve, reject) => {
  //     return req.post(this.getHost() + '/pp/v1/auth/login/uaa', {})
  //       .on('error', reject)
  //       .on('response', (response) => {
  //         if (response.statusCode === 503) {
  //           resolve();
  //         } else {
  //           reject();
  //         }
  //       });
  //   });
  // }
}
