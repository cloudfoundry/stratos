import { computed, inject, Signal } from '@angular/core';
import { APIKeysEnabled, AuthDataService, CurrentUserRolesDataService, PermissionValues } from '@stratosui/store';

import { IPermissionConfigs, PermissionConfig, PermissionTypes } from './current-user-permissions.config';
import {
  BaseCurrentUserPermissionsChecker,
  IConfigGroups,
  ICurrentUserPermissionsChecker,
  IPermissionCheckCombiner,
} from './current-user-permissions.types';

export enum StratosCurrentUserPermissions {
  EDIT_ENDPOINT = 'edit-endpoint',
  EDIT_ADMIN_ENDPOINT = 'edit-admin-endpoint',
  PASSWORD_CHANGE = 'change-password',
  EDIT_PROFILE = 'edit-profile',
  /**
   * Does the user have permission to view/create/delete their own API Keys?
   */
  API_KEYS = 'api-keys',
  CAN_NOT_LOGOUT = 'no-logout'
}

export enum StratosPermissionStrings {
  _GLOBAL_ = 'global',
  STRATOS_ADMIN = 'isAdmin'
}

export enum StratosScopeStrings {
  STRATOS_CHANGE_PASSWORD = 'password.write',
  SCIM_READ = 'scim.read',
  SCIM_WRITE = 'scim.write',
  STRATOS_NOAUTH = 'stratos.noauth',
  STRATOS_ENDPOINTADMIN = 'stratos.endpointadmin'
}

export enum StratosPermissionTypes {
  STRATOS = 'internal',
  STRATOS_SCOPE = 'internal-scope',
  API_KEY = 'api-key'
}

// For each set permissions are checked by permission types of ENDPOINT, ENDPOINT_SCOPE, STRATOS_SCOPE, FEATURE_FLAG or a random bag.
// Every group result must be true in order for the permission to be true. A group result is true if all or some of it's permissions are
// true (see `getCheckFromConfig`).
export const stratosPermissionConfigs: IPermissionConfigs = {
  [StratosCurrentUserPermissions.EDIT_ENDPOINT]: new PermissionConfig(
    StratosPermissionTypes.STRATOS_SCOPE,
    StratosScopeStrings.STRATOS_ENDPOINTADMIN
  ),
  [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT]: new PermissionConfig(
    StratosPermissionTypes.STRATOS,
    StratosPermissionStrings.STRATOS_ADMIN
  ),
  [StratosCurrentUserPermissions.PASSWORD_CHANGE]: new PermissionConfig(
    StratosPermissionTypes.STRATOS_SCOPE,
    StratosScopeStrings.STRATOS_CHANGE_PASSWORD
  ),
  [StratosCurrentUserPermissions.EDIT_PROFILE]: new PermissionConfig(
    StratosPermissionTypes.STRATOS_SCOPE,
    StratosScopeStrings.SCIM_WRITE
  ),
  [StratosCurrentUserPermissions.API_KEYS]: new PermissionConfig(StratosPermissionTypes.API_KEY, ''),
  [StratosCurrentUserPermissions.CAN_NOT_LOGOUT]: new PermissionConfig(
    StratosPermissionTypes.STRATOS_SCOPE,
    StratosScopeStrings.STRATOS_NOAUTH
  ),
};

export class StratosUserPermissionsChecker extends BaseCurrentUserPermissionsChecker implements ICurrentUserPermissionsChecker {
  private roles = inject(CurrentUserRolesDataService);
  private authData = inject(AuthDataService);

  constructor() {
    super();
  }

  getPermissionConfig(action: string) {
    return stratosPermissionConfigs[action];
  }

  /**
   * @param permissionConfig Single permission to be checked
   */
  public getSimpleCheck(permissionConfig: PermissionConfig): Signal<boolean> | undefined {
    switch (permissionConfig.type) {
      case (StratosPermissionTypes.STRATOS):
        return this.roles.stratosRole(permissionConfig.permission as PermissionValues);
      case (StratosPermissionTypes.STRATOS_SCOPE):
        return this.roles.stratosHasScope(permissionConfig.permission as StratosScopeStrings);
      case (StratosPermissionTypes.API_KEY):
        return this.apiKeyCheck();
    }
    return undefined;
  }

  private apiKeyCheck(): Signal<boolean> {
    const isAdmin = this.roles.stratosRole(StratosPermissionStrings.STRATOS_ADMIN);
    return computed(() => {
      // No session yet: denied until it arrives.
      switch (this.authData.sessionData()?.config.APIKeysEnabled) {
        case APIKeysEnabled.ADMIN_ONLY:
          return isAdmin();
        case APIKeysEnabled.ALL_USERS:
          return true;
      }
      return false;
    });
  }

  public getComplexCheck(
    permissionConfig: PermissionConfig[],
    ..._args: any[]
  ): IPermissionCheckCombiner[] | null {
    const groupedChecks = this.groupConfigs(permissionConfig);
    const res: IPermissionCheckCombiner[] = [];
    for (const permission of Object.keys(groupedChecks) as PermissionTypes[]) {
      const configGroup = groupedChecks[permission];
      switch (permission) {
        case StratosPermissionTypes.STRATOS_SCOPE:
          res.push({
            checks: configGroup.map(config => this.roles.stratosHasScope(config.permission as StratosScopeStrings)),
          });
          break;
        default:
          // Checker must handle all configs; an unhandled group means this
          // checker cannot satisfy the request.
          return null;
      }
    }
    return res;
  }
  public getFallbackCheck(_endpointGuid: string, _endpointType: string): Signal<boolean> | null {
    return null;
  }

  private groupConfigs(configs: PermissionConfig[]): IConfigGroups {
    return configs.reduce((grouped: IConfigGroups, config) => {
      const type = config.type;
      return {
        ...grouped,
        [type]: [
          ...(grouped[type] || []),
          config
        ]
      };
    }, {} as IConfigGroups);
  }

}
