import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import {
  BaseCurrentUserPermissionsChecker,
  CUSTOM_USER_PERMISSION_CHECKERS,
  CurrentUserPermissionsService,
  IConfigGroup,
  IConfigGroups,
  ICurrentUserPermissionsChecker,
  IPermissionCheckCombiner,
  IPermissionConfigs,
  PermissionConfig,
  PermissionConfigLink,
  PermissionTypes,
} from '@stratosui/core';
import { GeneralEntityAppState, PermissionValues, connectedEndpointsSelector } from '@stratosui/store';
import { CFFeatureFlagTypes, IFeatureFlag } from '../cf-api.types';
import { cfEntityCatalog } from '../cf-entity-catalog';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import {
  getCurrentUserCFEndpointHasScope,
  getCurrentUserCFEndpointRolesState,
  getCurrentUserCFGlobalState,
} from '../store/selectors/cf-current-user-role.selectors';
import { IOrgRoleState, ISpaceRoleState, ISpacesRoleState } from '../store/types/cf-current-user-roles.types';
import {
  CfCurrentUserPermissions,
  CfPermissionStrings,
  CfPermissionTypes,
  CfScopeStrings,
} from './cf-user-permissions.types';

// Re-export permission types for backward compatibility
export { CfCurrentUserPermissions, CfPermissionStrings, CfPermissionTypes, CfScopeStrings } from './cf-user-permissions.types';

enum CHECKER_GROUPS {
  CF_GROUP = '__CF_TYPE__'
}

// For each set permissions are checked by permission types of ENDPOINT, ENDPOINT_SCOPE, STRATOS_SCOPE, FEATURE_FLAG or a random bag.
// Every group result must be true in order for the permission to be true. A group result is true if all or some of it's permissions are
// true (see `getCheckFromConfig`).
export const cfPermissionConfigs: IPermissionConfigs = {
  [CfCurrentUserPermissions.APPLICATION_VIEW]: [
    // See #2186
    new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_READ_ONLY_ADMIN_GROUP),
    new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP),
    new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_MANAGER),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_AUDITOR),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER)
  ],
  [CfCurrentUserPermissions.APPLICATION_CREATE]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.APPLICATION_MANAGE]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.APPLICATION_EDIT]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.APPLICATION_VIEW_ENV_VARS]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.SPACE_VIEW]: [
    // See #2186
    new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_READ_ONLY_ADMIN_GROUP),
    new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP),
    new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_MANAGER),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_AUDITOR),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER)
  ],
  [CfCurrentUserPermissions.SPACE_CREATE]: new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
  [CfCurrentUserPermissions.SPACE_DELETE]: new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
  [CfCurrentUserPermissions.SPACE_EDIT]: [
    new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_MANAGER),
  ],
  [CfCurrentUserPermissions.SPACE_CHANGE_ROLES]: [
    new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_MANAGER)
  ],
  // TODO: See #4189. Wire in. Can be org manager?
  [CfCurrentUserPermissions.ROUTE_CREATE]: [
    new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.route_creation),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER)
  ],
  [CfCurrentUserPermissions.QUOTA_CREATE]: new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
  [CfCurrentUserPermissions.QUOTA_EDIT]: new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
  [CfCurrentUserPermissions.QUOTA_DELETE]: new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
  [CfCurrentUserPermissions.SPACE_QUOTA_CREATE]: new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
  [CfCurrentUserPermissions.SPACE_QUOTA_EDIT]: new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
  [CfCurrentUserPermissions.SPACE_QUOTA_DELETE]: new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
  [CfCurrentUserPermissions.ORGANIZATION_CREATE]: [
    // is admin (checked for everything) or FF is on and user has a role
    new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.user_org_creation),
    new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
    new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_AUDITOR),
    new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_BILLING_MANAGER),
    new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_USER),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_MANAGER),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_AUDITOR),
    new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER)
  ],
  [CfCurrentUserPermissions.ORGANIZATION_DELETE]: new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
  [CfCurrentUserPermissions.ORGANIZATION_EDIT]: new PermissionConfigLink(CfCurrentUserPermissions.ORGANIZATION_DELETE),
  [CfCurrentUserPermissions.ORGANIZATION_SUSPEND]: new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
  [CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES]: new PermissionConfig(
    CfPermissionTypes.ORGANIZATION,
    CfPermissionStrings.ORG_MANAGER
  ),
  [CfCurrentUserPermissions.SERVICE_INSTANCE_DELETE]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.SERVICE_INSTANCE_EDIT]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.SERVICE_BINDING_EDIT]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.FIREHOSE_VIEW]: [
    new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_READ_ONLY_ADMIN_GROUP)
  ],
};

@Injectable()
export class CfUserPermissionsChecker extends BaseCurrentUserPermissionsChecker implements ICurrentUserPermissionsChecker {
  private store = inject<Store<GeneralEntityAppState>>(Store);

  static readonly ALL_SPACES = 'PERMISSIONS__ALL_SPACES_PLEASE';

  getPermissionConfig(action: string) {
    return cfPermissionConfigs[action];
  }

  private check(
    type: PermissionTypes,
    permission: PermissionValues,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    allSpacesWithinOrg = false
  ): Observable<boolean> {
    // In some situations the observable returned here is not subscribed to (for example due to applyAdminCheck).
    // This is bad (we should skip this function entirely) and should be fixed. This would require a thorough appraisal and overhaul.
    if (type === CfPermissionTypes.ENDPOINT_SCOPE) {
      if (!endpointGuid) {
        return of(false);
      }
      return this.store.select(getCurrentUserCFEndpointHasScope(endpointGuid, permission as CfScopeStrings));
    }

    if (type === CfPermissionTypes.ENDPOINT) {
      return this.store.select(getCurrentUserCFGlobalState(endpointGuid, permission));
    }
    return this.getCfEndpointState(endpointGuid).pipe(
      filter(state => !!state),
      map(state => {
        const permissionString = permission as CfPermissionStrings;
        if (allSpacesWithinOrg) {
          const spaceState = (state as any)[CfPermissionTypes.SPACE];
          return this.checkAllSpacesInOrg((state as any)[CfPermissionTypes.ORGANIZATION][orgOrSpaceGuid as string], spaceState, permissionString);
        }
        return this.selectPermission((state as any)[type][orgOrSpaceGuid as string], permissionString);
      }),
      distinctUntilChanged(),
    );
  }

  /**
   * @param permissionConfig Single permission to be checked
   */
  public getSimpleCheck(permissionConfig: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    const check$ = this.getBaseSimpleCheck(permissionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    if (permissionConfig.type === CfPermissionTypes.ORGANIZATION || permissionConfig.type === CfPermissionTypes.SPACE) {
      return this.applyAdminCheck(check$, endpointGuid);
    }
    return check$;
  }

  private getBaseSimpleCheck(permissionConfig: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string) {
    switch (permissionConfig.type) {
      case (CfPermissionTypes.FEATURE_FLAG):
        return this.getFeatureFlagCheck(permissionConfig, endpointGuid);
      case (CfPermissionTypes.ORGANIZATION):
      case (CfPermissionTypes.SPACE):
      case (CfPermissionTypes.ENDPOINT):
        return this.getCfCheck(permissionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
      case (CfPermissionTypes.ENDPOINT_SCOPE):
        return this.getEndpointScopesCheck(permissionConfig.permission as CfScopeStrings, endpointGuid);
    }
  }

  private getEndpointScopesCheck(permission: CfScopeStrings, endpointGuid?: string): Observable<boolean> {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      switchMap(guids => combineLatest(guids.map(_guid => this.check(CfPermissionTypes.ENDPOINT_SCOPE, permission, endpointGuid)))),
      map(checks => checks.some(check => check)),
      distinctUntilChanged()
    );
  }

  private getEndpointScopesChecks(
    configs: PermissionConfig[],
    endpoint?: string
  ): Observable<boolean>[] {
    return configs.map(config => {
      const { permission } = config;
      return this.getEndpointScopesCheck(permission as CfScopeStrings, endpoint);
    });
  }

  private getCfChecks(
    configs: PermissionConfig[],
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): Observable<boolean>[] {
    return configs.map(config => this.getCfCheck(config, endpointGuid, orgOrSpaceGuid, spaceGuid));
  }

  private getCfCheck(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string): Observable<boolean> {
    const { type, permission } = config;
    const checkAllSpaces = spaceGuid === CfUserPermissionsChecker.ALL_SPACES;
    const actualGuid = type === CfPermissionTypes.SPACE && spaceGuid && !checkAllSpaces ? spaceGuid : orgOrSpaceGuid;
    const cfPermissions = permission as CfPermissionStrings;
    if (type === CfPermissionTypes.ENDPOINT || (endpointGuid && actualGuid)) {
      return this.check(type, cfPermissions, endpointGuid, actualGuid, checkAllSpaces);
    } else if (!actualGuid) {
      const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
      return endpointGuids$.pipe(
        switchMap(guids => combineLatest(guids.map(guid => this.checkAllOfType(guid, type as CfPermissionTypes, cfPermissions)))),
        map(checks => checks.some(check => check)),
        distinctUntilChanged()
      );
    }
    return of(false);
  }

  private getFeatureFlagChecks(configs: PermissionConfig[], endpointGuid?: string): Observable<boolean>[] {
    return configs.map(config => {
      return this.getFeatureFlagCheck(config, endpointGuid);
    });
  }

  private getFeatureFlagCheck(config: PermissionConfig, endpointGuid?: string): Observable<boolean> {
    const permission = config.permission as CFFeatureFlagTypes;
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      switchMap(guids => {
        const createFFObs = (guid: string) =>
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

  private checkFeatureFlag(featureFlags: IFeatureFlag[], permission: CFFeatureFlagTypes) {
    const flag = featureFlags.find(ff => ff.name === permission.toString());
    if (!flag) {
      return false;
    }
    return flag.enabled;
  }

  private getAdminChecks(endpointGuid?: string): Observable<boolean> {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getCfAdminCheck(guid))),
      switchMap(checks => BaseCurrentUserPermissionsChecker.reduceChecks(checks)),
    );
  }

  /**
   * Includes read only admins, global auditors and users that don't have the cloud_controller.write scope
   */
  private getReadOnlyCheck(endpointGuid: string): Observable<boolean> {
    return this.getCfEndpointState(endpointGuid).pipe(
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

  private applyAdminCheck(check$: Observable<boolean>, endpointGuid?: string): Observable<boolean> {
    const adminCheck$ = this.getAdminChecks(endpointGuid);
    const readOnlyCheck$ = this.getReadOnlyChecks(endpointGuid);
    return combineLatest(
      adminCheck$,
      readOnlyCheck$
    ).pipe(
      distinctUntilChanged(),
      switchMap(([isAdmin, isReadOnly]) => {
        if (isAdmin) {
          return of(true);
        }
        if (isReadOnly) {
          // This is bad, we should not assume that the check type wants a negative result if the user only has 'read only' rights.
          return of(false);
        }
        return check$;
      })
    );
  }

  /**
   * If no endpoint is passed, check them all
   */
  private getReadOnlyChecks(endpointGuid?: string): Observable<boolean> {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getReadOnlyCheck(guid))),
      switchMap(checks => BaseCurrentUserPermissionsChecker.reduceChecks(checks, '&&'))
    );
  }

  private getCfAdminCheck(endpointGuid: string): Observable<boolean> {
    return this.getCfEndpointState(endpointGuid).pipe(
      filter(cfPermissions => !!cfPermissions),
      map(cfPermissions => cfPermissions.global.isAdmin)
    );
  }

  private checkAllOfType(endpointGuid: string, type: CfPermissionTypes, permission: CfPermissionStrings, _orgGuid?: string): Observable<boolean> {
    return this.getCfEndpointState(endpointGuid).pipe(
      map(state => {
        if (!state || !(state as any)[type]) {
          return false;
        }
        return Object.keys((state as any)[type]).some((guid: string) => {
          return this.selectPermission((state as any)[type][guid], permission);
        });
      })
    );
  }

  private getAllEndpointGuids(): Observable<string[]> {
    return this.store.select(connectedEndpointsSelector()).pipe(
      map(endpoints => Object.values(endpoints).filter(e => e.cnsi_type === CF_ENDPOINT_TYPE).map(endpoint => endpoint.guid))
    );
  }

  private getEndpointGuidObservable(endpointGuid: string | undefined): Observable<string[]> {
    return !endpointGuid ? this.getAllEndpointGuids() : of([endpointGuid]);
  }

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: CfPermissionStrings): boolean {
    return state ? (state as any)[permission] || false : false;
  }

  private checkAllSpacesInOrg(orgState: IOrgRoleState, endpointSpaces: ISpacesRoleState, permission: CfPermissionStrings): boolean {
    const spaceGuids = !!orgState && orgState.spaceGuids ? orgState.spaceGuids : [];
    return spaceGuids.map(spaceGuid => {
      const space = endpointSpaces[spaceGuid];
      return space ? (space as any)[permission] || false : false;
    }).some(check => check);

  }

  private getCfEndpointState(endpointGuid: string): Observable<any> {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid));
  }

  public getComplexCheck(
    permissionConfigs: PermissionConfig[],
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): IPermissionCheckCombiner[] {
    const groupedChecks = this.groupConfigs(permissionConfigs);
    return Object.keys(groupedChecks).map((permission: PermissionTypes) => {
      const configGroup = groupedChecks[permission];
      const checkCombiner = this.getBaseCheckFromConfig(configGroup, permission, endpointGuid, orgOrSpaceGuid, spaceGuid);
      if (checkCombiner) {
        checkCombiner.checks = checkCombiner.checks.map(check$ => this.applyAdminCheck(check$, endpointGuid));
      }
      return checkCombiner;
    });
  }


  private groupConfigs(configs: PermissionConfig[]): IConfigGroups {
    return configs.reduce((grouped: IConfigGroups, config: PermissionConfig) => {
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

  private getGroupType(config: PermissionConfig): string {
    if (config.type === CfPermissionTypes.ORGANIZATION || config.type === CfPermissionTypes.SPACE) {
      return CHECKER_GROUPS.CF_GROUP;
    }
    return config.type;
  }


  private getBaseCheckFromConfig(
    configGroup: IConfigGroup,
    permission: CfPermissionTypes | CHECKER_GROUPS | string,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): IPermissionCheckCombiner {
    switch (permission) {
      case CfPermissionTypes.ENDPOINT_SCOPE:
        return {
          checks: this.getEndpointScopesChecks(configGroup, endpointGuid),
        };
      case CfPermissionTypes.FEATURE_FLAG:
        return {
          checks: this.getFeatureFlagChecks(configGroup, endpointGuid),
          combineType: '&&'
        };
      case CHECKER_GROUPS.CF_GROUP:
        return {
          checks: this.getCfChecks(configGroup, endpointGuid, orgOrSpaceGuid, spaceGuid)
        };
    }
  }

  public getFallbackCheck(endpointGuid: string, endpointType: string): Observable<boolean> | null {
    return endpointType === CF_ENDPOINT_TYPE ? this.getCfAdminCheck(endpointGuid) : null;
  }

}

export const cfCurrentUserPermissionsService = [
  CfUserPermissionsChecker,
  {
    provide: CUSTOM_USER_PERMISSION_CHECKERS,
    useFactory: (checker: CfUserPermissionsChecker) => [checker],
    deps: [CfUserPermissionsChecker]
  },
  CurrentUserPermissionsService,
];
