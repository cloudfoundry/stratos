import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { PermissionConfig, PermissionConfigType, PermissionTypes } from './current-user-permissions.config';

export interface IConfigGroups {
  [permissionType: string]: IConfigGroup;
}

export type IConfigGroup = PermissionConfig[];

export type IPermissionCheckCombineTypes = '||' | '&&';

export interface IPermissionCheckCombiner {
  checks: Observable<boolean>[];
  combineType?: IPermissionCheckCombineTypes;
}
export interface ICurrentUserPermissionsChecker {
  /**
   * For the given permission action find the checker configuration that will determine if the user can or cannot do the action
   * If this is not supported by the the checker null is returned. If another checker also lays claim to the same string the check will
   * always return denied
   */
  getPermissionConfig: (action: string) => PermissionConfigType
  /**
   * Simple checks are used when the permission config contains a single thing to check
   */
  getSimpleCheck: (
    permissionConfig: PermissionConfig,
    endpointGuid?: string,
    ...args: any[]
  ) => Observable<boolean>;
  /**
   * Used when the permission config contains multiple things to check
   */
  getComplexCheck: (
    permissionConfig: PermissionConfig[],
    permission: PermissionTypes,
    ...args: any[]
  ) => IPermissionCheckCombiner[];
  /**
   * If no checker provides simple
   */
  getFallbackCheck: (
    endpointGuid: string,
    endpointType: string
  ) => Observable<boolean>;
}

export abstract class BaseCurrentUserPermissionsChecker {
  public static reduceChecks(checks: Observable<boolean>[], type: IPermissionCheckCombineTypes = '||') {
    const func = type === '||' ? 'some' : 'every';
    if (!checks || !checks.length) {
      return of(true);
    }
    return combineLatest(checks).pipe(
      map(flags => flags[func](flag => flag)),
      distinctUntilChanged()
    );
  }
}