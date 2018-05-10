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

@Injectable()
export class CurrentUserPermissionsService {

  constructor(private store: Store<AppState>) { }

  public can(action: CurrentUserPermissions, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string): Observable<boolean> {
    const actionConfig = this.getConfig(permissionConfigs[action]);
    if (Array.isArray(actionConfig)) {
      return this.getComplexPermission(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    } else if (actionConfig) {
      return this.getSimplePermission(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    } else {
      return endpointGuid ? this.getAdminCheck(endpointGuid) : Observable.of(false);
    }
  }

  private getSimplePermission(actionConfig: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    const check$ = this.getSimpleCheck(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    if (actionConfig.type === PermissionTypes.ORGANIZATION || actionConfig.type === PermissionTypes.SPACE) {
      return this.applyAdminCheck(check$, endpointGuid);
    }
    return check$;
  }

  private getSimpleCheck(actionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    switch (actionConfig.type) {
      case (PermissionTypes.FEATURE_FLAG):
        return this.getFeatureFlagCheck(actionConfig, endpointGuid);
      case (PermissionTypes.ORGANIZATION):
      case (PermissionTypes.SPACE):
      case (PermissionTypes.GLOBAL):
        return this.getCfCheck(actionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
      case (PermissionTypes.STRATOS):
        return this.getInternalCheck(actionConfig.permission as PermissionStrings);
    }
  }

  private getComplexPermission(actionConfigs: PermissionConfig[], endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    const [cfCheckConfigs, featureFlagCheckConfigs, internalCheckConfigs] = this.splitCheckConfig(actionConfigs);
    const featureFlagChecks = this.getFeatureFlagChecks(featureFlagCheckConfigs, endpointGuid);
    const cfChecks = this.getCfChecks(cfCheckConfigs, endpointGuid, orgOrSpaceGuid, spaceGuid);
    const internalChecks = this.getInternalChecks(internalCheckConfigs);
    return this.combineChecks([cfChecks, featureFlagChecks], endpointGuid);
  }

  private getInternalChecks(
    configs: PermissionConfig[]
  ) {
    return configs.map(config => {
      const { permission } = config;
      return this.getInternalCheck(permission as PermissionStrings);
    });
  }

  private getInternalCheck(permission: PermissionStrings) {
    return this.check(PermissionTypes.STRATOS, permission);
  }


  private getCfChecks(
    configs: PermissionConfig[],
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): Observable<boolean>[] {
    return configs.map(config => {
      const { type } = config;
      return this.getCfCheck(config, endpointGuid, orgOrSpaceGuid, spaceGuid);
    });
  }

  private getFeatureFlagChecks(configs: PermissionConfig[], endpointGuid?: string): Observable<boolean>[] {
    return configs.map(config => {
      const { type } = config;
      return this.getFeatureFlagCheck(config, endpointGuid);
    });
  }

  private getCfCheck(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string): Observable<boolean> {
    const { type, permission } = config;
    const actualGuid = type === PermissionTypes.SPACE && spaceGuid ? spaceGuid : orgOrSpaceGuid;
    const cfPermissions = permission as PermissionStrings;
    if (type === PermissionTypes.GLOBAL || (endpointGuid && actualGuid)) {
      return this.check(type, cfPermissions, endpointGuid, actualGuid);
    } else if (!actualGuid) {
      const endpointGuids$ = !endpointGuid ? this.getAllEndpointGuids() : Observable.of([endpointGuid]);
      return endpointGuids$.pipe(
        switchMap(guids => {
          return combineLatest(guids.map(guid => {
            return this.checkAllOfType(guid, type, cfPermissions);
          })).pipe(
            map(checks => checks.some(check => check)),
            distinctUntilChanged()
          );
        })
      );
    }
    return Observable.of(false);
  }

  private splitCheckConfig(configs: PermissionConfig[]) {
    return configs.reduce((split, config) => {
      if (config.type === PermissionTypes.FEATURE_FLAG) {
        split[1].push(config);
      } else if (config.type === PermissionTypes.GLOBAL) {
        split[2].push(config);
      } else {
        // ORG org SPACE permission
        split[0].push(config);
      }
      return split;
    }, [[], [], []]);
  }

  // private generateChecks(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string) {
  //   const { type, permission } = config;
  //   switch (config.type) {
  //     case PermissionTypes.FEATURE_FLAG:
  //       return this.getFeatureFlagCheck(config, endpointGuid);
  //     case PermissionTypes.ORGANIZATION:
  //     case PermissionTypes.SPACE:
  //     case PermissionTypes.GLOBAL:
  //       return this.getCfChecks(config, endpointGuid, orgOrSpaceGuid);
  //   }
  //   return Observable.of(false);
  // }

  private getFeatureFlagCheck(config: PermissionConfig, endpointGuid?: string): Observable<boolean> {
    const permission = config.permission as CFFeatureFlagTypes;
    const endpointGuids$ = !endpointGuid ? this.getAllEndpointGuids() : Observable.of([endpointGuid]);
    return endpointGuids$.pipe(
      switchMap(guids => {
        const paginationKeys = guids.map(guid => createCFFeatureFlagPaginationKey(guid));
        return combineLatest(
          paginationKeys.map(
            key => new PaginationMonitor<APIResource<IFeatureFlag>>(this.store, key, entityFactory(featureFlagSchemaKey)).currentPage$
          )
        ).pipe(
          map(endpointFeatureFlags => endpointFeatureFlags.some(featureFlags => this.checkFeatureFlag(featureFlags, permission))),
          distinctUntilChanged()
        );
      })
    );
  }

  private checkFeatureFlag(featureFlags: APIResource<IFeatureFlag>[], permission: CFFeatureFlagTypes) {
    const flag = featureFlags.find(_flag => _flag.entity.name === permission.toString());
    if (!flag) {
      return false;
    }
    return flag.entity.enabled;
  }

  private getAllEndpointGuids() {
    return this.store.select(endpointsRegisteredEntitiesSelector).pipe(
      map(endpoints => Object.values(endpoints).filter(e => e.cnsi_type === 'cf').map(endpoint => endpoint.guid))
    );
  }

  private getAdminCheck(endpointGuid: string) {
    return this.getEndpointState(endpointGuid).pipe(
      filter(cfPermissions => !!cfPermissions),
      map(cfPermissions => cfPermissions.global.isAdmin)
    );
  }

  private getAdminChecks(endpointGuid?: string) {
    const endpointGuids$ = !endpointGuid ? this.getAllEndpointGuids() : Observable.of([endpointGuid]);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getAdminCheck(guid))),
      switchMap(checks => this.reduceChecks(checks))
    );
  }

  private checkAllOfType(endpointGuid: string, type: PermissionTypes, permission: PermissionStrings) {
    return this.getEndpointState(endpointGuid).pipe(
      filter(state => !!state),
      map(state => {
        if (!state[type]) {
          return false;
        }
        return Object.keys(state[type]).some(guid => {
          return this.selectPermission(state[type][guid], permission);
        });
      })
    );
  }

  private check(type: PermissionTypes, permission: PermissionStrings, endpointGuid?: string, orgOrSpaceGuid?: string, ) {
    if (type === PermissionTypes.STRATOS) {
      return this.store.select(getCurrentUserStratosRole(permission));
    }
    if (type === PermissionTypes.GLOBAL) {
      return this.store.select(getCurrentUserCFGlobalState(permission));
    }
    return this.getEndpointState(endpointGuid).pipe(
      filter(state => !!state),
      map(state => state[type][orgOrSpaceGuid]),
      filter(state => !!state),
      map(state => this.selectPermission(state, permission)),
      distinctUntilChanged()
    );
  }

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: PermissionStrings) {
    return state[permission] || false;
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
    const adminCheck$ = this.getAdminChecks(endpointGuid);
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
    [cfChecks, featureFlagChecks]: [Observable<boolean>[], Observable<boolean>[]],
    endpointGuid?: string
  ) {
    const featureFlagChecksReduced = this.reduceChecks(featureFlagChecks, '&&');
    const cfChecksReduced = this.reduceChecks(cfChecks);
    const check$ = combineLatest(featureFlagChecksReduced, cfChecksReduced).pipe(
      map(([featureFlagEnabled, cfPermission]) => {
        if (!featureFlagEnabled) {
          return false;
        }
        return cfPermission;
      })
    );
    return this.applyAdminCheck(check$, endpointGuid);
  }

  private reduceChecks(checks: Observable<boolean>[], type: '||' | '&&' = '||') {
    const func = type === '||' ? 'some' : 'every';
    if (!checks || !checks.length) {
      return Observable.of(true);
    }
    return combineLatest(checks).pipe(
      map(flags => flags[func](flag => flag)),
      distinctUntilChanged()
    );
  }

  private getEndpointState(endpointGuid: string) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
      filter(cfPermissions => !!cfPermissions)
    );
  }

}
