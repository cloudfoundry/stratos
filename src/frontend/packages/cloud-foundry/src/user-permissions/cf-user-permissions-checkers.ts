import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, Signal, signal, untracked } from '@angular/core';
import {
  BaseCurrentUserPermissionsChecker,
  CUSTOM_USER_PERMISSION_CHECKERS,
  CurrentUserPermissionsService,
  IConfigGroup,
  IConfigGroups,
  ICurrentUserPermissionsChecker,
  IPermissionCheckCombiner,
  IPermissionConfigs,
  PERMISSION_DENIED,
  PermissionConfig,
  PermissionConfigLink,
  PermissionTypes,
} from '@stratosui/core';
import { EndpointsDataService, PermissionValues } from '@stratosui/store';
import { CFFeatureFlagTypes } from '../cf-api.types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { CfCurrentUserRolesDataService } from '../services/cf-current-user-roles-data.service';
import { StFeatureFlag } from '../services/endpoint-data/stratos-types';
import { getFeatureFlagsSource } from './feature-flags-cache';
import { ICfRolesState, IOrgRoleState, ISpaceRoleState, ISpacesRoleState } from '../store/types/cf-current-user-roles.types';
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
  private roles = inject(CfCurrentUserRolesDataService);
  private endpointsService = inject(EndpointsDataService);
  private http = inject(HttpClient);

  static readonly ALL_SPACES = 'PERMISSIONS__ALL_SPACES_PLEASE';

  /** GUIDs of every connected CF endpoint. */
  private readonly connectedCfGuids: Signal<string[]> = computed(() =>
    Array.from(this.endpointsService.endpoints().values())
      .filter((e): e is typeof e & { guid: string } =>
        e.cnsi_type === CF_ENDPOINT_TYPE && e.connectionStatus === 'connected' && !!e.guid)
      .map(endpoint => endpoint.guid)
  );

  getPermissionConfig(action: string) {
    return cfPermissionConfigs[action];
  }

  /** Role state of one endpoint; `null` until the roles request lands. Reads a signal. */
  private stateOf(endpointGuid: string): ICfRolesState | null {
    return this.roles.cfRolesState()?.[endpointGuid] ?? null;
  }

  /** Reads the role state; call inside a computed. */
  private checkNow(
    type: PermissionTypes,
    permission: PermissionValues,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    allSpacesWithinOrg = false
  ): boolean {
    if (!endpointGuid) {
      return false;
    }
    const state = this.stateOf(endpointGuid);
    if (!state) {
      return false;
    }
    if (type === CfPermissionTypes.ENDPOINT_SCOPE) {
      return !!state.global?.scopes?.includes(permission as string);
    }
    if (type === CfPermissionTypes.ENDPOINT) {
      return !!(state.global as Record<string, any> | undefined)?.[permission];
    }
    const permissionString = permission as CfPermissionStrings;
    if (allSpacesWithinOrg) {
      return this.checkAllSpacesInOrg(state.organizations?.[orgOrSpaceGuid as string], state.spaces, permissionString);
    }
    return this.selectPermission((state as any)[type]?.[orgOrSpaceGuid as string], permissionString);
  }

  /**
   * @param permissionConfig Single permission to be checked
   */
  public getSimpleCheck(
    permissionConfig: PermissionConfig,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): Signal<boolean> | undefined {
    const check = this.getBaseSimpleCheck(permissionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
    if (!check) {
      return undefined;
    }
    if (permissionConfig.type === CfPermissionTypes.ORGANIZATION || permissionConfig.type === CfPermissionTypes.SPACE) {
      return this.applyAdminCheck(check, endpointGuid);
    }
    return check;
  }

  private getBaseSimpleCheck(
    permissionConfig: PermissionConfig,
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): Signal<boolean> | undefined {
    switch (permissionConfig.type) {
      case (CfPermissionTypes.FEATURE_FLAG):
        return this.getFeatureFlagCheck(permissionConfig, endpointGuid);
      case (CfPermissionTypes.ORGANIZATION):
      case (CfPermissionTypes.SPACE):
      case (CfPermissionTypes.ENDPOINT):
        return this.getCfCheck(permissionConfig, endpointGuid, orgOrSpaceGuid, spaceGuid);
      case (CfPermissionTypes.ENDPOINT_SCOPE):
        return this.getEndpointScopesCheck(permissionConfig.permission as CfScopeStrings, endpointGuid);
      default:
        // Not a CF permission type: returning undefined tells
        // CurrentUserPermissionsService this checker does not own the config.
        // Returning a denial here instead makes findChecker() count two
        // claimants for every stratos-level check and deny it app-wide (#5570,
        // #5571).
        return undefined;
    }
  }

  private getEndpointScopesCheck(permission: CfScopeStrings, endpointGuid?: string): Signal<boolean> {
    const guids = this.getEndpointGuids(endpointGuid);
    return computed(() => guids().some(guid => this.checkNow(CfPermissionTypes.ENDPOINT_SCOPE, permission, guid)));
  }

  private getCfCheck(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string): Signal<boolean> {
    const { type, permission } = config;
    const checkAllSpaces = spaceGuid === CfUserPermissionsChecker.ALL_SPACES;
    const actualGuid = type === CfPermissionTypes.SPACE && spaceGuid && !checkAllSpaces ? spaceGuid : orgOrSpaceGuid;
    const cfPermissions = permission as CfPermissionStrings;
    if (type === CfPermissionTypes.ENDPOINT || (endpointGuid && actualGuid)) {
      return computed(() => this.checkNow(type, cfPermissions, endpointGuid, actualGuid, checkAllSpaces));
    } else if (!actualGuid) {
      const guids = this.getEndpointGuids(endpointGuid);
      return computed(() => guids().some(guid => this.checkAllOfType(guid, type as CfPermissionTypes, cfPermissions)));
    }
    return PERMISSION_DENIED;
  }

  private getFeatureFlagCheck(config: PermissionConfig, endpointGuid?: string): Signal<boolean> {
    const permission = config.permission as CFFeatureFlagTypes;
    const guids = this.getEndpointGuids(endpointGuid);
    this.loadFeatureFlags(endpointGuid);
    // The items signal starts empty and fills when load() lands, so the check
    // reads false until the flags are known.
    return computed(() => guids().some(guid =>
      this.checkFeatureFlag(getFeatureFlagsSource(guid, this.http).items(), permission)
    ));
  }

  /**
   * Starts the (idempotent, shared) feature flag load for the endpoints a
   * check reads. For admins the role-fetch barrier does not prime feature
   * flags, so the check has to.
   *
   * NOTE: runs once, when the check is built, outside any reactive context
   * (a load writes signals). With no endpoint guid it loads the endpoints
   * connected at that moment; an endpoint connected later is loaded by the
   * next check built, or by the roles fetch for non-admins.
   */
  private loadFeatureFlags(endpointGuid?: string) {
    const guids = endpointGuid ?
      Promise.resolve([endpointGuid]) :
      this.endpointsService.whenReady().then(() => untracked(this.connectedCfGuids));
    void guids.then(list => list.forEach(guid => void getFeatureFlagsSource(guid, this.http).load()));
  }

  private checkFeatureFlag(featureFlags: StFeatureFlag[], permission: CFFeatureFlagTypes) {
    const flag = featureFlags.find(ff => ff.name === permission.toString());
    if (!flag) {
      return false;
    }
    return flag.enabled;
  }

  /**
   * Includes read only admins, global auditors and users that don't have the cloud_controller.write scope
   */
  private isReadOnly(endpointGuid: string): boolean {
    const global = this.stateOf(endpointGuid)?.global;
    return !!global && (global.isGlobalAuditor || global.isReadOnlyAdmin || !global.canWrite);
  }

  private isAdmin(endpointGuid: string): boolean {
    return !!this.stateOf(endpointGuid)?.global?.isAdmin;
  }

  /**
   * Admin on any of the endpoints → allowed. Read only on all of them
   * (true for none) → denied. Otherwise the check decides.
   */
  private applyAdminCheck(check: Signal<boolean>, endpointGuid?: string): Signal<boolean> {
    const guids = this.getEndpointGuids(endpointGuid);
    return computed(() => {
      const list = guids();
      if (list.some(guid => this.isAdmin(guid))) {
        return true;
      }
      if (list.every(guid => this.isReadOnly(guid))) {
        // This is bad, we should not assume that the check type wants a negative result if the user only has 'read only' rights.
        return false;
      }
      return check();
    });
  }

  private checkAllOfType(endpointGuid: string, type: CfPermissionTypes, permission: CfPermissionStrings): boolean {
    const state = this.stateOf(endpointGuid);
    const ofType = state ? (state as any)[type] : null;
    if (!ofType) {
      return false;
    }
    return Object.keys(ofType).some((guid: string) => this.selectPermission(ofType[guid], permission));
  }

  /** The endpoint asked for, or (none given) every connected CF endpoint. */
  private getEndpointGuids(endpointGuid: string | undefined): Signal<string[]> {
    if (endpointGuid) {
      return signal([endpointGuid]).asReadonly();
    }
    // First read before the endpoint list loads: start loading it.
    untracked(() => {
      if (!this.endpointsService.hydrated()) {
        void this.endpointsService.whenReady();
      }
    });
    return this.connectedCfGuids;
  }

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: CfPermissionStrings): boolean {
    return state ? (state as any)[permission] || false : false;
  }

  private checkAllSpacesInOrg(orgState: IOrgRoleState | undefined, endpointSpaces: ISpacesRoleState, permission: CfPermissionStrings): boolean {
    const spaceGuids = !!orgState && orgState.spaceGuids ? orgState.spaceGuids : [];
    return spaceGuids.map(spaceGuid => {
      const space = endpointSpaces?.[spaceGuid];
      return space ? (space as any)[permission] || false : false;
    }).some(check => check);

  }

  public getComplexCheck(
    permissionConfigs: PermissionConfig[],
    endpointGuid?: string,
    orgOrSpaceGuid?: string,
    spaceGuid?: string
  ): IPermissionCheckCombiner[] | null {
    const groupedChecks = this.groupConfigs(permissionConfigs);
    const combiners = Object.keys(groupedChecks)
      .map((permission: PermissionTypes) => {
        const configGroup = groupedChecks[permission];
        const checkCombiner = this.getBaseCheckFromConfig(configGroup, permission, endpointGuid, orgOrSpaceGuid, spaceGuid);
        if (checkCombiner) {
          checkCombiner.checks = checkCombiner.checks.map(check => this.applyAdminCheck(check, endpointGuid));
        }
        return checkCombiner;
      })
      .filter((checkCombiner): checkCombiner is IPermissionCheckCombiner => !!checkCombiner);
    // No group handled → this checker does not own the config; an empty array
    // is truthy and would double-claim the check in findChecker() (see
    // getBaseSimpleCheck's default case).
    return combiners.length ? combiners : null;
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
  ): IPermissionCheckCombiner | undefined {
    switch (permission) {
      case CfPermissionTypes.ENDPOINT_SCOPE:
        return {
          checks: configGroup.map(config => this.getEndpointScopesCheck(config.permission as CfScopeStrings, endpointGuid)),
        };
      case CfPermissionTypes.FEATURE_FLAG:
        return {
          checks: configGroup.map(config => this.getFeatureFlagCheck(config, endpointGuid)),
          combineType: '&&'
        };
      case CHECKER_GROUPS.CF_GROUP:
        return {
          checks: configGroup.map(config => this.getCfCheck(config, endpointGuid, orgOrSpaceGuid, spaceGuid))
        };
    }
  }

  public getFallbackCheck(endpointGuid: string, endpointType: string): Signal<boolean> | null {
    return endpointType === CF_ENDPOINT_TYPE ? computed(() => this.isAdmin(endpointGuid)) : null;
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
