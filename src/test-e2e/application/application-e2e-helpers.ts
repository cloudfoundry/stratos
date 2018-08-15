import { browser, promise } from 'protractor';

import { IApp, IRoute, ISpace } from '../../frontend/app/core/cf-api.types';
import { APIResource } from '../../frontend/app/store/types/api.types';
import { e2e, E2ESetup } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { CFRequestHelpers } from '../helpers/cf-request-helpers';
import { E2EHelpers } from '../helpers/e2e-helpers';

const customAppLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER);

let cachedDefaultCfGuid, cachedDefaultOrgGuid, cachedDefaultSpaceGuid;

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

  updateDefaultCfOrgSpace = (): promise.Promise<any> => {
    // Fetch cf guid, org guid, or space guid from ... cache or jetstream
    return this.fetchDefaultCfGuid(false)
      .then(() => this.fetchDefaultOrgGuid(false))
      .then(() => this.fetchDefaultSpaceGuid(false));
  }

  fetchDefaultCfGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && cachedDefaultCfGuid ?
      promise.fullyResolved(cachedDefaultCfGuid) :
      this.cfRequestHelper.getCfCnsi().then(endpoint => {
        cachedDefaultCfGuid = endpoint.guid;
        return cachedDefaultCfGuid;
      });
  }

  fetchDefaultOrgGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && cachedDefaultOrgGuid ?
      promise.fullyResolved(cachedDefaultOrgGuid) :
      this.fetchDefaultCfGuid(true).then(guid => this.cfHelper.fetchOrg(guid, e2e.secrets.getDefaultCFEndpoint().testOrg).then(org => {
        cachedDefaultOrgGuid = org.metadata.guid;
        return cachedDefaultOrgGuid;
      }));
  }

  fetchDefaultSpaceGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && cachedDefaultSpaceGuid ?
      promise.fullyResolved(cachedDefaultSpaceGuid) :
      this.fetchDefaultOrgGuid(true).then(orgGuid =>
        this.cfHelper.fetchSpace(cachedDefaultCfGuid, orgGuid, e2e.secrets.getDefaultCFEndpoint().testSpace)
      ).then(space => {
        cachedDefaultSpaceGuid = space.metadata.guid;
        return cachedDefaultSpaceGuid;
      });
  }

  fetchAppInDefaultOrgSpace = (
    appName?: string,
    appGuid?: string,
    cfGuid?: string,
    spaceGuid?: string
  ): promise.Promise<{ cfGuid: string, app: APIResource<IApp> }> => {

    const cfGuidP: promise.Promise<string> = cfGuid ? promise.fullyResolved(cfGuid) : this.fetchDefaultCfGuid();
    const spaceGuidP: promise.Promise<string> = spaceGuid ? promise.fullyResolved(spaceGuid) : this.fetchDefaultSpaceGuid();

    const appP: promise.Promise<APIResource<IApp>> = promise.all([cfGuidP, spaceGuidP]).then(([cfGuid1, spaceGuid1]) => {
      return appName ? this.fetchApp(cfGuid1, spaceGuid1, appName) : this.fetchAppByGuid(cfGuid1, appGuid);
    });

    return appP.then(app => ({ cfGuid: cachedDefaultCfGuid, app })).catch(e => {
      e2e.log('Failed to fetch application in default cf, org and space: ' + e);
      throw e;
    });
  }

  fetchApp = (cfGuid: string, spaceGuid: string, appName: string): promise.Promise<APIResource<IApp>> => {
    return this.cfHelper.baseFetchApp(cfGuid, spaceGuid, appName).then(json => {
      if (json.total_results < 1) {
        return null;
      } else if (json.total_results === 1) {
        return json.resources[0];
      } else {
        throw new Error('There should only be one app, found multiple. App Name: ' + appName);
      }
    });
  }

  fetchAppByGuid = (cfGuid: string, appGuid: string): promise.Promise<APIResource<IApp>> => {
    return this.cfRequestHelper.sendCfGet<APIResource<IApp>>(cfGuid, 'apps/' + appGuid);
  }

  private chain<T>(
    currentValue: T,
    nextChainFc: () => promise.Promise<T>,
    maxChain: number,
    abortChainFc: (val: T) => boolean,
    count = 0): promise.Promise<T> {
    if (count > maxChain || abortChainFc(currentValue)) {
      return promise.fullyResolved(currentValue);
    }
    e2e.log('Chaining requests. Count: ' + count);

    return nextChainFc().then(res => {
      if (abortChainFc(res)) {
        return promise.fullyResolved(res);
      }
      browser.sleep(500);
      return this.chain<T>(res, nextChainFc, maxChain, abortChainFc, ++count);
    });
  }

  deleteApplication = (
    haveApp?: {
      cfGuid: string,
      app: APIResource<IApp>
    },
    needApp?: {
      appName?: string,
      appGuid?: string
    }
  ): promise.Promise<any> => {
    if (!haveApp && !needApp) {
      e2e.log(`Skipping Deleting App...`);
      return;
    }

    let cfGuid = haveApp ? haveApp.cfGuid : null;

    const appP: promise.Promise<APIResource<IApp>> = haveApp ?
      this.fetchAppByGuid(haveApp.cfGuid, haveApp.app.metadata.guid) :
      this.fetchAppInDefaultOrgSpace(needApp.appName, needApp.appGuid).then(res => {
        cfGuid = res.cfGuid;
        return res.app;
      });

    e2e.log(`Deleting App...`);

    return appP
      .then(app => {
        e2e.log(`'${app.entity.name}': Found app to delete`);

        const promises = [];

        // Delete service instance
        const serviceBindings = app.entity.service_bindings || [];
        serviceBindings.forEach(serviceBinding => {
          const url = 'service_instances/' + serviceBinding.entity.service_instance_guid + '?recursive=true&async=false';
          promises.push(this.cfRequestHelper.sendCfDelete(cfGuid, url));
        });

        // Delete route
        // If we have zero routes, attempt 10 times to fetch a populated route list
        const routes: promise.Promise<APIResource<IRoute>[]> = this.chain<APIResource<IRoute>[]>(
          app.entity.routes,
          () => this.cfHelper.fetchAppRoutes(cfGuid, app.metadata.guid),
          10,
          (res) => !!res && !!res.length
        );

        promises.push(routes.then(appRoutes => {
          if (!appRoutes || !appRoutes.length) {
            e2e.log(`'${app.entity.name}': Deleting App Routes... None found'. `);
            return promise.fullyResolved({});
          }
          e2e.log(`'${app.entity.name}': Deleting App Routes... '${appRoutes.map(route => route.entity.host).join(',')}'. `);
          return promise.all(appRoutes.map(route =>
            this.cfRequestHelper.sendCfDelete(cfGuid, 'routes/' + route.metadata.guid + '?q=recursive=true&async=false')
          ));
        }));

        const deps = promise.all(promises).catch(err => {
          const errorString = `Failed to delete routes or services attached to an app`;
          console.log(`${errorString}: ${err}`);
          return promise.rejected(errorString);
        });

        const cfRequestHelper = this.cfRequestHelper;

        // Delete app
        return deps.then(() => this.cfHelper.baseDeleteApp(cfGuid, app.metadata.guid)).then(() => {
          e2e.log(`'${app.entity.name}': Successfully deleted.`);
        });
      })
      .catch(err => fail(`Failed to delete app or associated dependencies: ${err}`));
  }

  createApp(cfGuid: string, orgName: string, spaceName: string, appName: string) {
    return browser.driver.wait(
      this.cfHelper.addOrgIfMissing(cfGuid, orgName)
        .then(org => {
          return this.cfHelper.fetchSpace(cfGuid, org.metadata.guid, spaceName);
        })
        .then(space => {
          expect(space).not.toBeNull();
          return promise.all([
            this.cfHelper.baseCreateApp(cfGuid, space.metadata.guid, appName),
            promise.fullyResolved(space)
          ]);
        })
        .then(([app, space]: [APIResource<IApp>, APIResource<ISpace>]) => {
          return this.fetchApp(cfGuid, space.metadata.guid, appName);
        })
    );
  }

}


