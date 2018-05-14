import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';

import { CFFeatureFlagTypes } from '../shared/components/cf-auth/cf-auth.types';
import {
  createCFFeatureFlagPaginationKey,
} from '../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-data-source.helpers';
import { PaginationMonitor } from '../shared/monitors/pagination-monitor';
import { AppState } from '../store/app-state';
import { entityFactory, featureFlagSchemaKey } from '../store/helpers/entity-factory';
import {
  getCurrentUserCFEndpointRolesState,
  getCurrentUserStratosRole,
  getCurrentUserCFGlobalState,
} from '../store/selectors/current-user-roles-permissions-selectors/role.selectors';
import { endpointsRegisteredEntitiesSelector } from '../store/selectors/endpoint.selectors';
import { APIResource } from '../store/types/api.types';
import { IOrgRoleState, ISpaceRoleState } from '../store/types/current-user-roles.types';
import { IFeatureFlag } from './cf-api.types';
import {
  CurrentUserPermissions,
  PermissionConfig,
  PermissionConfigLink,
  permissionConfigs,
  PermissionConfigType,
  PermissionStrings,
  PermissionTypes,
} from './current-user-permissions.config';
import { CurrentUserPermissionsChecker, IConfigGroups, IConfigGroup } from './current-user-permissions.checker';

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
  public can(action: CurrentUserPermissions, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string): Observable<boolean> {
    const actionConfig = this.getConfig(permissionConfigs[action]);
    if (Array.isArray(actionConfig)) {
      return this.getComplexPermission(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    } else if (actionConfig) {
      return this.getSimplePermission(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    } else {
      return endpointGuid ? this.checker.getAdminCheck(endpointGuid) : Observable.of(false);
    }
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
    // const featureFlagChecks = this.checker.getFeatureFlagChecks(featureFlagCheckConfigs, endpointGuid);
    // const cfChecks = this.checker.getCfChecks(cfCheckConfigs, endpointGuid, orgOrSpaceGuid, spaceGuid);
    // const internalChecks = this.checker.getInternalChecks(internalCheckConfigs);
    return this.combineChecks(checks, endpointGuid);
  }

  private getChecksFromConfigGroups(groups: IConfigGroups, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    return Object.keys(groups).map((permission: PermissionTypes) => {
      return this.getCheckFromConfig(groups[permission], permission, endpointGuid, orgOrSpaceGuid, spaceGuid);
    });
  }

  private getCheckFromConfig(
    configGroup: IConfigGroup,
    permission: PermissionTypes,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): ICheckCombiner {
    switch (permission) {
      case PermissionTypes.ENDPOINT:
        return {
          checks: this.checker.getInternalChecks(configGroup),
        };
      case PermissionTypes.FEATURE_FLAG:
        return {
          checks: this.checker.getFeatureFlagChecks(configGroup, endpointGuid),
          combineType: '&&'
        };
      case PermissionTypes.ORGANIZATION:
      case PermissionTypes.SPACE:
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
    return adminCheck$.pipe(
      distinctUntilChanged(),
      switchMap(isAdmin => {
        if (isAdmin) {
          return Observable.of(true);
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
      map(([featureFlagEnabled, cfPermission]) => {
        if (!featureFlagEnabled) {
          return false;
        }
        return cfPermission;
      })
    );
    return this.applyAdminCheck(check$, endpointGuid);
  }
}
