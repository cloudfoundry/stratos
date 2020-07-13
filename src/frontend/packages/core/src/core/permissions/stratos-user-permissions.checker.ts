import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { GeneralEntityAppState } from '../../../../store/src/app-state';
import {
  getCurrentUserStratosHasScope,
  getCurrentUserStratosRole,
  PermissionValues,
} from '../../../../store/src/selectors/current-user-role.selectors';
import { IPermissionConfigs, PermissionConfig, PermissionTypes } from './current-user-permissions.config';
import {
  BaseCurrentUserPermissionsChecker,
  IConfigGroups,
  ICurrentUserPermissionsChecker,
  IPermissionCheckCombiner,
} from './current-user-permissions.types';


export enum StratosCurrentUserPermissions {
  ENDPOINT_REGISTER = 'register.endpoint',
  PASSWORD_CHANGE = 'change-password',
}

export enum StratosPermissionStrings {
  _GLOBAL_ = 'global',
  STRATOS_ADMIN = 'isAdmin'
}


export enum StratosScopeStrings {
  STRATOS_CHANGE_PASSWORD = 'password.write',
  SCIM_READ = 'scim.read'
}

export enum StratosPermissionTypes {
  STRATOS = 'internal',
  STRATOS_SCOPE = 'internal-scope'
}

// For each set permissions are checked by permission types of ENDPOINT, ENDPOINT_SCOPE, STRATOS_SCOPE, FEATURE_FLAG or a random bag.
// Every group result must be true in order for the permission to be true. A group result is true if all or some of it's permissions are
// true (see `getCheckFromConfig`).
export const stratosPermissionConfigs: IPermissionConfigs = {
  [StratosCurrentUserPermissions.ENDPOINT_REGISTER]: new PermissionConfig(StratosPermissionTypes.STRATOS, StratosPermissionStrings.STRATOS_ADMIN),
  [StratosCurrentUserPermissions.PASSWORD_CHANGE]: new PermissionConfig(StratosPermissionTypes.STRATOS_SCOPE, StratosScopeStrings.STRATOS_CHANGE_PASSWORD),
};

export class StratosUserPermissionsChecker extends BaseCurrentUserPermissionsChecker implements ICurrentUserPermissionsChecker {
  constructor(private store: Store<GeneralEntityAppState>, ) {
    super()
  }

  getPermissionConfig(action: string) {
    return stratosPermissionConfigs[action];
  }

  private check(
    type: PermissionTypes,
    permission: PermissionValues,
  ) {
    if (type === StratosPermissionTypes.STRATOS) {
      return this.store.select(getCurrentUserStratosRole(permission));
    }

    if (type === StratosPermissionTypes.STRATOS_SCOPE) {
      return this.store.select(getCurrentUserStratosHasScope(permission as StratosScopeStrings));
    }
  }
  /**
   * @param permissionConfig Single permission to be checked
   */
  public getSimpleCheck(permissionConfig: PermissionConfig): Observable<boolean> {
    switch (permissionConfig.type) {
      case (StratosPermissionTypes.STRATOS):
        return this.getInternalCheck(permissionConfig.permission as StratosPermissionStrings);
      case (StratosPermissionTypes.STRATOS_SCOPE):
        return this.getInternalScopesCheck(permissionConfig.permission as StratosScopeStrings);
    }
  }

  private getInternalCheck(permission: StratosPermissionStrings) {
    return this.check(StratosPermissionTypes.STRATOS, permission);
  }

  private getInternalScopesChecks(
    configs: PermissionConfig[]
  ) {
    return configs.map(config => {
      const { permission } = config;
      return this.getInternalScopesCheck(permission as StratosScopeStrings);
    });
  }

  private getInternalScopesCheck(permission: StratosScopeStrings) {
    return this.check(StratosPermissionTypes.STRATOS_SCOPE, permission);
  }

  public getComplexCheck(
    permissionConfig: PermissionConfig[],
    ...args: any[]
  ): IPermissionCheckCombiner[] {
    const groupedChecks = this.groupConfigs(permissionConfig);
    const res = Object.keys(groupedChecks).map((permission: PermissionTypes) => {
      const configGroup = groupedChecks[permission];
      switch (permission) {
        case StratosPermissionTypes.STRATOS_SCOPE:
          return {
            checks: this.getInternalScopesChecks(configGroup),
          };
      }
    })
    // Checker must handle all configs
    return res.every(check => !!check) ? res : null;
  }
  public getFallbackCheck(endpointGuid: string, endpointType: string): Observable<boolean> {
    return null;
  };

  private groupConfigs(configs: PermissionConfig[]): IConfigGroups {
    return configs.reduce((grouped, config) => {
      const type = config.type;
      return {
        ...grouped,
        [type]: [
          ...(grouped[type] || []),
          config
        ]
      };
    }, {});
  }

}
