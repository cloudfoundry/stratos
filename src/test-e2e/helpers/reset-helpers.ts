import { E2EEndpointConfig } from '../e2e.types';
import { E2EHelpers } from './e2e-helpers';
import { SecretsHelpers } from './secrets-helpers';


const helpers = new E2EHelpers();
const secrets = new SecretsHelpers();

/**
 * Helpers to reset the back-end to a given state
 */
export class ResetsHelpers {


  constructor() { }

  /**
   * @function devWorkflow
   * @description Ensure the database is initialized for developer workflow.
   * @param {boolean} firstTime - flag this as a first-time run
   */
  devWorkflow(firstTime) {
    return new Promise((resolve, reject) => {
      helpers.createReqAndSession(null, secrets.getConsoleNonAdminUsername(), secrets.getConsoleNonAdminPassword()).then((req) => {
        const promises = [];
        // promises.push(this.setUser(req, !firstTime));
        promises.push(this.doResetAllEndpoints(req));

        // if (firstTime) {
        //   promises.push(this.removeUserServiceInstances(req));
        // } else {
        //   promises.push(this.resetUserServiceInstances(req));
        // }

        Promise.all(promises).then(
          () => resolve()
        ).catch((error) => {
          console.log('Failed to set dev workflow');
          reject(error);
        });
      });
    });
  }

  /**
   * Ensure the database is initialized for ITOps admin workflow with no clusters registered.
   */
  removeAllEndpoints = (username?, password?) => {
    return new Promise((resolve, reject) => {
      helpers.createReqAndSession(null, username, password).then((req) => {
        this.doRemoveAllEndpoints(req).then(function () {
          resolve();
        }, function (error) {
          console.log('Failed to remove all endpoints: ', error);
          reject(error);
        }).catch(reject);
      }, function (error) {
        reject(error);
      });
    });
  }

  /**
   * Ensure the database is initialized for ITOps admin workflow with the clusters provided as params.
   * registerMultipleCf - register multiple CF instance
   */
  resetAllEndpoints = (username, password, registerMultipleCf, endpointName?: string) => {
    return new Promise((resolve, reject) => {
      helpers.createReqAndSession(null, username, password).then((req) => {
        this.doResetAllEndpoints(req, registerMultipleCf, endpointName).then(() => {
          resolve();
        }, function (error) {
          console.log('Failed to reset all endpoints: ', error);
          reject(error);
        }).catch(reject);
      }, function (error) {
        reject(error);
      });
    });
  }

  /**
   * Get all of the registered Endpoints and comnnect all of them for which credentials
   * have been configured
   */
  connectAllEndpoints(username, password, isAdmin) {
    let req;
    return helpers.createReqAndSession(null, username, password)
      .then(function (createdReq) { req = createdReq; })
      .then(() => helpers.sendRequest(req, {method: 'GET', url: 'pp/v1/cnsis'}))
      .then(response => {
        const cnsis = JSON.parse(response);
        const promises = [];
        cnsis.forEach((cnsi) => {
          const list = secrets.getEndpoints()[cnsi.cnsi_type] as E2EEndpointConfig[];
          if (!list) {
            fail('Unknown endpoint');
          }
          const found = list.find((ep) => {
            return ep.url.endsWith(cnsi.api_endpoint.Host);
          });
          if (found) {
            const user = isAdmin ? found.creds.admin : found.creds.nonAdmin || found.creds.admin;
            promises.push(this.connectEndpoint(req, cnsi.guid, user.username, user.password));
          }
        });
        return Promise.all(promises);
      });
  }

  /**
   * Reset endpoints to original state
   */
  private doResetAllEndpoints(req, registerMultipleCf = false, endpointName?: string) {
    return new Promise((resolve, reject) => {
      this.doRemoveAllEndpoints(req).then(() => {
        const promises = [];
        const endpoints = secrets.getEndpoints();
        Object.keys(endpoints).forEach((endpointType) => {
          let endpointsOfType = endpoints[endpointType] as E2EEndpointConfig[];
          if (registerMultipleCf) {
            // Only do this if we only have one endpoint
            if (endpointsOfType.length === 1) {
              // duplicates the current definition and changes the name
              const newEndpoint = { ...endpointsOfType[0], name: endpointsOfType[0].name +  'Copy' };
              endpointsOfType.push(newEndpoint);
            }
          } else {
            // Only want one
            endpointsOfType = [ endpointsOfType[0] ];
          }
          endpointsOfType.forEach((ep) => {
            if (!endpointName || ep.name === endpointName) {
              promises.push(
                helpers.sendRequest(req, {method: 'POST', url: 'pp/v1/register/' + endpointType}, null, this.makeRegisterFormData(ep))
              );
            }
          });
        });
        Promise.all(promises).then(() => resolve(), (error) => reject(error));
      }, reject).catch(reject);
    });
  }

  private makeRegisterFormData(ep: E2EEndpointConfig) {
    return {
      api_endpoint: ep.url,
      cnsi_name: ep.name,
      skip_ssl_validation: ep.skipSSLValidation ? 'true' : 'false'
    };
  }

  /**
   * @function doRemoveAllEndpoints
   * @description Remove all registered endpoints
   */
  private doRemoveAllEndpoints(req) {
    return new Promise(function (resolve, reject) {
      helpers.sendRequest(req, {method: 'GET', url: 'pp/v1/cnsis'}).then((data) => {
        data = data.trim();
        data = JSON.parse(data);
        if (!data || !data.length) {
          resolve();
          return;
        }
        const promises = data.map((c) => {
          return helpers.sendRequest(req, {method: 'POST', url: 'pp/v1/unregister'}, null, {cnsi_guid: c.guid});
        });
        Promise.all(promises).then(resolve, reject);
      }, reject);
    });
  }

  private connectEndpoint(req, cnsiGuid, username, password) {
    return helpers.sendRequest(req, {method: 'POST', url: 'pp/v1/auth/login/cnsi'}, null, {
      cnsi_guid: cnsiGuid,
      username: username,
      password: password
    });
  }
}
