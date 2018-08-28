import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { AppState } from '../store/app-state';
import {
  CHECKER_GROUPS,
  CurrentUserPermissionsChecker,
  IConfigGroup,
  IConfigGroups,
} from './current-user-permissions.checker';
import {
  CurrentUserPermissions,
  PermissionConfig,
  PermissionConfigLink,
  permissionConfigs,
  PermissionConfigType,
  PermissionTypes,
} from './current-user-permissions.config';

interface ICheckCombiner {
  checks: Observable<boolean>[];
  combineType?: '&&';
}

@Injectable()
export class CurrentUserPermissionsService {
  private checker: CurrentUserPermissionsChecker;
  constructor(private store: Store<AppState>) {
    this.checker = new CurrentUserPermissionsChecker(store);
  }
  /**
   * @param action The action we're going to check the user's access to.
   * @param endpointGuid If endpointGuid is provided without a  orgOrSpaceGuid the checks will be done across all orgs and
   * spaces within the cf.
   * If no endpoint guid is provided we will do the check over all of the endpoint and all orgs/spaces.
   * @param orgOrSpaceGuid If this is the only param then it will be used as the id to for all permission checks.
   * @param spaceGuid If this is provided then the orgOrSpaceGuid will be used for org related permission checks and this will be
   *  used for space related permission checks.
   */
  public can(
    action: CurrentUserPermissions | PermissionConfigType,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): Observable<boolean> {
    const actionConfig = this.getConfig(typeof action === 'string' ? permissionConfigs[action] : action);
    const obs$ = this.getCanObservable(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    return obs$ ? obs$.pipe(
      distinctUntilChanged(),
    ) : observableOf(false);
  }

  private getCanObservable(
    actionConfig: PermissionConfig[] | PermissionConfig,
    endpointGuid: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string): Observable<boolean> {
    if (Array.isArray(actionConfig)) {
      return this.getComplexPermission(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    } else if (actionConfig) {
      return this.getSimplePermission(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    } else if (endpointGuid) {
      return this.checker.getAdminCheck(endpointGuid);
    }
    return null;
  }

  private getSimplePermission(actionConfig: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    const check$ = this.checker.getSimpleCheck(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    if (actionConfig.type === PermissionTypes.ORGANIZATION || actionConfig.type === PermissionTypes.SPACE) {
      return this.applyAdminCheck(check$, endpointGuid);
    }
    return check$;
  }

  private getComplexPermission(actionConfigs: PermissionConfig[], endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    const groupedChecks = this.checker.groupConfigs(actionConfigs);
    const checks = this.getChecksFromConfigGroups(groupedChecks, endpointGuid, orgOrSpaceGuid, spaceGuid);
    return this.combineChecks(checks, endpointGuid);
  }

  private getChecksFromConfigGroups(groups: IConfigGroups, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    return Object.keys(groups).map((permission: PermissionTypes) => {
      return this.getCheckFromConfig(groups[permission], permission, endpointGuid, orgOrSpaceGuid, spaceGuid);
    });
  }

  private getCheckFromConfig(
    configGroup: IConfigGroup,
    permission: PermissionTypes | CHECKER_GROUPS,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): ICheckCombiner {
    switch (permission) {
      case PermissionTypes.ENDPOINT:
        return {
          checks: this.checker.getInternalScopesChecks(configGroup),
        };
      case PermissionTypes.ENDPOINT_SCOPE:
        return {
          checks: this.checker.getEndpointScopesChecks(configGroup, endpointGuid),
        };
      case PermissionTypes.STRATOS_SCOPE:
        return {
          checks: this.checker.getInternalScopesChecks(configGroup),
        };
      case PermissionTypes.FEATURE_FLAG:
        return {
          checks: this.checker.getFeatureFlagChecks(configGroup, endpointGuid),
          combineType: '&&'
        };
      case CHECKER_GROUPS.CF_GROUP:
        return {
          checks: this.checker.getCfChecks(configGroup, endpointGuid, orgOrSpaceGuid, spaceGuid)
        };
    }
  }

  private getConfig(config: PermissionConfigType, _tries = 0): PermissionConfig[] | PermissionConfig {
    const linkConfig = config as PermissionConfigLink;
    if (linkConfig.link) {
      if (_tries >= 20) {
        // Tried too many times to get permission config, circular reference very likely.
        return;
      }
      ++_tries;
      return this.getLinkedPermissionConfig(linkConfig, _tries);
    } else {
      return config as PermissionConfig[] | PermissionConfig;
    }
  }

  private getLinkedPermissionConfig(linkConfig: PermissionConfigLink, _tries = 0) {
    return this.getConfig(permissionConfigs[linkConfig.link]);
  }

  private applyAdminCheck(check$: Observable<boolean>, endpointGuid?: string) {
    const adminCheck$ = this.checker.getAdminChecks(endpointGuid);
    const readOnlyCheck$ = this.checker.getReadOnlyChecks(endpointGuid);
    return combineLatest(
      adminCheck$,
      readOnlyCheck$
    ).pipe(
      distinctUntilChanged(),
      switchMap(([isAdmin, isReadOnly]) => {
        if (isAdmin) {
          return observableOf(true);
        }
        if (isReadOnly) {
          return observableOf(false);
        }
        return check$;
      })
    );
  }

  private combineChecks(
    checkCombiners: ICheckCombiner[],
    endpointGuid?: string
  ) {
    const reducedChecks = checkCombiners.map(combiner => this.checker.reduceChecks(combiner.checks, combiner.combineType));
    const check$ = combineLatest(reducedChecks).pipe(
      map(checks => {
        return checks.every(check => check);
      })
    );
    return this.applyAdminCheck(check$, endpointGuid);
  }
}
