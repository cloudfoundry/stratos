import Q = require('q');
import { promise } from 'selenium-webdriver';

import { E2ESetup } from '../e2e';
import { CFRequestHelpers } from '../helpers/cf-request-helpers';
import { E2EHelpers } from '../helpers/e2e-helpers';


const customAppLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER);

export class ApplicationE2eHelper {

  cfRequestHelper: CFRequestHelpers;

  constructor(public e2eSetup: E2ESetup) {
    this.cfRequestHelper = new CFRequestHelpers(e2eSetup);
  }


  static createApplicationName = (isoTime?: string): string => E2EHelpers.createCustomName(customAppLabel, isoTime);
  /**
   * Get default sanitized URL name for App
   * @param {string} appName Name of the app
   * @returns {string} URL friendly name
   */
  static getHostName = (appName) => appName.replace(/\./g, '_').replace(/:/g, '_');

  fetchApp = (cfGuid: string, appName: string): promise.Promise<any> => {
    return this.cfRequestHelper.sendGet(
      cfGuid,
      'apps?inline-relations-depth=1&include-relations=routes,service_bindings&q=name IN ' + appName
    );
  }

  deleteApplicationByName = (cfGuid: string, appName: string): promise.Promise<any> => {
    if (!appName) {
      return;
    }

    return this.fetchApp(cfGuid, appName)
      .then(app => {
        if (!app) {
          return Q.resolve(false);
        }

        const promises = [];

        // Delete service instance
        const serviceBindings = app.entity.service_bindings || [];
        serviceBindings.forEach(serviceBinding => {
          const url = 'service_instances/' + serviceBinding.entity.service_instance_guid + '?recursive=true&async=false';
          promises.push(this.cfRequestHelper.sendDelete(cfGuid, url));
        });

        // Delete route
        const routes = app.entity.routes || [];
        routes.forEach(route => {
          promises.push(this.cfRequestHelper.sendDelete(cfGuid, 'routes/' + route.metadata.guid + '?q=recursive=true&async=false'));
        });

        // Delete app
        return Q.all(promises).then(function () {
          promises.push(this.cfRequestHelper.sendDelete(cfGuid, 'pps/' + app.metadata.guid));
        });
      });
  }

}


