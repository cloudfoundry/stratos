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
  getCurrentUserCFGlobalState,
  getCurrentUserStratosRole,
} from '../store/selectors/current-user-roles-permissions-selectors/role.selectors';
import { APIResource } from '../store/types/api.types';
import { IOrgRoleState, ISpaceRoleState } from '../store/types/current-user-roles.types';
import { IFeatureFlag } from './cf-api.types';
import { PermissionConfig, PermissionStrings, PermissionTypes } from './current-user-permissions.config';
import { endpointsRegisteredEntitiesSelector } from '../store/selectors/endpoint.selectors';

export class CurrentUserPermissionsChecker {
  constructor(private store: Store<AppState>) { }
  public check(type: PermissionTypes, permission: PermissionStrings, endpointGuid?: string, orgOrSpaceGuid?: string, ) {
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
  /**
   * 
   * @param permissionConfig Single permission to be checked
   * @param endpointGuid
   * @param orgOrSpaceGuid
   * @param spaceGuid
   */
  public getSimpleCheck(permissionConfig: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    switch (permissionConfig.type) {
      case (PermissionTypes.FEATURE_FLAG):
        return this.getFeatureFlagCheck(permissionConfig, endpointGuid);
      case (PermissionTypes.ORGANIZATION):
      case (PermissionTypes.SPACE):
      case (PermissionTypes.GLOBAL):
        return this.getCfCheck(permissionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
      case (PermissionTypes.STRATOS):
        return this.getInternalCheck(permissionConfig.permission as PermissionStrings);
    }
  }

  public getInternalChecks(
    configs: PermissionConfig[]
  ) {
    return configs.map(config => {
      const { permission } = config;
      return this.getInternalCheck(permission as PermissionStrings);
    });
  }

  public getInternalCheck(permission: PermissionStrings) {
    return this.check(PermissionTypes.STRATOS, permission);
  }

  public getCfChecks(
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

  public getCfCheck(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string): Observable<boolean> {
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

  public getFeatureFlagChecks(configs: PermissionConfig[], endpointGuid?: string): Observable<boolean>[] {
    return configs.map(config => {
      const { type } = config;
      return this.getFeatureFlagCheck(config, endpointGuid);
    });
  }

  public getFeatureFlagCheck(config: PermissionConfig, endpointGuid?: string): Observable<boolean> {
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

  public checkFeatureFlag(featureFlags: APIResource<IFeatureFlag>[], permission: CFFeatureFlagTypes) {
    const flag = featureFlags.find(_flag => _flag.entity.name === permission.toString());
    if (!flag) {
      return false;
    }
    return flag.entity.enabled;
  }

  public getAdminCheck(endpointGuid: string) {
    return this.getEndpointState(endpointGuid).pipe(
      filter(cfPermissions => !!cfPermissions),
      map(cfPermissions => cfPermissions.global.isAdmin)
    );
  }

  public getAdminChecks(endpointGuid?: string) {
    const endpointGuids$ = !endpointGuid ? this.getAllEndpointGuids() : Observable.of([endpointGuid]);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getAdminCheck(guid))),
      switchMap(checks => this.reduceChecks(checks))
    );
  }

  public reduceChecks(checks: Observable<boolean>[], type: '||' | '&&' = '||') {
    const func = type === '||' ? 'some' : 'every';
    if (!checks || !checks.length) {
      return Observable.of(true);
    }
    return combineLatest(checks).pipe(
      map(flags => flags[func](flag => flag)),
      distinctUntilChanged()
    );
  }

  public splitConfigs(configs: PermissionConfig[]) {
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

  private getAllEndpointGuids() {
    return this.store.select(endpointsRegisteredEntitiesSelector).pipe(
      map(endpoints => Object.values(endpoints).filter(e => e.cnsi_type === 'cf').map(endpoint => endpoint.guid))
    );
  }

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: PermissionStrings) {
    return state[permission] || false;
  }

  private getEndpointState(endpointGuid: string) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
      filter(cfPermissions => !!cfPermissions)
    );
  }

}
