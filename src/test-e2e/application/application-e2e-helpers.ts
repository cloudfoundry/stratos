import { APIResource, CFResponse } from '../../frontend/app/store/types/api.types';
import { E2ESetup } from '../e2e';
import { CFRequestHelpers } from '../helpers/cf-request-helpers';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { promise } from 'protractor';
import { CFHelpers } from '../helpers/cf-helpers';
import { browser } from 'protractor';

const customAppLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER);

export class ApplicationE2eHelper {

  cfRequestHelper: CFRequestHelpers;
  cfHelper: CFHelpers;

  constructor(public e2eSetup: E2ESetup) {
    this.cfRequestHelper = new CFRequestHelpers(e2eSetup);
    this.cfHelper = new CFHelpers(e2eSetup);
  }

  static createApplicationName = (isoTime?: string): string => E2EHelpers.createCustomName(customAppLabel, isoTime).toLowerCase();
  /**
   * Get default sanitized URL name for App
   * @param {string} appName Name of the app
   * @returns {string} URL friendly name
   */
  static getHostName = (appName) => appName.replace(/[\.:-]/g, '_');

  fetchApp = (cfGuid: string, appName: string): promise.Promise<CFResponse> => {
    return this.cfRequestHelper.sendCfGet(
      cfGuid,
      'apps?inline-relations-depth=1&include-relations=routes,service_bindings&q=name IN ' + appName
    );
  }

  deleteApplication = (cfGuid: string, app: APIResource): promise.Promise<any> => {
    if (!cfGuid || !app) {
      return promise.fullyResolved({});
    }

    const promises = [];

    // Delete service instance
    const serviceBindings = app.entity.service_bindings || [];
    serviceBindings.forEach(serviceBinding => {
      const url = 'service_instances/' + serviceBinding.entity.service_instance_guid + '?recursive=true&async=false';
      promises.push(this.cfRequestHelper.sendCfDelete(cfGuid, url));
    });

    // Delete route
    const routes = app.entity.routes || [];
    routes.forEach(route => {
      promises.push(this.cfRequestHelper.sendCfDelete(cfGuid, 'routes/' + route.metadata.guid + '?q=recursive=true&async=false'));
    });

    const deps = promise.all(promises).catch(err => {
      const errorString = `Failed to delete routes or services attached to an app`;
      console.log(`${errorString}: ${err}`);
      return promise.rejected(errorString);
    });

    const cfRequestHelper = this.cfRequestHelper;

    // Delete app
    return deps.then(() => {
      return cfRequestHelper.sendCfDelete(cfGuid, 'apps/' + app.metadata.guid);
    }).catch(err => fail(`Failed to delete app or associated dependencies: ${err}`));
  }

  createApp(cfGuid: string, spaceName: string, appName: string) {
    return browser.driver.wait(this.cfHelper.fetchSpace(cfGuid, spaceName).then(space => {
      expect(space).not.toBeNull();
      return this.cfHelper.createApp(cfGuid, space.metadata.guid, appName).then(() => {
        return this.fetchApp(cfGuid, appName).then(apps => {
          expect(apps.total_results).toBe(1);
          const app = apps.resources[0];
          return app;
        });
      });
    }));
  }

}


