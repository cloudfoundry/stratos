import { CFRequestHelpers } from './cf-request-helpers';
import { E2ESetup } from '../e2e';
import { promise } from 'protractor';
import { E2EConfigCloudFoundry } from '../e2e.types';

export class CFHelpers {
  cfRequestHelper: CFRequestHelpers;

  constructor(public e2eSetup: E2ESetup) {
    this.cfRequestHelper = new CFRequestHelpers(e2eSetup);
  }

  addOrgIfMissingForEndpointUsers(guid: string, endpoint: E2EConfigCloudFoundry, testOrgName: string) {
    let testAdminUser, testUser;
    return this.fetchUsers(guid).then(users => {
      testUser = this.findUser(users, endpoint.creds.nonAdmin.username);
      testAdminUser = this.findUser(users, endpoint.creds.admin.username);
        expect(testUser).toBeDefined();
        expect(testAdminUser).toBeDefined();
        return this.addOrgIfMissing(guid, testOrgName, testAdminUser.metadata.guid, testUser.metadata.guid);
    });
  }

  private findUser(users: any, name: string) {
    return users.find(user => user && user.entity && user.entity.username === name);
  }

  addOrgIfMissing(cnsiGuid, orgName, adminGuid, userGuid) {
    let added;
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'organizations?q=name IN ' + orgName).then(json => {
      if (json.total_results === 0) {
        added = true;
        return this.cfRequestHelper.sendCfPost(cnsiGuid, 'organizations', { name: orgName });
      }
      return json;
    }).then(newOrg => {
      if (!added) {
        // No need to mess around with permissions, it exists already.
        return newOrg;
      }
      const org = newOrg.resources ? newOrg.resources[0] as any : newOrg;
      const orgGuid = org.metadata.guid;
      const p1 = this.cfRequestHelper.sendCfPut(cnsiGuid, 'organizations/' + orgGuid + '/users/' + adminGuid);
      const p2 = this.cfRequestHelper.sendCfPut(cnsiGuid, 'organizations/' + orgGuid + '/users/' + userGuid);
      // Add user to org users
      return p1.then(() => p2.then(() => {
        return this.cfRequestHelper.sendCfPut(cnsiGuid, 'organizations/' + orgGuid + '/managers/' + adminGuid)
          .then(() => newOrg);
      }));
    });
  }

  addSpaceIfMissing(cnsiGuid, orgGuid, orgName, spaceName, adminGuid, userGuid) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid,
      'spaces?inline-relations-depth=1&include-relations=organization&q=name IN ' + spaceName)
      .then(function (json) {
        let add = false;
        if (json.total_results === 0) {
          add = true;
        } else if (json.total_results > 0) {
          add = !!json.resources.find(r => {
            return r && r.entity && r.entity.organization && r.entity.organization.entity && r.entity.organization.entity.name === orgName;
          });
        }
        if (add) {
          return this.cfRequestHelper.sendCfPost(cnsiGuid, 'pp/v1/proxy/v2/spaces',
            {
              name: spaceName,
              manager_guids: [adminGuid],
              developer_guids: [userGuid, adminGuid],
              organization_guid: orgGuid
            });
        }
      });
  }

  fetchApp(cnsiGuid, appName) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid,
      'apps?inline-relations-depth=1&include-relations=routes,service_bindings&q=name IN ' + appName)
      .then(json => {
        if (json.total_results < 1) {
          return null;
        } else if (json.total_results === 1) {
          return json.resources[0];
        } else {
          throw new Error('There should only be one app, found multiple. Add Name: ' + appName);
        }
    });
  }

  fetchServiceExist(cnsiGuid, serviceName) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'service_instances?q=name IN ' + serviceName).then(json => {
      return json.resources;
    });
  }

  deleteOrgIfExisting(cnsiGuid: string, orgName: string) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'organizations?q=name IN ' + orgName).then(json => {
      if (json.total_results > 0) {
        const org = json.resources[0];
        if (org) {
          return this.cfRequestHelper.sendCfDelete(cnsiGuid, 'organizations/' + org.metadata.guid);
        }
      }
    });
  }

  deleteSpaceIfExisting(cnsiGuid: string, spaceName: string) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'spaces?q=name IN ' + spaceName).then(json => {
      if (json.total_results > 0) {
        const space = json.resources[0];
        if (space) {
          return this.cfRequestHelper.sendCfDelete(cnsiGuid, 'spaces/' + space.metadata.guid);
        }
      }
    });
  }

  fetchUsers(cnsiGuid) {
    return this.cfRequestHelper.sendCfGet(cnsiGuid, 'users').then(json => {
      return json.resources;
    });
  }
}
