import { computed, EnvironmentInjector, Injectable, inject, runInInjectionContext, Signal, untracked } from '@angular/core';
import { EndpointsDataService } from '@stratosui/store';

import {
  CurrentUserPermissions,
  PermissionConfig,
  PermissionConfigLink,
  PermissionConfigType,
} from './current-user-permissions.config';
import {
  BaseCurrentUserPermissionsChecker,
  ICurrentUserPermissionsChecker,
  IPermissionCheckCombiner,
  PERMISSION_DENIED,
} from './current-user-permissions.types';
import { StratosUserPermissionsChecker } from './stratos-user-permissions.checker';

export const CUSTOM_USER_PERMISSION_CHECKERS = 'custom_user_perm_checkers';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserPermissionsService {
  // The checkers call `inject(...)` for the roles data services; they are
  // built on the first permission check, in this captured injection context.
  private injector = inject(EnvironmentInjector);
  private endpointsData = inject(EndpointsDataService);
  private _allCheckers: ICurrentUserPermissionsChecker[] | null = null;

  private get allCheckers(): ICurrentUserPermissionsChecker[] {
    if (!this._allCheckers) {
      this._allCheckers = runInInjectionContext(this.injector, () => {
        const customCheckers = inject<ICurrentUserPermissionsChecker[]>(
          CUSTOM_USER_PERMISSION_CHECKERS as any,
          { optional: true }
        );
        // Cannot set default value for parameter as the Optional decorator sets it to null
        const nullSafeCustomCheckers = customCheckers || [];
        return [
          new StratosUserPermissionsChecker(),
          ...nullSafeCustomCheckers,
        ];
      });
    }
    return this._allCheckers;
  }
  /**
   * @param action The action we're going to check the user's access to.
   * @param endpointGuid If endpointGuid is provided without a  orgOrSpaceGuid the checks will be done across all orgs and
   * spaces within the cf.
   * If no endpoint guid is provided we will do the check over all of the endpoint and all orgs/spaces.
   * @param orgOrSpaceGuid If this is the only param then it will be used as the id to for all permission checks.
   * @param spaceGuid If this is provided then the orgOrSpaceGuid will be used for org related permission checks and this will be
   *  used for space related permission checks.
   * @returns A signal: false until the state the check reads has loaded, then
   *   it follows that state. It holds no subscription, so it lives only as
   *   long as its reader.
   */
  public can(
    action: CurrentUserPermissions | PermissionConfigType,
    endpointGuid?: string,
    ...args: any[]
  ): Signal<boolean> {
    // Untracked: a caller inside a computed must not depend on anything
    // read while the check is built, only on what the check reads.
    return untracked(() => {
      let actionConfig: PermissionConfig[] | PermissionConfig | undefined;
      if (typeof action === 'string') {
        const permConfigType = this.getPermissionConfig(action);
        if (!permConfigType) {
          return PERMISSION_DENIED; // Logging handled in getPermissionConfig
        }
        actionConfig = this.getConfig(permConfigType);
      } else {
        actionConfig = this.getConfig(action);
      }
      return this.getCanSignal(actionConfig, endpointGuid, ...args) ?? PERMISSION_DENIED;
    });
  }

  private getCanSignal(
    actionConfig: PermissionConfig[] | PermissionConfig | undefined,
    endpointGuid?: string,
    ...args: any[]): Signal<boolean> | null {
    if (Array.isArray(actionConfig)) {
      return this.getComplexPermission(actionConfig, endpointGuid, ...args);
    } else if (actionConfig) {
      return this.getSimplePermission(actionConfig, endpointGuid, ...args);
    } else if (endpointGuid) {
      return this.getFallbackForEndpoint(endpointGuid);
    }
    return null;
  }

  /** The fallback check for the endpoint's type, built once per type seen. */
  private getFallbackForEndpoint(endpointGuid: string): Signal<boolean> {
    const endpoint = this.endpointsData.endpointById(endpointGuid);
    let built: { type: string, check: Signal<boolean> } | null = null;
    return computed(() => {
      // strict: a registered endpoint always carries a cnsi_type.
      const type = endpoint()?.cnsi_type;
      if (!type) {
        return false;
      }
      if (built?.type !== type) {
        built = { type, check: untracked(() => this.getFallbackPermission(endpointGuid, type)) };
      }
      return built.check();
    });
  }

  private getSimplePermission(actionConfig: PermissionConfig, endpointGuid?: string, ...args: any[]): Signal<boolean> {
    return this.findChecker<Signal<boolean>>(
      (checker: ICurrentUserPermissionsChecker) => checker.getSimpleCheck(actionConfig, endpointGuid, ...args),
      'permissions check',
      actionConfig.type,
      PERMISSION_DENIED
    );
  }

  private getComplexPermission(permissionConfig: PermissionConfig[], endpointGuid?: string, ...args: any[]) {
    const checks = this.getComplexChecks(permissionConfig, endpointGuid, ...args);
    return this.combineChecks(checks);
  }

  private getComplexChecks(
    permissionConfig: PermissionConfig[],
    endpointGuid?: string,
    ...args: any[]
  ): IPermissionCheckCombiner[] {
    return this.findChecker<IPermissionCheckCombiner[]>(
      (checker: ICurrentUserPermissionsChecker) => checker.getComplexCheck(permissionConfig, endpointGuid, ...args),
      'complex permissions check',
      'a group',
      [{
        checks: [PERMISSION_DENIED]
      }]
    );
  }

  private getConfig(config: PermissionConfigType, tries = 0): PermissionConfig[] | PermissionConfig | undefined {
    const linkConfig = config as PermissionConfigLink;
    if (linkConfig.link) {
      if (tries >= 20) {
        // Tried too many times to get permission config, circular reference very likely.
        return undefined;
      }
      ++tries;
      return this.getLinkedPermissionConfig(linkConfig, tries);
    } else {
      return config as PermissionConfig[] | PermissionConfig;
    }
  }

  private getLinkedPermissionConfig(linkConfig: PermissionConfigLink, tries = 0): PermissionConfig[] | PermissionConfig | undefined {
    const linked = this.getPermissionConfig(linkConfig.link);
    if (!linked) {
      return undefined;
    }
    return this.getConfig(linked, tries);
  }

  private combineChecks(
    checkCombiners: IPermissionCheckCombiner[],
  ): Signal<boolean> {
    const reducedChecks = checkCombiners.map(combiner =>
      BaseCurrentUserPermissionsChecker.reduceChecks(combiner.checks, combiner.combineType)
    );
    // No check groups (empty config): deny rather than grant by default.
    return computed(() => reducedChecks.length > 0 && reducedChecks.every(check => check()));
  }

  private getFallbackPermission(endpointGuid: string, endpointType: string): Signal<boolean> {
    return this.findChecker<Signal<boolean>>(
      (checker: ICurrentUserPermissionsChecker) => checker.getFallbackCheck(endpointGuid, endpointType),
      'fallback permission',
      'N/A',
      // No fallback checker found => permission denied.
      PERMISSION_DENIED
    );
  }

  private getPermissionConfig(key: CurrentUserPermissions): PermissionConfigType | null {
    return this.findChecker<PermissionConfigType | null>(
      (checker: ICurrentUserPermissionsChecker) => checker.getPermissionConfig(key),
      'permissions checker',
      key,
      null
    );
  }

  /**
   * Search through all known checkers for a single result
   * If none are found log warning (hints at bug/misconfigure).
   * If more than one is found log warning (hints re bug/misconfigure/devious plugin)
   */
  private findChecker<T>(
    checkFn: (checker: ICurrentUserPermissionsChecker) => T | null | undefined,
    checkNoun: string,
    checkType: string,
    failureValue: T
  ): T {
    const res: T[] = [];
    for (const checker of this.allCheckers) {
      const checkerRes = checkFn(checker);
      if (checkerRes) {
        res.push(checkerRes);
      }
    }
    if (res.length === 1) {
      return res[0];
    }
    if (res.length > 1) {
      console.warn(`Permissions: Found too many '${checkNoun}' for '${checkType}'. Permission Denied.`);
      return failureValue;
    }
    // res.length === 0
    console.warn(`Permissions: Failed to find a '${checkNoun}' for '${checkType}'. Permission Denied.`);
    return failureValue;
  }
}
