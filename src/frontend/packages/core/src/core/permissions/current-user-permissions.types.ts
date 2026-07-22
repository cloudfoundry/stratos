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
   * If this is not supported by the the checker null/undefined is returned. If another checker also lays claim to the same string
   * the check will always return denied
   */
  getPermissionConfig: (action: string) => PermissionConfigType | undefined;
  /**
   * Simple checks are used when the permission config contains a single thing to check.
   * Returns undefined if this checker does not handle the given config.
   */
  getSimpleCheck: (
    permissionConfig: PermissionConfig,
    endpointGuid?: string,
    ...args: any[]
  ) => Observable<boolean> | undefined;
  /**
   * Used when the permission config contains multiple things to check.
   * Returns null if this checker cannot handle all of the given configs.
   */
  getComplexCheck: (
    permissionConfig: PermissionConfig[],
    permission?: PermissionTypes,
    ...args: any[]
  ) => IPermissionCheckCombiner[] | null;
  /**
   * If no checker provides simple. Returns null if this checker has no fallback.
   */
  getFallbackCheck: (
    endpointGuid: string,
    endpointType: string
  ) => Observable<boolean> | null;
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