import { promise } from 'protractor';

import { e2e } from '../e2e';
import { E2EEndpointConfig } from '../e2e.types';
import { ConsoleUserType } from './e2e-helpers';
import { RequestHelpers } from './request-helpers';

const reqHelpers = new RequestHelpers();

// This class is used internalyl and should not need to be used directly by tests

/**
 * Helpers to reset the back-end to a given state
 */
export class ResetsHelpers {

  constructor() { }

  /**
   * Get all of the registered Endpoints and connect all of them for which credentials
   * have been configured
   */
  connectAllEndpoints(req, userType: ConsoleUserType = ConsoleUserType.admin) {
    return reqHelpers.sendRequest(req, { method: 'GET', url: 'api/v1/endpoints' })
      .then(response => {
        const cnsis = JSON.parse(response);
        const p = promise.fulfilled({});
        cnsis.forEach((cnsi) => {
          const list = e2e.secrets.getEndpoints()[cnsi.cnsi_type] as E2EEndpointConfig[];
          if (!list) {
            fail('Unknown endpoint type');
          }
          const found = list.find((ep) => {
            return ep.url.endsWith(cnsi.api_endpoint.Host);
          });
          if (found) {
            const user = userType === ConsoleUserType.admin ? found.creds.admin : found.creds.nonAdmin || found.creds.admin;
            p.then(() => this.doConnectEndpoint(req, cnsi.guid, user.username, user.password));
          }
        });
        return p;
      });
  }

  /**
   * Get all of the registered Endpoints and connect all of them for which credentials
   * have been configured
   */
  connectEndpoint(req, endpointName: string, userType: ConsoleUserType = ConsoleUserType.admin) {
    return reqHelpers.sendRequest(req, { method: 'GET', url: 'api/v1/endpoints' })
      .then(response => {
        const cnsis = JSON.parse(response);
        const promises = [];
        cnsis.forEach((cnsi) => {
          const list = e2e.secrets.getEndpoints()[cnsi.cnsi_type] as E2EEndpointConfig[];
          if (!list) {
            fail('Unknown endpoint type');
          }
          const found = list.find((ep) => ep.name === endpointName);
          if (found) {
            const user = userType === ConsoleUserType.admin ? found.creds.admin : found.creds.nonAdmin || found.creds.admin;
            promises.push(this.doConnectEndpoint(req, cnsi.guid, user.username, user.password));
          }
        });
        return promise.all(promises);
      });
  }

  getInfo(req, setup) {
    return reqHelpers.sendRequest(req, { method: 'GET', url: 'pp/v1/info' })
      .then(response => {
        const info = JSON.parse(response);
        setup.info = info;
        return info;
      });
  }

  getSSOLoginStatus(req, setup) {
    return reqHelpers.sendRequest(req, { method: 'GET', url: 'pp/v1/auth/session/verify' })
      .then(response => {
        // Look for the header
        setup.ssoEnabled = this.parseSSOLoginStatus(response);
        setup.ssoEnabledFetched = true;
        return setup.sso;
      }).catch(e => {
        // 404 when no session
        setup.ssoEnabled = this.parseSSOLoginStatus(e.response);
        setup.ssoEnabledFetched = true;
        return setup.sso;
      });
  }

  private parseSSOLoginStatus(response: any): boolean {
    const sso = response.headers['x-stratos-sso-login'];
    return !!sso && sso.length > 0;
  }

  /**
   *
   * Ensure we have multiple Cloud Foundries registered
   *
   * Register a duplicate if necessary to ensure that we have multiple
   */
  registerMultipleCloudFoundries(req) {

    const p = promise.fulfilled({});
    const endpoints = e2e.secrets.getEndpoints();
    Object.keys(endpoints).forEach((endpointType) => {
      const endpointsOfType = endpoints[endpointType] as E2EEndpointConfig[];
      // Only do this if we only have one endpoint
      if (endpointsOfType.length === 1) {
        fail('You must configure multiple Cloud Foundry endpoints in secrets.yaml');
      }
      endpointsOfType.forEach((ep) => {
        if (!ep.skip) {
          p.then(() => reqHelpers.sendRequest(
            req, { method: 'POST', url: 'api/v1/endpoints?endpoint_type=' + endpointType }, null, this.makeRegisterFormData(ep)
          ));
        }
      });
    });
    return p;
  }

  registerDefaultCloudFoundry(req) {
    const endpoint = e2e.secrets.getDefaultCFEndpoint();
    return reqHelpers.sendRequest(req, { method: 'POST', url: 'api/v1/endpoints?endpoint_type=cf' }, null, this.makeRegisterFormData(endpoint));
  }

  /**
   * @function doRemoveAllEndpoints
   * @description Remove all registered endpoints
   */
  removeAllEndpoints(req) {
    return reqHelpers.sendRequest(req, { method: 'GET', url: 'api/v1/endpoints' }).then((data) => {
      if (!data || !data.length) {
        return;
      }
      console.warn('reset-helpers.ts: removeAllEndpoints: raw response', data);
      data = data.trim();
      console.warn('reset-helpers.ts: removeAllEndpoints: trimmed response', data);
      data = JSON.parse(data);
      console.warn('reset-helpers.ts: removeAllEndpoints: json response', data);
      const p = promise.fulfilled({});
      data.forEach((c) => {
        p.then(() => reqHelpers.sendRequest(req, { method: 'DELETE', url: 'api/v1/endpoints/' + c.guid }, null, {}));
      });
      return p;
    });
  }

  removeEndpoint(req, endpointName): promise.Promise<any> {
    return reqHelpers.sendRequest(req, { method: 'GET', url: 'api/v1/endpoints' }).then((data) => {
      if (!data || !data.length) {
        return;
      }
      data = data.trim();
      data = JSON.parse(data);
      const p = promise.fulfilled({});
      data.forEach((c) => {
        if (c.name === endpointName) {
          p.then(() => reqHelpers.sendRequest(req, { method: 'DELETE', url: 'api/v1/endpoints/' + c.guid }, null, {}));
        }
      });
      return p;
    });
  }

  private doConnectEndpoint(req, cnsiGuid, username, password) {
    return reqHelpers.sendRequest(req, { method: 'POST', url: 'api/v1/tokens' }, null, {
      cnsi_guid: cnsiGuid,
      username,
      password
    });
  }

  private makeRegisterFormData(ep: E2EEndpointConfig) {
    return {
      api_endpoint: ep.url,
      cnsi_name: ep.name,
      skip_ssl_validation: ep.skipSSLValidation ? 'true' : 'false'
    };
  }
}
