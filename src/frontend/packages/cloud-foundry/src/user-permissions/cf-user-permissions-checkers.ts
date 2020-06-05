import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';

import {
  IPermissionConfigs,
  PermissionConfig,
  PermissionConfigLink,
  PermissionTypes,
  PermissionValues,
} from '../../../core/src/core/permissions/current-user-permissions.config';
import {
  CurrentUserPermissionsService,
  CUSTOM_USER_PERMISSION_CHECKERS,
} from '../../../core/src/core/permissions/current-user-permissions.service';
import {
  BaseCurrentUserPermissionsChecker,
  IConfigGroup,
  IConfigGroups,
  ICurrentUserPermissionsChecker,
  IPermissionCheckCombiner,
} from '../../../core/src/core/permissions/current-user-permissions.types';
import { GeneralEntityAppState } from '../../../store/src/app-state';
import { connectedEndpointsSelector } from '../../../store/src/selectors/endpoint.selectors';
import { CFFeatureFlagTypes, IFeatureFlag } from '../cf-api.types';
import { cfEntityCatalog } from '../cf-entity-catalog';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import {
  getCurrentUserCFEndpointHasScope,
  getCurrentUserCFEndpointRolesState,
  getCurrentUserCFGlobalState,
} from '../store/selectors/cf-current-user-role.selectors';
import { IOrgRoleState, ISpaceRoleState, ISpacesRoleState } from '../store/types/cf-current-user-roles.types';

export const cfCurrentUserPermissionsService = [
  {
    provide: CUSTOM_USER_PERMISSION_CHECKERS,
    useFactory: (store: Store<GeneralEntityAppState>) => [new CfUserPermissionsChecker(store)],
    deps: [Store]
  },
  CurrentUserPermissionsService,
]

export enum CfCurrentUserPermissions {
  APPLICATION_VIEW = 'view.application',
  APPLICATION_EDIT = 'edit.application',
  APPLICATION_CREATE = 'create.application',
  APPLICATION_MANAGE = 'manage.application',
  APPLICATION_VIEW_ENV_VARS = 'env-vars.view.application',
  SPACE_VIEW = 'view.space',
  SPACE_CREATE = 'create.space',
  SPACE_DELETE = 'delete.space',
  SPACE_EDIT = 'edit.space',
  SPACE_CHANGE_ROLES = 'change-roles.space',
  ROUTE_CREATE = 'create.route',
  // ROUTE_BINDING_CREATE = 'create.binding.route',
  QUOTA_CREATE = 'create.quota',
  QUOTA_EDIT = 'edit.quota',
  QUOTA_DELETE = 'delete.quota',
  SPACE_QUOTA_CREATE = 'create.space-quota',
  SPACE_QUOTA_EDIT = 'edit.space-quota',
  SPACE_QUOTA_DELETE = 'delete.space-quota',
  ORGANIZATION_CREATE = 'create.org',
  ORGANIZATION_DELETE = 'delete.org',
  ORGANIZATION_EDIT = 'edit.org',
  ORGANIZATION_SUSPEND = 'suspend.org',
  ORGANIZATION_CHANGE_ROLES = 'change-roles.org',
  SERVICE_INSTANCE_DELETE = 'delete.service-instance',
  SERVICE_INSTANCE_CREATE = 'create.service-instance',
  SERVICE_BINDING_EDIT = 'edit.service-binding',
  FIREHOSE_VIEW = 'view-firehose',
  SERVICE_INSTANCE_EDIT = 'edit.service-instance'
}

export enum CfPermissionStrings {
  _GLOBAL_ = 'global',
  SPACE_MANAGER = 'isManager',
  SPACE_AUDITOR = 'isAuditor',
  SPACE_DEVELOPER = 'isDeveloper',
  ORG_MANAGER = 'isManager',
  ORG_AUDITOR = 'isAuditor',
  ORG_BILLING_MANAGER = 'isBillingManager',
  ORG_USER = 'isUser',
}

export enum CfScopeStrings {
  CF_ADMIN_GROUP = 'cloud_controller.admin',
  CF_READ_ONLY_ADMIN_GROUP = 'cloud_controller.admin_read_only',
  CF_ADMIN_GLOBAL_AUDITOR_GROUP = 'cloud_controller.global_auditor',
  CF_WRITE_SCOPE = 'cloud_controller.write',
  CF_READ_SCOPE = 'cloud_controller.write',
}

export enum CfPermissionTypes {
  SPACE = 'spaces',
  ORGANIZATION = 'organizations',
  ENDPOINT = 'endpoint',
  ENDPOINT_SCOPE = 'endpoint-scope',
  FEATURE_FLAG = 'feature-flag',
}

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
  [CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES]: new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
  [CfCurrentUserPermissions.SERVICE_INSTANCE_DELETE]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.SERVICE_INSTANCE_EDIT]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.SERVICE_BINDING_EDIT]: new PermissionConfig(CfPermissionTypes.SPACE, CfPermissionStrings.SPACE_DEVELOPER),
  [CfCurrentUserPermissions.FIREHOSE_VIEW]: [
    new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_READ_ONLY_ADMIN_GROUP)
  ],
};

export class CfUserPermissionsChecker extends BaseCurrentUserPermissionsChecker implements ICurrentUserPermissionsChecker {
  static readonly ALL_SPACES = 'PERMISSIONS__ALL_SPACES_PLEASE';

  constructor(private store: Store<GeneralEntityAppState>) {
    super();
  }

  getPermissionConfig(action: string) {
    return cfPermissionConfigs[action];
  }

  private check(
    type: PermissionTypes,
    permission: PermissionValues,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    allSpacesWithinOrg = false
  ) {
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
          const spaceState = state[CfPermissionTypes.SPACE];
          return this.checkAllSpacesInOrg(state[CfPermissionTypes.ORGANIZATION][orgOrSpaceGuid], spaceState, permissionString);
        }
        return this.selectPermission(state[type][orgOrSpaceGuid], permissionString);
      }),
      distinctUntilChanged(),
    );
  };

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

  private getEndpointScopesCheck(permission: CfScopeStrings, endpointGuid?: string) {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      switchMap(guids => combineLatest(guids.map(guid => this.check(CfPermissionTypes.ENDPOINT_SCOPE, permission, endpointGuid)))),
      map(checks => checks.some(check => check)),
      distinctUntilChanged()
    );
  }

  private getEndpointScopesChecks(
    configs: PermissionConfig[],
    endpoint?: string
  ) {
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

  private checkFeatureFlag(featureFlags: IFeatureFlag[], permission: CFFeatureFlagTypes) {
    const flag = featureFlags.find(ff => ff.name === permission.toString());
    if (!flag) {
      return false;
    }
    return flag.enabled;
  }

  private getAdminChecks(endpointGuid?: string) {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getCfAdminCheck(guid))),
      switchMap(checks => BaseCurrentUserPermissionsChecker.reduceChecks(checks)),
    );
  }

  /**
 * Includes read only admins, global auditors and users that don't have the cloud_controller.write scope
 */
  private getReadOnlyCheck(endpointGuid: string) {
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
          return of(false);
        }
        return check$;
      })
    );
  }

  /**
 * If no endpoint is passed, check them all
 */
  private getReadOnlyChecks(endpointGuid?: string) {
    const endpointGuids$ = this.getEndpointGuidObservable(endpointGuid);
    return endpointGuids$.pipe(
      map(guids => guids.map(guid => this.getReadOnlyCheck(guid))),
      switchMap(checks => BaseCurrentUserPermissionsChecker.reduceChecks(checks, '&&'))
    );
  }

  private getCfAdminCheck(endpointGuid: string) {
    return this.getCfEndpointState(endpointGuid).pipe(
      filter(cfPermissions => !!cfPermissions),
      map(cfPermissions => cfPermissions.global.isAdmin)
    );
  }

  private checkAllOfType(endpointGuid: string, type: CfPermissionTypes, permission: CfPermissionStrings, orgGuid?: string) {
    return this.getCfEndpointState(endpointGuid).pipe(
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
      map(endpoints => Object.values(endpoints).filter(e => e.cnsi_type === CF_ENDPOINT_TYPE).map(endpoint => endpoint.guid))
    );
  }

  private getEndpointGuidObservable(endpointGuid: string) {
    return !endpointGuid ? this.getAllEndpointGuids() : of([endpointGuid]);
  }

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: CfPermissionStrings): boolean {
    return state ? state[permission] || false : false;
  }

  private checkAllSpacesInOrg(orgState: IOrgRoleState, endpointSpaces: ISpacesRoleState, permission: CfPermissionStrings) {
    const spaceGuids = !!orgState && orgState.spaceGuids ? orgState.spaceGuids : [];
    return spaceGuids.map(spaceGuid => {
      const space = endpointSpaces[spaceGuid];
      return space ? space[permission] || false : false;
    }).some(check => check);

  }

  private getCfEndpointState(endpointGuid: string) {
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
      const checkCombiner = this.getBaseCheckFromConfig(configGroup, permission, endpointGuid, orgOrSpaceGuid, spaceGuid)
      if (checkCombiner) {
        checkCombiner.checks = checkCombiner.checks.map(check$ => this.applyAdminCheck(check$, endpointGuid))
      }
      return checkCombiner;
    });
  }


  private groupConfigs(configs: PermissionConfig[]): IConfigGroups {
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

  public getFallbackCheck(endpointGuid: string, endpointType: string) {
    return endpointType === CF_ENDPOINT_TYPE ? this.getCfAdminCheck(endpointGuid) : null;
  };

}