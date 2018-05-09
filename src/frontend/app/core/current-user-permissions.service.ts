import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter, map, switchMap, distinctUntilChanged } from 'rxjs/operators';

import { CFFeatureFlagTypes } from '../shared/components/cf-auth/cf-auth.types';
import {
  createCFFeatureFlagPaginationKey,
} from '../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-data-source.helpers';
import { PaginationMonitor } from '../shared/monitors/pagination-monitor';
import { AppState } from '../store/app-state';
import { entityFactory, featureFlagSchemaKey } from '../store/helpers/entity-factory';
import {
  getCurrentUserCFEndpointRolesState,
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
    if (!actionConfig && !actionConfig.length) {
      return endpointGuid ? this.getAdminCheck(endpointGuid) : Observable.of(false);
    }
    const [cfCheckConfigs, featureFlagCheckConfigs] = this.splitCheckConfig(actionConfig);
    const featureFlagChecks = this.getFeatureFlagChecks(featureFlagCheckConfigs, endpointGuid);
    const cfChecks = this.getCfChecks(cfCheckConfigs, endpointGuid, orgOrSpaceGuid);
    const adminCheck = this.getAdminChecks(endpointGuid);
    return this.combineChecks([adminCheck, cfChecks, featureFlagChecks]);
  }

  private getCfChecks(
    configs: PermissionConfig[],
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): Observable<boolean>[] {
    return configs.map(config => {
      const { type } = config;
      return this.getCfCheck(config, endpointGuid, type === PermissionTypes.SPACE && spaceGuid ? spaceGuid : orgOrSpaceGuid);
    });
  }

  private getFeatureFlagChecks(configs: PermissionConfig[], endpointGuid?: string): Observable<boolean>[] {
    return configs.map(config => {
      const { type } = config;
      return this.getFeatureFlagCheck(config, endpointGuid);
    });
  }

  private getCfCheck(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string): Observable<boolean> {
    const { type, permission } = config;
    const cfPermissions = permission as PermissionStrings;
    if (!orgOrSpaceGuid) {
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
    } else if (endpointGuid && orgOrSpaceGuid) {
      return this.check(endpointGuid, orgOrSpaceGuid, type, cfPermissions);
    }
    return Observable.of(false);
  }

  private splitCheckConfig(configs: PermissionConfig[]) {
    return configs.reduce((split, config) => {
      if (config.type === PermissionTypes.FEATURE_FLAG) {
        split[1].push(config);
      } else {
        split[0].push(config);
      }
      return split;
    }, [[], []]);
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

  private checkAllCfEndpoints(type: PermissionTypes, permission: PermissionStrings) {
    return Observable.of(false);
  }

  private getAdminCheck(endpointGuid: string) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
      map(cfPermissions => cfPermissions.global.isAdmin)
    );
  }

  private getAdminChecks(endpointGuid: string) {
    const endpointGuids$ = !endpointGuid ? this.getAllEndpointGuids() : Observable.of([endpointGuid]);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getAdminCheck(guid))),
      switchMap(checks => this.reduceChecks(checks))
    );
  }

  private checkAllOfType(endpointGuid: string, type: PermissionTypes, permission: PermissionStrings) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
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

  private check(endpointGuid: string, orgOrSpaceGuid: string, type: PermissionTypes, permission: PermissionStrings) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
      filter(state => !!state),
      map(state => state[type][orgOrSpaceGuid]),
      map(state => this.selectPermission(state, permission)),
      distinctUntilChanged()
    );
  }

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: PermissionStrings) {
    return state[permission] || false;
  }

  private getConfig(config: PermissionConfigType, _tries = 0): PermissionConfig[] {
    const linkConfig = config as PermissionConfigLink;
    if (linkConfig.link) {
      if (_tries >= 20) {
        // Tried too many times to get permission config, circular reference very likely.
        return;
      }
      ++_tries;
      return this.getLinkedPermissionConfig(linkConfig, _tries);
    } else {
      return config as PermissionConfig[];
    }
  }

  private getLinkedPermissionConfig(linkConfig: PermissionConfigLink, _tries = 0) {
    return this.getConfig(permissionConfigs[linkConfig.link]);
  }

  private combineChecks([adminCheck$, cfChecks, featureFlagChecks]: [Observable<boolean>, Observable<boolean>[], Observable<boolean>[]]) {
    const cfChecksReduced = this.reduceChecks(featureFlagChecks, '&&');
    const featureFlagChecksReduced = this.reduceChecks(cfChecks);
    return adminCheck$.pipe(
      switchMap(isAdmin => {
        if (isAdmin) {
          return Observable.of(true);
        }
        return combineLatest(featureFlagChecksReduced, cfChecksReduced).pipe(
          map(([featureFlagEnabled, cfPermission]) => {
            if (!featureFlagEnabled) {
              return false;
            }
            return cfPermission;
          })
        );
      })
    );
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

}
