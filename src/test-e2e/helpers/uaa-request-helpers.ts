import { promise } from 'protractor';
import request from 'request-promise-native';

import { e2e } from '../e2e';
import { E2EUaa } from '../e2e.types';
import { RequestHelpers } from './request-helpers';

export class UaaRequestHelpers extends RequestHelpers {

  request: any;
  token: string;
  uaaConfig: E2EUaa;

  constructor() {
    super();
    this.uaaConfig = e2e.secrets.getDefaultCFsUaa();
    this.request = this.newRequest({
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json;charset=utf-8',
      },
      resolveWithFullResponse: true,
      jar: request.jar(),
      timeout: 30000
    });
    request.debug = false;
  }

  setup(): promise.Promise<any> {
    if (this.token) {
      // Skip, setup not required
      return promise.fullyResolved(true);
    }
    return this.createUaaToken(this.request).then(token => this.token = token);
  }

  getHost(): string {
    return this.uaaConfig.tokenEndpoint;
  }

  createUaaHeader = () => {
    const header = {
      authorization: `bearer ${this.token}`,
    };
    if (this.uaaConfig.zone) {
      header['X-Identity-Zone-Subdomain'] = this.uaaConfig.zone;
    }
    return header;
  }

  sendGet(url: string): promise.Promise<any> {
    return this.sendUaaRequest(url, 'GET').then(JSON.parse);
  }

  sendPost(url: string, body: string): promise.Promise<any> {
    return this.sendUaaRequest(url, 'POST', body);
  }

  sendDelete(url: string): promise.Promise<any> {
    return this.sendUaaRequest(url, 'DELETE');
  }

  private sendUaaRequest(url: string, method: string, body?: string): promise.Promise<any> {
    return this.setup()
      .then(() => this.sendRequest(this.request, {
        headers: this.createUaaHeader(),
        method,
        url
      }, body)
      ).catch(error => {
        // Track the url against the error. Sometimes we don't get this from the stack trace
        e2e.log(`Failed to handle UAA request to url: '${url}'. Reason: '${error}'`);
        throw error;
      });
  }

  private createUaaToken(req): promise.Promise<string> {
    const uaa = e2e.secrets.getDefaultCFsUaa();
    const client = `client_id=${uaa.creds.clientId}`;
    const secret = `client_secret=${uaa.creds.clientSecret}`;
    const grantType = `grant_type=${uaa.creds.grantType || 'client_credentials'}`;
    const body = `${client}&${secret}&${grantType}&token_format=opaque`;
    return this.sendRequest(req, {
      method: 'POST', url: `oauth/token`, headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, body)
      .then(res => {
        const tokenResponse = JSON.parse(res);
        return tokenResponse.access_token;
      })
      .catch(error => {
        // Track the url against the error. Sometimes we don't get this from the stack trace
        e2e.log(`Failed to create UAA token. Reason: '${error}'`);
        throw error;
      });
  }

}
