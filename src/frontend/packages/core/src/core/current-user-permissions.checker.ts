import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';

import { CFFeatureFlagTypes, IFeatureFlag } from '../../../cloud-foundry/src/cf-api.types';
import { cfEntityCatalog } from '../../../cloud-foundry/src/cf-entity-catalog';
import {
  getCurrentUserCFEndpointHasScope,
  getCurrentUserCFEndpointRolesState,
  getCurrentUserCFGlobalState,
} from '../../../cloud-foundry/src/store/selectors/cf-current-user-role.selectors';
import {
  IOrgRoleState,
  ISpaceRoleState,
  ISpacesRoleState,
} from '../../../cloud-foundry/src/store/types/cf-current-user-roles.types';
import { GeneralEntityAppState } from '../../../store/src/app-state';
import {
  getCurrentUserStratosHasScope,
  getCurrentUserStratosRole,
} from '../../../store/src/selectors/current-user-role.selectors';
import { connectedEndpointsSelector } from '../../../store/src/selectors/endpoint.selectors';
import {
  PermissionConfig,
  PermissionStrings,
  PermissionTypes,
  PermissionValues,
  ScopeStrings,
} from './current-user-permissions.config';


export interface IConfigGroups {
  [permissionType: string]: IConfigGroup;
}
export enum CHECKER_GROUPS {
  CF_GROUP = '__CF_TYPE__'
}

export type IConfigGroup = PermissionConfig[];
export class CurrentUserPermissionsChecker {
  static readonly ALL_SPACES = 'PERMISSIONS__ALL_SPACES_PLEASE';
  constructor(private store: Store<GeneralEntityAppState>, ) { }
  public check(
    type: PermissionTypes,
    permission: PermissionValues,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    allSpacesWithinOrg = false
  ) {
    if (type === PermissionTypes.STRATOS) {
      return this.store.select(getCurrentUserStratosRole(permission));
    }

    if (type === PermissionTypes.STRATOS_SCOPE) {
      return this.store.select(getCurrentUserStratosHasScope(permission as ScopeStrings));
    }

    if (type === PermissionTypes.ENDPOINT_SCOPE) {
      if (!endpointGuid) {
        return observableOf(false);
      }
      return this.store.select(getCurrentUserCFEndpointHasScope(endpointGuid, permission as ScopeStrings));
    }

    if (type === PermissionTypes.ENDPOINT) {
      return this.store.select(getCurrentUserCFGlobalState(endpointGuid, permission));
    }
    return this.getEndpointState(endpointGuid).pipe(
      filter(state => !!state),
      map(state => {
        const permissionString = permission as PermissionStrings;
        if (allSpacesWithinOrg) {
          const spaceState = state[PermissionTypes.SPACE];
          return this.checkAllSpacesInOrg(state[PermissionTypes.ORGANIZATION][orgOrSpaceGuid], spaceState, permissionString);
        }
        return this.selectPermission(state[type][orgOrSpaceGuid], permissionString);
      }),
      distinctUntilChanged(),
    );
  }
  /**
   * @param permissionConfig Single permission to be checked
   */
  public getSimpleCheck(permissionConfig: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    switch (permissionConfig.type) {
      case (PermissionTypes.FEATURE_FLAG):
        return this.getFeatureFlagCheck(permissionConfig, endpointGuid);
      case (PermissionTypes.ORGANIZATION):
      case (PermissionTypes.SPACE):
      case (PermissionTypes.ENDPOINT):
        return this.getCfCheck(permissionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
      case (PermissionTypes.STRATOS):
        return this.getInternalCheck(permissionConfig.permission as PermissionStrings);
      case (PermissionTypes.STRATOS_SCOPE):
        return this.getInternalScopesCheck(permissionConfig.permission as ScopeStrings);
      case (PermissionTypes.ENDPOINT_SCOPE):
        return this.getEndpointScopesCheck(permissionConfig.permission as ScopeStrings, endpointGuid);
    }
  }

  private checkAllSpacesInOrg(orgState: IOrgRoleState, endpointSpaces: ISpacesRoleState, permission: PermissionStrings) {
    const spaceGuids = !!orgState && orgState.spaceGuids ? orgState.spaceGuids : [];
    return spaceGuids.map(spaceGuid => {
      const space = endpointSpaces[spaceGuid];
      return space ? space[permission] || false : false;
    }).some(check => check);
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

  public getInternalScopesChecks(
    configs: PermissionConfig[]
  ) {
    return configs.map(config => {
      const { permission } = config;
      return this.getInternalScopesCheck(permission as ScopeStrings);
    });
  }

  public getEndpointScopesCheck(permission: ScopeStrings, endpointGuid?: string) {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      switchMap(guids => combineLatest(guids.map(guid => this.check(PermissionTypes.ENDPOINT_SCOPE, permission, endpointGuid)))),
      map(checks => checks.some(check => check)),
      distinctUntilChanged()
    );
  }

  public getEndpointScopesChecks(
    configs: PermissionConfig[],
    endpoint?: string
  ) {
    return configs.map(config => {
      const { permission } = config;
      return this.getEndpointScopesCheck(permission as ScopeStrings, endpoint);
    });
  }

  public getInternalScopesCheck(permission: ScopeStrings) {
    return this.check(PermissionTypes.STRATOS_SCOPE, permission);
  }

  public getCfChecks(
    configs: PermissionConfig[],
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): Observable<boolean>[] {
    return configs.map(config => this.getCfCheck(config, endpointGuid, orgOrSpaceGuid, spaceGuid));
  }

  public getCfCheck(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string): Observable<boolean> {
    const { type, permission } = config;
    const checkAllSpaces = spaceGuid === CurrentUserPermissionsChecker.ALL_SPACES;
    const actualGuid = type === PermissionTypes.SPACE && spaceGuid && !checkAllSpaces ? spaceGuid : orgOrSpaceGuid;
    const cfPermissions = permission as PermissionStrings;
    if (type === PermissionTypes.ENDPOINT || (endpointGuid && actualGuid)) {
      return this.check(type, cfPermissions, endpointGuid, actualGuid, checkAllSpaces);
    } else if (!actualGuid) {
      const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
      return endpointGuids$.pipe(
        switchMap(guids => combineLatest(guids.map(guid => this.checkAllOfType(guid, type, cfPermissions)))),
        map(checks => checks.some(check => check)),
        distinctUntilChanged()
      );
    }
    return observableOf(false);
  }

  public getFeatureFlagChecks(configs: PermissionConfig[], endpointGuid?: string): Observable<boolean>[] {
    return configs.map(config => {
      return this.getFeatureFlagCheck(config, endpointGuid);
    });
  }

  public getFeatureFlagCheck(config: PermissionConfig, endpointGuid?: string): Observable<boolean> {
    const permission = config.permission as CFFeatureFlagTypes;
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      switchMap(guids => {
        const createFFObs = guid =>
          // For admins we don't have the ff list which is usually fetched right at the start,
          // so this can't be a pagination monitor on its own (which doesn't fetch if list is missing)
          cfEntityCatalog.featureFlag.store.getPaginationService(guid).entities$;
        return combineLatest(guids.map(createFFObs));
      }),
      map(endpointFeatureFlags => endpointFeatureFlags.some(featureFlags => this.checkFeatureFlag(featureFlags, permission))),
      // startWith(false), // Don't start with anything, this ensures first value out can be trusted. Should never get to the point where
      // nothing is returned
      distinctUntilChanged(),
    );
  }

  public checkFeatureFlag(featureFlags: IFeatureFlag[], permission: CFFeatureFlagTypes) {
    const flag = featureFlags.find(ff => ff.name === permission.toString());
    if (!flag) {
      return false;
    }
    return flag.enabled;
  }

  public getAdminCheck(endpointGuid: string) {
    return this.getEndpointState(endpointGuid).pipe(
      filter(cfPermissions => !!cfPermissions),
      map(cfPermissions => cfPermissions.global.isAdmin)
    );
  }

  public getAdminChecks(endpointGuid?: string) {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getAdminCheck(guid))),
      switchMap(checks => this.reduceChecks(checks))
    );
  }

  /**
   * Includes read only admins, global auditors and users that don't have the cloud_controller.write scope
   */
  public getReadOnlyCheck(endpointGuid: string) {
    return this.getEndpointState(endpointGuid).pipe(
      map(
        cfPermissions => (
          cfPermissions && (
            cfPermissions.global.isGlobalAuditor ||
            cfPermissions.global.isReadOnlyAdmin ||
            !cfPermissions.global.canWrite
          )
        )
      ),
      distinctUntilChanged()
    );
  }
  /**
   * If no endpoint is passed, check them all
   */
  public getReadOnlyChecks(endpointGuid?: string) {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getReadOnlyCheck(guid))),
      switchMap(checks => this.reduceChecks(checks, '&&'))
    );
  }

  public reduceChecks(checks: Observable<boolean>[], type: '||' | '&&' = '||') {
    const func = type === '||' ? 'some' : 'every';
    if (!checks || !checks.length) {
      return observableOf(true);
    }
    return combineLatest(checks).pipe(
      map(flags => flags[func](flag => flag)),
      distinctUntilChanged()
    );
  }

  public groupConfigs(configs: PermissionConfig[]): IConfigGroups {
    return configs.reduce((grouped, config) => {
      const type = this.getGroupType(config);
      return {
        ...grouped,
        [type]: [
          ...(grouped[type] || []),
          config
        ]
      };
    }, {});
  }

  private getGroupType(config: PermissionConfig) {
    if (config.type === PermissionTypes.ORGANIZATION || config.type === PermissionTypes.SPACE) {
      return CHECKER_GROUPS.CF_GROUP;
    }
    return config.type;
  }

  private checkAllOfType(endpointGuid: string, type: PermissionTypes, permission: PermissionStrings, orgGuid?: string) {
    return this.getEndpointState(endpointGuid).pipe(
      map(state => {
        if (!state || !state[type]) {
          return false;
        }
        return Object.keys(state[type]).some(guid => {
          return this.selectPermission(state[type][guid], permission);
        });
      })
    );
  }

  private getAllEndpointGuids() {
    return this.store.select(connectedEndpointsSelector).pipe(
      map(endpoints => Object.values(endpoints).filter(e => e.cnsi_type === 'cf').map(endpoint => endpoint.guid))
    );
  }

  private getEndpointGuidObservable(endpointGuid: string) {
    return !endpointGuid ? this.getAllEndpointGuids() : observableOf([endpointGuid]);
  }

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: PermissionStrings): boolean {
    return state ? state[permission] || false : false;
  }

  private getEndpointState(endpointGuid: string) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid));
  }
}
