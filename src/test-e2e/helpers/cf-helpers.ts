import { promise } from 'protractor';

import { IOrganization, IRoute, ISpace } from '../../frontend/app/core/cf-api.types';
import { APIResource, CFResponse } from '../../frontend/app/store/types/api.types';
import { CfUser } from '../../frontend/app/store/types/user.types';
import { e2e, E2ESetup } from '../e2e';
import { E2EConfigCloudFoundry } from '../e2e.types';
import { CFRequestHelpers } from './cf-request-helpers';


export class CFHelpers {
  cfRequestHelper: CFRequestHelpers;
  cachedDefaultCfGuid: string;
  cachedDefaultOrgGuid: string;
  cachedDefaultSpaceGuid: string;
  cachedAdminGuid: string;
  cachedNonAdminGuid: string;

  constructor(public e2eSetup: E2ESetup) {
    this.cfRequestHelper = new CFRequestHelpers(e2eSetup);
  }

  private assignAdminAndUserGuids(cnsiGuid: string, endpoint: E2EConfigCloudFoundry): promise.Promise<any> {
    if (this.cachedAdminGuid && this.cachedNonAdminGuid) {
      return promise.fullyResolved({});
    }
    return this.fetchUsers(cnsiGuid).then(users => {
      const testUser = this.findUser(users, endpoint.creds.nonAdmin.username);
      const testAdminUser = this.findUser(users, endpoint.creds.admin.username);
      expect(testUser).toBeDefined();
      expect(testAdminUser).toBeDefined();
      this.cachedNonAdminGuid = testUser.metadata.guid;
      this.cachedAdminGuid = testAdminUser.metadata.guid;
    });
  }

  addOrgIfMissingForEndpointUsers(
    guid: string,
    endpoint: E2EConfigCloudFoundry,
    testOrgName: string
  ): promise.Promise<APIResource<IOrganization>> {
    return this.assignAdminAndUserGuids(guid, endpoint).then(() => {
      expect(this.cachedNonAdminGuid).not.toBeNull();
      expect(this.cachedAdminGuid).not.toBeNull();
      return this.addOrgIfMissing(guid, testOrgName, this.cachedAdminGuid, this.cachedNonAdminGuid);
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
        return this.cfRequestHelper.sendCfPost<APIResource<IOrganization>>(cnsiGuid, 'organizations', { name: orgName });
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
    cnsiGuid,
    orgGuid,
    orgName,
    spaceName,
    endpoint: E2EConfigCloudFoundry,
    skipExistsCheck = false,
  ): promise.Promise<APIResource<ISpace>> {
    return this.assignAdminAndUserGuids(cnsiGuid, endpoint).then(() => {
      expect(this.cachedNonAdminGuid).not.toBeNull();
      return skipExistsCheck ?
        this.baseAddSpace(cnsiGuid, orgGuid, orgName, spaceName, this.cachedNonAdminGuid) :
        this.addSpaceIfMissing(cnsiGuid, orgGuid, orgName, spaceName, this.cachedNonAdminGuid);

    });
  }

  addSpaceIfMissing(cnsiGuid, orgGuid, orgName, spaceName, userGuid): promise.Promise<APIResource<ISpace>> {
    const that = this;
    return this.fetchSpace(cnsiGuid, orgGuid, spaceName)
      .then(function (space) {
        return space ? space : that.baseAddSpace(cnsiGuid, orgGuid, orgName, spaceName, userGuid);
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

  deleteSpaceIfExisting(cnsiGuid: string, orgGuid: string, spaceName: string) {
    return this.fetchSpace(cnsiGuid, orgGuid, spaceName).then(space => {
      if (space) {
        return this.cfRequestHelper.sendCfDelete(cnsiGuid, 'spaces/' + space.metadata.guid);
      }
    });
  }

  fetchUsers(cnsiGuid) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'users').then(json => {
      return json.resources;
    });
  }

  fetchOrg(cnsiGuid: string, orgName: string): promise.Promise<APIResource<any>> {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'organizations?q=name IN ' + orgName).then(json => {
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

  // For fully fleshed out fetch see application-e2e-helpers
  basicFetchApp(cnsiGuid: string, spaceGuid: string, appName: string) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid,
      `apps?inline-relations-depth=1&include-relations=routes,service_bindings&q=name IN ${appName},space_guid IN ${spaceGuid}`);
  }

  // For fully fleshed our create see application-e2e-helpers
  basicCreateApp(cnsiGuid: string, spaceGuid: string, appName: string) {
    return this.cfRequestHelper.sendCfPost(cnsiGuid, 'apps', { name: appName, space_guid: spaceGuid });
  }

  // For fully fleshed out delete see application-e2e-helpers (includes route and service instance deletion)
  basicDeleteApp(cnsiGuid: string, appGuid: string) {
    return this.cfRequestHelper.sendCfDelete(cnsiGuid, 'apps/' + appGuid);
  }

  baseAddSpace(cnsiGuid, orgGuid, orgName, spaceName, userGuid): promise.Promise<APIResource<ISpace>> {
    const cfRequestHelper = this.cfRequestHelper;
    return cfRequestHelper.sendCfPost<APIResource<ISpace>>(cnsiGuid, 'spaces',
      {
        name: spaceName,
        manager_guids: [],
        developer_guids: [userGuid],
        organization_guid: orgGuid
      });
  }

  fetchAppRoutes(cnsiGuid: string, appGuid: string): promise.Promise<APIResource<IRoute>[]> {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, `apps/${appGuid}/routes`).then(res => res.resources);
  }

  updateDefaultCfOrgSpace = (): promise.Promise<any> => {
    // Fetch cf guid, org guid, or space guid from ... cache or jetstream
    return this.fetchDefaultCfGuid(false)
      .then(() => this.fetchDefaultOrgGuid(false))
      .then(() => this.fetchDefaultSpaceGuid(false));
  }


  fetchDefaultCfGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && this.cachedDefaultCfGuid ?
      promise.fullyResolved(this.cachedDefaultCfGuid) :
      this.cfRequestHelper.getCfGuid().then(guid => {
        this.cachedDefaultCfGuid = guid;
        return this.cachedDefaultCfGuid;
      });
  }

  fetchDefaultOrgGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && this.cachedDefaultOrgGuid ?
      promise.fullyResolved(this.cachedDefaultOrgGuid) :
      this.fetchDefaultCfGuid(true).then(guid => this.fetchOrg(guid, e2e.secrets.getDefaultCFEndpoint().testOrg).then(org => {
        this.cachedDefaultOrgGuid = org.metadata.guid;
        return this.cachedDefaultOrgGuid;
      }));
  }

  fetchDefaultSpaceGuid = (fromCache = true): promise.Promise<string> => {
    return fromCache && this.cachedDefaultSpaceGuid ?
      promise.fullyResolved(this.cachedDefaultSpaceGuid) :
      this.fetchDefaultOrgGuid(true).then(orgGuid =>
        this.fetchSpace(this.cachedDefaultCfGuid, orgGuid, e2e.secrets.getDefaultCFEndpoint().testSpace)
      ).then(space => {
        this.cachedDefaultSpaceGuid = space.metadata.guid;
        return this.cachedDefaultSpaceGuid;
      });
  }

}
