import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { GeneralEntityAppState } from '../../../store/src/app-state';
import {
  getCurrentUserStratosHasScope,
  getCurrentUserStratosRole,
} from '../../../store/src/selectors/current-user-role.selectors';
import {
  PermissionConfig,
  PermissionStrings,
  PermissionTypes,
  PermissionValues,
  ScopeStrings,
} from './current-user-permissions.config';

// Simpler permissions checker for Stratos permissions only
export class CurrentUserPermissionsChecker {

  constructor(private store: Store<GeneralEntityAppState>) { }

  public check(type: PermissionTypes, permission: PermissionValues) {
    if (type === PermissionTypes.STRATOS) {
      return this.store.select(getCurrentUserStratosRole(permission));
    }

    if (type === PermissionTypes.STRATOS_SCOPE) {
      return this.store.select(getCurrentUserStratosHasScope(permission as ScopeStrings));
    }

    return observableOf(false);
  }

  /**
   * @param permissionConfig Single permission to be checked
   */
  public getSimpleCheck(permissionConfig: PermissionConfig) {
    switch (permissionConfig.type) {
      case (PermissionTypes.STRATOS):
        return this.getInternalCheck(permissionConfig.permission as PermissionStrings);
      case (PermissionTypes.STRATOS_SCOPE):
        return this.getInternalScopesCheck(permissionConfig.permission as ScopeStrings);
    }
  }

  public getInternalChecks(configs: PermissionConfig[]) {
    return configs.map(config => {
      const { permission } = config;
      return this.getInternalCheck(permission as PermissionStrings);
    });
  }

  public getInternalCheck(permission: PermissionStrings) {
    return this.check(PermissionTypes.STRATOS, permission);
  }

  public getInternalScopesChecks(configs: PermissionConfig[]) {
    return configs.map(config => {
      const { permission } = config;
      return this.getInternalScopesCheck(permission as ScopeStrings);
    });
  }

  public getInternalScopesCheck(permission: ScopeStrings) {
    return this.check(PermissionTypes.STRATOS_SCOPE, permission);
  }
}
