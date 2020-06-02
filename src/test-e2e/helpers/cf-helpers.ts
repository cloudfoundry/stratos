import { browser, promise } from 'protractor';

import {
  IApp,
  IDomain,
  IOrganization,
  IOrgQuotaDefinition,
  IRoute,
  ISpace,
  ISpaceQuotaDefinition,
} from '../../frontend/packages/cloud-foundry/src/cf-api.types';
import { CFResponse } from '../../frontend/packages/cloud-foundry/src/store/types/cf-api.types';
import { CfUser } from '../../frontend/packages/cloud-foundry/src/store/types/user.types';
import { APIResource } from '../../frontend/packages/store/src/types/api.types';
import { ApplicationPageSummaryTab } from '../application/po/application-page-summary.po';
import { CfTopLevelPage } from '../cloud-foundry/cf-level/cf-top-level-page.po';
import { CfOrgLevelPage } from '../cloud-foundry/org-level/cf-org-level-page.po';
import { CfSpaceLevelPage } from '../cloud-foundry/space-level/cf-space-level-page.po';
import { e2e, E2ESetup } from '../e2e';
import { E2EConfigCloudFoundry } from '../e2e.types';
import { ListComponent } from '../po/list.po';
import { MetaCardTitleType } from '../po/meta-card.po';
import { CFRequestHelpers } from './cf-request-helpers';
import { UaaHelpers } from './uaa-helpers';

const stackPriority = {
  cf: ['cflinuxfs3', 'cflinuxfs2'],
  suse: ['sle15', 'opensuse42']
};

export class CFHelpers {
  static cachedDefaultCfGuid: string;
  static cachedDefaultOrgGuid: string;
  static cachedDefaultSpaceGuid: string;
  static cachedAdminGuid: string;
  static cachedNonAdminGuid: string;

  cfRequestHelper: CFRequestHelpers;

  constructor(public e2eSetup: E2ESetup) {
    this.cfRequestHelper = new CFRequestHelpers(e2eSetup);
  }

  static cleanRouteHost(host: string): string {
    return host.replace(/[-:.]+/g, '');
  }

  private assignAdminAndUserGuids(cnsiGuid: string, endpoint: E2EConfigCloudFoundry): promise.Promise<any> {
    if (CFHelpers.cachedAdminGuid && CFHelpers.cachedNonAdminGuid) {
      return promise.fullyResolved({});
    }
    return this.fetchUsers(cnsiGuid).then(users => {
      expect(users).toBeDefined(`No users fetched from endpoint with api ${endpoint.url}`);
      expect(users.length).toBeGreaterThanOrEqual(2, `Less than two users detected`);
      const testUser = this.findUser(users, endpoint.creds.nonAdmin.username);
      const testAdminUser = this.findUser(users, endpoint.creds.admin.username);
      expect(testUser).toBeDefined('Could not find test user');
      expect(testAdminUser).toBeDefined('Could not find test admin user');
      CFHelpers.cachedNonAdminGuid = testUser.metadata.guid;
      CFHelpers.cachedAdminGuid = testAdminUser.metadata.guid;
    });
  }

  addOrgIfMissingForEndpointUsers(
    guid: string,
    endpoint: E2EConfigCloudFoundry,
    testOrgName: string,
    skipExistsCheck = false
  ): promise.Promise<APIResource<IOrganization>> {
    return this.assignAdminAndUserGuids(guid, endpoint).then(() => {
      expect(CFHelpers.cachedNonAdminGuid).not.toBeNull();
      expect(CFHelpers.cachedAdminGuid).not.toBeNull();
      return skipExistsCheck ?
        this.baseAddOrg(guid, testOrgName) :
        this.addOrgIfMissing(guid, testOrgName, CFHelpers.cachedAdminGuid, CFHelpers.cachedNonAdminGuid);
    });
  }

  private findUser(users: any, name: string): APIResource<CfUser> {
    return users.find(user => user && user.entity && user.entity.username === name);
  }

  addOrgIfMissing(cnsiGuid, orgName, adminGuid, userGuid): promise.Promise<APIResource<IOrganization>> {
    let added;

    return this.fetchOrg(cnsiGuid, orgName).then(org => {
      if (!org) {
        added = true;
        return this.baseAddOrg(cnsiGuid, orgName);
      }
      return org;
    }).then(newOrg => {
      if (!added || !adminGuid || !userGuid) {
        // No need to mess around with permissions, it exists already.
        return newOrg;
      }
      const orgGuid = newOrg.metadata.guid;
      const p1 = this.cfRequestHelper.sendCfPut(cnsiGuid, 'organizations/' + orgGuid + '/users/' + adminGuid);
      const p2 = this.cfRequestHelper.sendCfPut(cnsiGuid, 'organizations/' + orgGuid + '/users/' + userGuid);
      // Add user to org users
      return p1.then(() => p2.then(() => {
        return this.cfRequestHelper.sendCfPut(cnsiGuid, 'organizations/' + orgGuid + '/managers/' + adminGuid)
          .then(() => newOrg);
      }));
    });
  }

  addSpaceIfMissingForEndpointUsers(
    cnsiGuid: string,
    orgGuid: string,
    spaceName: string,
    endpoint: E2EConfigCloudFoundry,
    skipExistsCheck = false,
  ): promise.Promise<APIResource<ISpace>> {
    return this.assignAdminAndUserGuids(cnsiGuid, endpoint).then(() => {
      expect(CFHelpers.cachedNonAdminGuid).not.toBeNull();
      return skipExistsCheck ?
        this.baseAddSpace(cnsiGuid, orgGuid, spaceName, CFHelpers.cachedNonAdminGuid) :
        this.addSpaceIfMissing(cnsiGuid, orgGuid, spaceName, CFHelpers.cachedNonAdminGuid);

    });
  }

  addSpaceIfMissing(cnsiGuid, orgGuid, spaceName, userGuid): promise.Promise<APIResource<ISpace>> {
    const that = this;
    return this.fetchSpace(cnsiGuid, orgGuid, spaceName)
      .then(space => {
        return space ? space : that.baseAddSpace(cnsiGuid, orgGuid, spaceName, userGuid);
      });
  }

  fetchServiceExist(cnsiGuid, serviceName) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'service_instances?q=name IN ' + serviceName).then(json => {
      return json.resources;
    });
  }

  deleteOrgIfExisting(cnsiGuid: string, orgName: string) {
    return this.fetchOrg(cnsiGuid, orgName).then(org => {
      if (org) {
        return this.cfRequestHelper.sendCfDelete(cnsiGuid, 'organizations/' + org.metadata.guid + '?recursive=true&async=false');
      }
    });
  }

  deleteQuotaDefinitionIfExisting(cfGuid: string, quotaGuid: string) {
    return this.fetchQuotaDefinition(cfGuid, quotaGuid).then(quota => {
      if (quota) {
        return this.cfRequestHelper.sendCfDelete(cfGuid, 'quota_definitions/' + quota.metadata.guid + '?recursive=true&async=false');
      }
    });
  }

  deleteSpaceQuotaDefinitionIfExisting(cfGuid: string, spaceQuotaGuid: string) {
    return this.fetchQuotaDefinition(cfGuid, spaceQuotaGuid).then(spaceQuota => {
      if (spaceQuota) {
        const url = 'space_quota_definitions/' + spaceQuota.metadata.guid + '?recursive=true&async=false';
        return this.cfRequestHelper.sendCfDelete(cfGuid, url);
      }
    });
  }

  deleteSpaceIfExisting(cnsiGuid: string, orgGuid: string, spaceName: string) {
    return this.fetchSpace(cnsiGuid, orgGuid, spaceName).then(space => {
      if (space) {
        return this.cfRequestHelper.sendCfDelete(cnsiGuid, 'spaces/' + space.metadata.guid + '?recursive=true&async=false');
      }
    });
  }

  fetchUsers(cnsiGuid): promise.Promise<APIResource<CfUser>[]> {
    return this.cfRequestHelper.sendCfGet<CFResponse<CfUser>>(cnsiGuid, 'users').then(json => {
      return json.resources;
    });
  }

  fetchUser(cnsiGuid: string, userName: string) {
    return this.fetchUsers(cnsiGuid).then(users => {
      const foundUsers = users.filter(user => user.entity.username === userName);
      return foundUsers.length === 1 ? foundUsers[0] : null;
    });
  }

  // Get defult stack for the default CF
  fetchDefaultCFEndpointStack() {
    return this.fetchDefaultCfGuid(true).then(guid => {
      return this.cfRequestHelper.sendCfGet(guid, '/stacks').then(json => {

        const endpoint = this.cfRequestHelper.getDefaultCFEndpoint();
        // Get the info for the Default CF
        const reqObj = this.cfRequestHelper.newRequest();
        const options = {
          url: endpoint.url + '/v2/info'
        };
        return reqObj(options).then((response) => {
          const infoJson = JSON.parse(response.body);
          const isSUSE = infoJson.description.indexOf('SUSE') === 0;

          const stackPriorities = isSUSE ? stackPriority.suse : stackPriority.cf;
          const stacksAvailable = {};
          json.resources.forEach(s => stacksAvailable[s.entity.name] = true);

          for (const s of stackPriorities) {
            if (stacksAvailable[s]) {
              return s;
            }
          }
          return stackPriorities[0];
        }).catch((e) => {
          return 'unknown';
        });
      });
    });
  }

  fetchOrg(cnsiGuid: string, orgName: string): promise.Promise<APIResource<IOrganization>> {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'organizations?q=name IN ' + orgName).then(json => {
      if (json.total_results > 0) {
        const org = json.resources[0];
        return org;
      }
      return null;
    });
  }

  fetchQuotaDefinition(cnsiGuid: string, quotaName: string): promise.Promise<APIResource<any>> {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'quota_definitions?q=name IN ' + quotaName).then(json => {
      if (json.total_results > 0) {
        const org = json.resources[0];
        return org;
      }
      return null;
    });
  }

  fetchSpace(cnsiGuid: string, orgGuid: string, spaceName: string) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'spaces?q=name IN ' + spaceName + '&organization_guid=' + orgGuid).then(json => {
      if (json.total_results > 0) {
        const space = json.resources[0];
        return space;
      }
      return null;
    });
  }

  fetchAppsCountInSpace(cnsiGuid: string, spaceGuid: string) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, `spaces/${spaceGuid}/apps`).then(json => {
      return json.total_results;
    });
  }

  fetchRoutesInSpace(cnsiGuid: string, spaceGuid: string): promise.Promise<APIResource<IRoute>[]> {
    return this.cfRequestHelper.sendCfGet<CFResponse<IRoute>>(cnsiGuid, `/spaces/${spaceGuid}/routes?results-per-page=100`)
      .then(json => {
        if (json.total_results > 100) {
          fail('Number of routes in space is over the max page size of 100, requires de-paginating');
        }
        return json.resources;
      });
  }

  // For fully fleshed out fetch see application-e2e-helpers
  basicFetchApp(cnsiGuid: string, spaceGuid: string, appName: string) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid,
      `apps?inline-relations-depth=1&include-relations=routes,service_bindings&q=name IN ${appName},space_guid IN ${spaceGuid}`);
  }

  // For fully fleshed our create see application-e2e-helpers
  basicCreateApp(cnsiGuid: string, spaceGuid: string, appName: string): promise.Promise<APIResource<IApp>> {
    return this.cfRequestHelper.sendCfPost(cnsiGuid, 'apps', {
      name: appName,
      space_guid: spaceGuid,
      memory: 23,
      disk_quota: 35
    });
  }

  // For fully fleshed out delete see application-e2e-helpers (includes route and service instance deletion)
  basicDeleteApp(cnsiGuid: string, appGuid: string) {
    return this.cfRequestHelper.sendCfDelete(cnsiGuid, 'apps/' + appGuid);
  }

  baseAddSpace(cnsiGuid: string, orgGuid: string, spaceName: string, userGuid?: string): promise.Promise<APIResource<ISpace>> {
    const body = {
      name: spaceName,
      manager_guids: [],
      developer_guids: [],
      organization_guid: orgGuid
    };

    if (userGuid) {
      body.developer_guids = [userGuid];
    }
    const cfRequestHelper = this.cfRequestHelper;
    return cfRequestHelper.sendCfPost<APIResource<ISpace>>(cnsiGuid, 'spaces', body);
  }

  baseAddOrg(cnsiGuid: string, orgName: string, options = {}): promise.Promise<APIResource<IOrganization>> {
    return this.cfRequestHelper.sendCfPost<APIResource<IOrganization>>(cnsiGuid, 'organizations', { name: orgName, ...options });
  }

  addRoute(cnsiGuid: string, spaceGuid: string, domainGuid: string, host: string, port?: number, path?: string)
    : promise.Promise<APIResource<IRoute>> {
    e2e.log(`Creating route ${host} ${path} ${port}`);
    return this.cfRequestHelper.sendCfPost<APIResource<IRoute>>(cnsiGuid, 'routes', {
      domain_guid: domainGuid,
      space_guid: spaceGuid,
      host,
      port,
      path
    });
  }

  fetchAppRoutes(cnsiGuid: string, appGuid: string): promise.Promise<APIResource<IRoute>[]> {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, `apps/${appGuid}/routes`).then(res => res.resources);
  }

  fetchDomains(cnsiGuid: string): promise.Promise<APIResource<IDomain>[]> {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, `shared_domains`).then(res => res.resources);
  }

  updateDefaultCfOrgSpace = (): promise.Promise<any> => {
    // Fetch cf guid, org guid, or space guid from ... cache or jetstream
    return this.fetchDefaultCfGuid(false)
      .then(() => this.fetchDefaultOrgGuid(false))
      .then(() => this.fetchDefaultSpaceGuid(false));
  }


  fetchDefaultCfGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && CFHelpers.cachedDefaultCfGuid ?
      promise.fullyResolved(CFHelpers.cachedDefaultCfGuid) :
      this.cfRequestHelper.getCfGuid().then(guid => {
        CFHelpers.cachedDefaultCfGuid = guid;
        return CFHelpers.cachedDefaultCfGuid;
      });
  }

  fetchDefaultOrgGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && CFHelpers.cachedDefaultOrgGuid ?
      promise.fullyResolved(CFHelpers.cachedDefaultOrgGuid) :
      this.fetchDefaultCfGuid(true)
        .then(guid => this.addOrgIfMissingForEndpointUsers(
          guid,
          e2e.secrets.getDefaultCFEndpoint(),
          e2e.secrets.getDefaultCFEndpoint().testOrg
        ))
        .then(org => {
          CFHelpers.cachedDefaultOrgGuid = org.metadata.guid;
          return CFHelpers.cachedDefaultOrgGuid;
        });
  }

  fetchDefaultSpaceGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && CFHelpers.cachedDefaultSpaceGuid ?
      promise.fullyResolved(CFHelpers.cachedDefaultSpaceGuid) :
      this.fetchDefaultOrgGuid(true)
        .then(orgGuid =>
          this.addSpaceIfMissingForEndpointUsers(
            CFHelpers.cachedDefaultCfGuid,
            CFHelpers.cachedDefaultOrgGuid,
            e2e.secrets.getDefaultCFEndpoint().testSpace,
            e2e.secrets.getDefaultCFEndpoint()
          )
        )
        .then(space => {
          CFHelpers.cachedDefaultSpaceGuid = space.metadata.guid;
          return CFHelpers.cachedDefaultSpaceGuid;
        });
  }

  addOrgUserRole(cfGuid, orgGuid, userName) {
    return this.cfRequestHelper.sendCfPut<APIResource<CfUser>>(cfGuid, 'organizations/' + orgGuid + '/users', {
      username: userName
    });
  }

  addOrgUserManager(cfGuid, orgGuid, userName) {
    return this.cfRequestHelper.sendCfPut<APIResource<CfUser>>(cfGuid, 'organizations/' + orgGuid + '/managers', {
      username: userName
    });
  }

  addOrgUserAuditor(cfGuid, orgGuid, userName) {
    return this.cfRequestHelper.sendCfPut<APIResource<CfUser>>(cfGuid, 'organizations/' + orgGuid + '/auditors', {
      username: userName
    });
  }

  addOrgUserBillingManager(cfGuid, orgGuid, userName) {
    return this.cfRequestHelper.sendCfPut<APIResource<CfUser>>(cfGuid, 'organizations/' + orgGuid + '/billing_managers', {
      username: userName
    });
  }

  addSpaceDeveloper(cfGuid, spaceGuid, userName) {
    return this.cfRequestHelper.sendCfPut<APIResource<CfUser>>(cfGuid, 'spaces/' + spaceGuid + '/developers', {
      username: userName
    });
  }

  addSpaceAuditor(cfGuid, spaceGuid, userName) {
    return this.cfRequestHelper.sendCfPut<APIResource<CfUser>>(cfGuid, 'spaces/' + spaceGuid + '/auditors', {
      username: userName
    });
  }

  addSpaceManager(cfGuid, spaceGuid, userName) {
    return this.cfRequestHelper.sendCfPut<APIResource<CfUser>>(cfGuid, 'spaces/' + spaceGuid + '/managers', {
      username: userName
    });
  }

  fetchOrgUsers(cfGuid: string, orgGuid: string): promise.Promise<APIResource<CfUser>[]> {
    return this.cfRequestHelper.sendCfGet(cfGuid, `organizations/${orgGuid}/users`).then(res => res.resources);
  }

  deleteUsers(cfGuid: string, orgName: string, userNames: string[]): promise.Promise<any> {
    return this.fetchOrg(cfGuid, orgName)
      .then(org => this.fetchOrgUsers(cfGuid, org.metadata.guid))
      .then(orgUsers => promise.all(userNames.map(username => {
        const foundUser = orgUsers.find(user => user.entity.username === username);
        if (!foundUser) {
          throw new Error(`Failed to find user ${username}. Aborting deletion of users`);
        }
        return this.deleteUser(cfGuid, foundUser.metadata.guid, username);
      })));
  }

  deleteUser(cfGuid: string, userGuid: string, userName?: string, uaaUserGuid?: string): promise.Promise<any> {
    const uaaHelpers = new UaaHelpers();
    return this.cfRequestHelper.sendCfDelete(cfGuid, `users/${userGuid}?async=false`)
      .then(() => browser.sleep(500))
      .then(() => uaaHelpers.deleteUser(uaaUserGuid, userName));
  }

  createUser(cfGuid: string, uaaUserGuid: string): promise.Promise<APIResource<CfUser>> {
    const body = {
      guid: uaaUserGuid
    };
    return this.cfRequestHelper.sendCfPost<APIResource<CfUser>>(cfGuid, 'users', body);
  }

  /**
   * Nav from cf page to org and optional space via the org and space lists
   */
  navFromCfToOrg(orgName: string): promise.Promise<CfOrgLevelPage> {
    return CfTopLevelPage.detect()
      .then(cfPage => {
        cfPage.waitForPageOrChildPage();
        cfPage.loadingIndicator.waitUntilNotShown();
        cfPage.goToOrgTab();

        // Find the Org and click on it
        const list = new ListComponent();
        return list.cards.findCardByTitle(orgName, MetaCardTitleType.CUSTOM, true);
      })
      .then(card => {
        expect(card).toBeDefined();
        card.click();
        return CfOrgLevelPage.detect();
      })
      .then(orgPage => {
        orgPage.waitForPageOrChildPage();
        orgPage.loadingIndicator.waitUntilNotShown();
        return orgPage;
      });
  }

  navFromOrgToSpace(orgPage: CfOrgLevelPage, spaceName: string): promise.Promise<CfSpaceLevelPage> {
    orgPage.goToSpacesTab();
    // Find the Org and click on it
    const list = new ListComponent();
    return list.cards.findCardByTitle(spaceName, MetaCardTitleType.CUSTOM, true)
      .then(card => {
        expect(card).toBeDefined();
        card.click();
        return CfSpaceLevelPage.detect();
      })
      .then(spacePage => {
        spacePage.waitForPageOrChildPage();
        spacePage.loadingIndicator.waitUntilNotShown();
        return spacePage;
      });
  }

  addOrgQuota(cfGuid, name, options = {}) {
    const body = {
      name,
      non_basic_services_allowed: true,
      total_services: -1,
      total_routes: -1,
      memory_limit: 5120,
      instance_memory_limit: -1,
      total_reserved_route_ports: -1,
      ...options
    };

    return this.cfRequestHelper.sendCfPost<APIResource<IOrgQuotaDefinition>>(cfGuid, 'quota_definitions', body);
  }

  addSpaceQuota(cfGuid, orgGuid, name, options = {}) {
    const body = {
      name,
      organization_guid: orgGuid,
      non_basic_services_allowed: true,
      total_services: -1,
      total_routes: -1,
      memory_limit: 5120,
      total_reserved_route_ports: -1,
      ...options
    };
    return this.cfRequestHelper.sendCfPost<APIResource<ISpaceQuotaDefinition>>(cfGuid, 'space_quota_definitions', body);
  }

  createTestAppAndNav(appName: string, nav = true): promise.Promise<{
    cfGuid: string,
    app: APIResource<IApp>
  }> {
    // It's advised to run cfHelper.updateDefaultCfOrgSpace first
    return this.basicCreateApp(
      CFHelpers.cachedDefaultCfGuid,
      CFHelpers.cachedDefaultSpaceGuid,
      appName
    )
      .then((app) => {
        if (nav) {
          const appSummary = new ApplicationPageSummaryTab(CFHelpers.cachedDefaultCfGuid, app.metadata.guid);
          appSummary.navigateTo();
          appSummary.waitForPage();
        }
        return {
          cfGuid: CFHelpers.cachedDefaultCfGuid,
          app
        };
      });
  }
}
