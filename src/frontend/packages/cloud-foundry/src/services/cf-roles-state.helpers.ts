import { APIResource } from '../../../store/src/types/api.types';
import {
  RolesRequestState,
  getDefaultRolesRequestState,
} from '../../../store/src/types/current-user-roles.types';
import { CfUserRelationTypes } from '../actions/permissions.actions';
import { ISpace } from '../cf-api.types';
import {
  IAllCfRolesState,
  ICfRolesState,
  IGlobalRolesState,
  IOrgRoleState,
  IOrgsRoleState,
  ISpaceRoleState,
  ISpacesRoleState,
} from '../store/types/cf-current-user-roles.types';
import { permissionOfScoped, RoleScope } from '../roles/role-registry';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../store/types/cf-user.types';
import { CfPermissionStrings, CfScopeStrings } from '../user-permissions/cf-user-permissions.types';

/**
 * Pure, ngrx-free CF role-state transforms — the math ported verbatim from the
 * former `current-cf-user-roles-reducer/**` tree (favorites/roles island, Wave
 * 2). The CF role facade (`CfCurrentUserRolesDataService`) applies these via the
 * store package's `CurrentUserRolesDataService.updateEndpointRoles` write-seam,
 * so there is one signal source of truth and no entity-catalog reducer
 * composition. Each function maps a previous CF role state to the next one.
 */

// ---- defaults -------------------------------------------------------------

export const defaultCfUserOrgRoleState: IOrgRoleState = {
  isManager: false,
  isAuditor: false,
  isBillingManager: false,
  isUser: false,
  spaceGuids: [],
};

export const createCfOrgRoleStateState = (): IOrgRoleState => ({
  ...defaultCfUserOrgRoleState,
  spaceGuids: [...defaultCfUserOrgRoleState.spaceGuids],
});

export const defaultCfUserSpaceRoleState: ISpaceRoleState = {
  orgId: null,
  isManager: false,
  isAuditor: false,
  isDeveloper: false,
  isSupporter: false,
};

export function getDefaultCfEndpointRoles(): ICfRolesState {
  return {
    global: {
      isAdmin: false,
      isReadOnlyAdmin: false,
      isGlobalAuditor: false,
      canRead: false,
      canWrite: false,
      scopes: [],
    },
    spaces: {},
    organizations: {},
    state: getDefaultRolesRequestState(),
  };
}

// ---- per-role transforms --------------------------------------------------

function currentCfUserOrgRoleReducer(
  state: IOrgRoleState = createCfOrgRoleStateState(),
  relationType: CfUserRelationTypes,
  userHasRelation: boolean,
): IOrgRoleState {
  switch (relationType) {
    case CfUserRelationTypes.AUDITED_ORGANIZATIONS:
      return { ...state, isAuditor: userHasRelation };
    case CfUserRelationTypes.BILLING_MANAGED_ORGANIZATION:
      return { ...state, isBillingManager: userHasRelation };
    case CfUserRelationTypes.MANAGED_ORGANIZATION:
      return { ...state, isManager: userHasRelation };
    case CfUserRelationTypes.ORGANIZATIONS:
      return { ...state, isUser: userHasRelation };
  }
  return state;
}

function currentCfUserSpaceRoleReducer(
  state: ISpaceRoleState = defaultCfUserSpaceRoleState,
  relationType: CfUserRelationTypes,
  userHasRelation: boolean,
  space?: APIResource<ISpace>,
): ISpaceRoleState {
  const idState = !state.orgId && space
    ? { ...state, orgId: space.entity.organization_guid }
    : state;
  switch (relationType) {
    case CfUserRelationTypes.AUDITED_SPACES:
      return { ...idState, isAuditor: userHasRelation };
    case CfUserRelationTypes.MANAGED_SPACES:
      return { ...idState, isManager: userHasRelation };
    case CfUserRelationTypes.SPACES:
      return { ...idState, isDeveloper: userHasRelation };
    case CfUserRelationTypes.SUPPORTED_SPACES:
      return { ...idState, isSupporter: userHasRelation };
  }
  return idState;
}

// ---- add/remove keyed roles ----------------------------------------------

type RoleFinalReducer<T> = (
  state: T,
  relationType: CfUserRelationTypes,
  userHasRelation: boolean,
  data?: APIResource<any>,
) => T;

function addNewCfRoles<T>(
  state: { [id: string]: T },
  relationType: CfUserRelationTypes,
  data: APIResource<any>[],
  reducer: RoleFinalReducer<T>,
): { newState: { [id: string]: T }, addedIds: string[] } {
  return data.reduce((config, resource) => ({
    newState: {
      ...config.newState,
      [resource.metadata.guid]: reducer(config.newState[resource.metadata.guid], relationType, true, resource),
    },
    addedIds: config.addedIds.concat([resource.metadata.guid]),
  }), { newState: { ...state }, addedIds: [] as string[] });
}

function removeOldCfRoles<T>(
  state: { [id: string]: T },
  relationType: CfUserRelationTypes,
  newIds: string[],
  reducer: RoleFinalReducer<T>,
): { [id: string]: T } {
  return Object.keys(state).reduce((currentState, id) => {
    if (newIds.includes(id)) {
      return currentState;
    }
    return { ...currentState, [id]: reducer(currentState[id], relationType, false) };
  }, { ...state });
}

function currentCfUserOrgRolesReducer(
  state: IOrgsRoleState = {},
  relationType: CfUserRelationTypes,
  data: APIResource<any>[],
): IOrgsRoleState {
  const { newState, addedIds } = addNewCfRoles(state, relationType, data, currentCfUserOrgRoleReducer);
  return removeOldCfRoles(newState, relationType, addedIds, currentCfUserOrgRoleReducer);
}

function currentCfUserSpaceRolesReducer(
  state: ISpacesRoleState = {},
  relationType: CfUserRelationTypes,
  data: APIResource<ISpace>[],
): ISpacesRoleState {
  const { newState, addedIds } = addNewCfRoles(state, relationType, data, currentCfUserSpaceRoleReducer);
  return removeOldCfRoles(newState, relationType, addedIds, currentCfUserSpaceRoleReducer);
}

// ---- relations application (the GET_CURRENT_CF_USER_RELATION_SUCCESS math) -

function isOrgRelation(relationType: CfUserRelationTypes): boolean {
  return relationType === CfUserRelationTypes.AUDITED_ORGANIZATIONS ||
    relationType === CfUserRelationTypes.BILLING_MANAGED_ORGANIZATION ||
    relationType === CfUserRelationTypes.MANAGED_ORGANIZATION ||
    relationType === CfUserRelationTypes.ORGANIZATIONS;
}

function isSpaceRelation(relationType: CfUserRelationTypes): boolean {
  return relationType === CfUserRelationTypes.AUDITED_SPACES ||
    relationType === CfUserRelationTypes.MANAGED_SPACES ||
    relationType === CfUserRelationTypes.SPACES ||
    relationType === CfUserRelationTypes.SUPPORTED_SPACES;
}

function assignSpaceToOrg(organizations: IOrgsRoleState = {}, spaces: APIResource<ISpace>[]): IOrgsRoleState {
  return spaces.reduce((newOrganizations: IOrgsRoleState, space) => {
    const orgGuid = space.entity.organization_guid;
    const org = newOrganizations[orgGuid] || createCfOrgRoleStateState();
    const spaceGuids = org.spaceGuids || [];
    if (spaceGuids.includes(space.metadata.guid)) {
      return newOrganizations;
    }
    return {
      ...newOrganizations,
      [orgGuid]: { ...org, spaceGuids: [...spaceGuids, space.metadata.guid] },
    };
  }, organizations);
}

function applyEndpointRelations(state: ICfRolesState, relationType: CfUserRelationTypes, data: APIResource<any>[]): ICfRolesState {
  if (isOrgRelation(relationType)) {
    return { ...state, organizations: currentCfUserOrgRolesReducer(state.organizations, relationType, data) };
  }
  if (isSpaceRelation(relationType)) {
    return {
      ...state,
      spaces: currentCfUserSpaceRolesReducer(state.spaces, relationType, data as APIResource<ISpace>[]),
      organizations: assignSpaceToOrg(state.organizations, data as APIResource<ISpace>[]),
    };
  }
  return state;
}

/** Apply one relation bucket (org/space) for an endpoint. Was `currentUserBaseCFRolesReducer`. */
export function applyCfUserRelations(
  state: IAllCfRolesState,
  relationType: CfUserRelationTypes,
  endpointGuid: string,
  data: APIResource<any>[],
): IAllCfRolesState {
  const endpointState = state[endpointGuid] || getDefaultCfEndpointRoles();
  return {
    ...state,
    [endpointGuid]: applyEndpointRelations(endpointState, relationType, data),
  };
}

// ---- request state --------------------------------------------------------

export enum CfRolesRequestStage {
  START,
  SUCCESS,
  FAILURE,
}

function applyRequestStage(state: RolesRequestState, stage: CfRolesRequestStage): RolesRequestState {
  switch (stage) {
    case CfRolesRequestStage.START:
      return { ...state, fetching: true };
    case CfRolesRequestStage.SUCCESS:
      return { ...state, initialised: true, fetching: false };
    case CfRolesRequestStage.FAILURE:
      return { ...state, fetching: false, error: true };
  }
}

/** Drive a single endpoint's roles-request state. Was `currentUserCfRolesRequestStateReducer`. */
export function setCfRequestState(state: IAllCfRolesState, endpointGuid: string, stage: CfRolesRequestStage): IAllCfRolesState {
  const endpointState = state[endpointGuid] || getDefaultCfEndpointRoles();
  return {
    ...state,
    [endpointGuid]: { ...endpointState, state: applyRequestStage(endpointState.state, stage) },
  };
}

// ---- endpoint lifecycle ---------------------------------------------------

interface PartialEndpoint {
  user?: { scopes?: string[] } | null;
  guid: string;
}

function deriveGlobalRoles(scopes: string[], globalState: IGlobalRolesState): IGlobalRolesState {
  return (scopes || []).reduce((roles, scope) => {
    if (scope === CfScopeStrings.CF_ADMIN_GROUP) { roles.isAdmin = true; }
    if (scope === CfScopeStrings.CF_READ_ONLY_ADMIN_GROUP) { roles.isReadOnlyAdmin = true; }
    if (scope === CfScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP) { roles.isGlobalAuditor = true; }
    if (scope === CfScopeStrings.CF_READ_SCOPE) { roles.canRead = true; }
    if (scope === CfScopeStrings.CF_WRITE_SCOPE) { roles.canWrite = true; }
    return roles;
  }, { ...globalState, scopes: scopes || [] });
}

function propagateAdmin(state: IAllCfRolesState, endpoints: PartialEndpoint[]): IAllCfRolesState {
  if (!endpoints || !endpoints.length) {
    return state;
  }
  return endpoints.reduce((acc, endpoint) => {
    const endpointState = acc[endpoint.guid] || getDefaultCfEndpointRoles();
    return {
      ...acc,
      [endpoint.guid]: { ...endpointState, global: deriveGlobalRoles(endpoint.user?.scopes ?? [], endpointState.global) },
    };
  }, { ...state });
}

/** Propagate admin scopes from verified-session CF endpoints. Was `cfRoleInfoFromSessionReducer`. */
export function propagateCfSessionAdmin(state: IAllCfRolesState, cfEndpoints: PartialEndpoint[]): IAllCfRolesState {
  return propagateAdmin(state, cfEndpoints || []);
}

/** Propagate admin scopes for a newly-connected CF endpoint. Was `updateNewlyConnectedCfEndpoint`. */
export function propagateCfConnectedAdmin(state: IAllCfRolesState, guid: string, user: PartialEndpoint['user']): IAllCfRolesState {
  return propagateAdmin(state, [{ guid, user }]);
}

/** Seed a default role row for a registered CF endpoint. Was `addCfEndpoint`. Idempotent. */
export function registerCfEndpoint(state: IAllCfRolesState, guid: string): IAllCfRolesState {
  if (state[guid]) {
    return state;
  }
  return { ...state, [guid]: getDefaultCfEndpointRoles() };
}

/** Drop a removed CF endpoint's role row. Was `removeEndpointCfRoles`. */
export function removeCfEndpoint(state: IAllCfRolesState, guid: string): IAllCfRolesState {
  if (!state[guid]) {
    return state;
  }
  const { [guid]: _omit, ...rest } = state;
  return rest;
}

/** Remove a deleted org's role row. Was `removeCfOrgRoles` (org-only; original did not cascade spaces). */
export function removeCfOrg(state: IAllCfRolesState, endpointGuid: string, orgGuid: string): IAllCfRolesState {
  const endpointState = state[endpointGuid];
  if (!endpointState || !endpointState.organizations[orgGuid]) {
    return state;
  }
  const { [orgGuid]: _omit, ...organizations } = endpointState.organizations;
  return { ...state, [endpointGuid]: { ...endpointState, organizations } };
}

/**
 * Remove a deleted space's role row and prune it from its org's `spaceGuids`.
 * Was `removeCfSpaceRoles`; restored correctly — the original removed the space
 * before reading its `orgId`, so it never pruned the org list. We capture the
 * `orgId` first (this path was dead before this wave, so there is no live
 * behavior to preserve, only correct functionality to restore).
 */
export function removeCfSpace(state: IAllCfRolesState, endpointGuid: string, spaceGuid: string): IAllCfRolesState {
  const endpointState = state[endpointGuid];
  if (!endpointState || !endpointState.spaces[spaceGuid]) {
    return state;
  }
  const { orgId } = endpointState.spaces[spaceGuid];
  const { [spaceGuid]: _omit, ...spaces } = endpointState.spaces;
  const org = orgId ? endpointState.organizations[orgId] : undefined;
  const organizations = orgId && org
    ? { ...endpointState.organizations, [orgId]: { ...org, spaceGuids: org.spaceGuids.filter(id => id !== spaceGuid) } }
    : endpointState.organizations;
  return { ...state, [endpointGuid]: { ...endpointState, spaces, organizations } };
}

// ---- connected-user role mutation (restored) ------------------------------

/** Plain descriptor of a single role change applied to the connected user's role cache. */
export interface CfRoleCacheChange {
  endpointGuid: string;
  isSpace: boolean;
  /** Org or space guid the role applies to. */
  entityGuid: string;
  orgGuid: string;
  permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames;
  /** Only the connected user's own role cache should change. */
  updateConnectedUser: boolean;
}

function roleNameToPermission(roleName: OrgUserRoleNames | SpaceUserRoleNames, scope: RoleScope): CfPermissionStrings {
  return permissionOfScoped(roleName, scope);
}

/** Apply an add/remove of a single role for the connected user. Was `updateAfterCfRoleChange`. */
export function applyCfRoleChange(state: IAllCfRolesState, change: CfRoleCacheChange, isAdd: boolean): IAllCfRolesState {
  if (!change.updateConnectedUser) {
    // The change does not affect the connected user (or they're an admin) — no cache update.
    return state;
  }
  const endpointState = state[change.endpointGuid];
  if (!endpointState) {
    return state;
  }
  const permType = roleNameToPermission(change.permissionTypeKey, change.isSpace ? 'space' : 'org');

  if (change.isSpace) {
    const spaceState: ISpaceRoleState = (endpointState.spaces[change.entityGuid] as ISpaceRoleState)
      || { ...defaultCfUserSpaceRoleState, orgId: change.orgGuid };
    if ((spaceState as Record<string, any>)[permType] === isAdd) {
      return state;
    }
    const spacePermissions = { ...spaceState, [permType]: isAdd };
    const org = endpointState.organizations[change.orgGuid] || createCfOrgRoleStateState();
    let spaceGuids = org.spaceGuids;
    const idx = spaceGuids.indexOf(change.entityGuid);
    if (isAdd && idx < 0) {
      spaceGuids = [...spaceGuids, change.entityGuid];
    } else if (!isAdd && idx >= 0 && !spacePermissions.isAuditor && !spacePermissions.isDeveloper && !spacePermissions.isManager && !spacePermissions.isSupporter) {
      spaceGuids = spaceGuids.filter(guid => guid !== change.entityGuid);
    }
    return {
      ...state,
      [change.endpointGuid]: {
        ...endpointState,
        organizations: { ...endpointState.organizations, [change.orgGuid]: { ...org, spaceGuids } },
        spaces: { ...endpointState.spaces, [change.entityGuid]: spacePermissions },
      },
    };
  }

  const orgState: IOrgRoleState = (endpointState.organizations[change.entityGuid] as IOrgRoleState)
    || { ...defaultCfUserOrgRoleState };
  if ((orgState as Record<string, any>)[permType] === isAdd) {
    return state;
  }
  return {
    ...state,
    [change.endpointGuid]: {
      ...endpointState,
      organizations: { ...endpointState.organizations, [change.entityGuid]: { ...orgState, [permType]: isAdd } },
    },
  };
}
