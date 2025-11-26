import type { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  type APIResponse,
  type GeneralEntityAppState,
  type GeneralRequestDataState,
  type IRequestEntityTypeState,
  entityCatalog,
  selectPaginationState,
  type APIResource,
  type PaginatedAction,
  type PaginationEntityState,
  WrapperRequestActionSuccess
} from '@stratosui/store';
import { deepMergeState, mergeEntity } from '../../../../store/src/helpers/reducer.helper';
import type { GetOrganization } from '../../actions/organization.actions';
import type { GetSpace } from '../../actions/space.actions';
import { getCFEntityKey } from '../../cf-entity-helpers';
import { cfUserEntityType, organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { type CfUser, CfUserRoleParams, OrgUserRoleNames, SpaceUserRoleNames } from '../../store/types/cf-user.types';
import {
  createEntityRelationPaginationKey,
  type ValidateEntityResult,
  type ValidateResultFetchingState,
} from '../entity-relations.types';

/**
 * Type guard to check if value is a string array
 */
function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every(item => typeof item === 'string');
}

/**
 * Type guard to check if object has entity property
 */
function hasEntity(obj: unknown): obj is { entity: unknown } {
  return obj !== null && typeof obj === 'object' && 'entity' in obj;
}

/**
 * Type guard to check if object has guid property
 */
function hasGuid(obj: unknown): obj is { guid: unknown } {
  return obj !== null && typeof obj === 'object' && 'guid' in obj;
}

/**
 * Add roles from (org|space)\[role\]\[user\] into user\[role\]
 */
function updateUser(
  apiUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  existingUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  newUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  orgOrSpace: Record<string, unknown>,
  orgSpaceParamName: string,
  userParamName: string): IRequestEntityTypeState<APIResource<CfUser>> {
  const paramValue = orgOrSpace[orgSpaceParamName];
  if (paramValue && isStringArray(paramValue)) {
    paramValue.forEach((userGuid: string) => {
      const existingUser = apiUsers[userGuid] || existingUsers[userGuid];
      if (!existingUser || !hasEntity(existingUser)) {
        return;
      }
      const userEntity = existingUser.entity;
      if (typeof userEntity !== 'object' || userEntity === null) {
        return;
      }
      const userEntityRecord = userEntity as unknown as Record<string, unknown>;
      const existingRoles = userEntityRecord[userParamName];
      const existingRolesArray = isStringArray(existingRoles) ? existingRoles : [];

      const orgOrSpaceGuid = hasGuid(orgOrSpace) ? orgOrSpace.guid : null;
      if (orgOrSpaceGuid && typeof orgOrSpaceGuid === 'string' && existingRolesArray.indexOf(orgOrSpaceGuid) < 0) {
        const mergedEntity = mergeEntity({
          entity: {
            [userParamName]: [
              ...existingRolesArray,
              orgOrSpaceGuid
            ]
          }
        } as unknown as Record<string, unknown>, (newUsers[userGuid] || existingUser) as unknown as Record<string, unknown>);
        newUsers[userGuid] = mergedEntity as unknown as APIResource<CfUser>;
      } else {
        newUsers[userGuid] = existingUser;
      }
    });
  }
  return newUsers;
}

/**
 * Given a request to fetch an org or space, extract the roles from the entity and ensure users have corresponding role. For instance
 * an org such as { entity: billing_managers: [ userA ] } would result in userA: { billing_managed_organizations: [ org ]}.
 * In the normal flow the user's role array will already have the org. However, when a user is an org billing_managers in more than 50 orgs
 * the role array is missing. It's for those cases that we then bring across the role from the org to the user.
 */
export function orgSpacePostProcess(
  store: Store,
  action: GetOrganization | GetSpace,
  apiResponse: APIResponse,
  allEntities: GeneralRequestDataState): ValidateEntityResult {
  const entities = apiResponse ? apiResponse.response.entities : allEntities;
  const catalogEntity = entityCatalog.getEntity(action.endpointType, action.entityType);
  if (!catalogEntity) {
    return null;
  }
  const { entityKey: cfOrgOrSpaceEntityKey } = catalogEntity;
  const orgOrSpaceEntity = (entities as Record<string, Record<string, unknown>>)[cfOrgOrSpaceEntityKey]?.[action.guid];
  if (!orgOrSpaceEntity || !hasEntity(orgOrSpaceEntity)) {
    return null;
  }
  const orgOrSpace = orgOrSpaceEntity;
  const orgOrSpaceEntityRecord = orgOrSpace.entity as Record<string, unknown>;

  const userCatalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, cfUserEntityType);
  const { entityKey: cfUserEntityKey } = userCatalogEntity;
  const usersData = entities[cfUserEntityKey];
  const users = (usersData || {}) as IRequestEntityTypeState<APIResource<CfUser>>;
  const existingUsersData = allEntities[cfUserEntityKey];
  const existingUsers = (existingUsersData || {}) as IRequestEntityTypeState<APIResource<CfUser>>;

  const newUsers: IRequestEntityTypeState<APIResource<CfUser>> = {};
  if (cfOrgOrSpaceEntityKey === getCFEntityKey(organizationEntityType)) {
    updateUser(users, existingUsers, newUsers, orgOrSpaceEntityRecord, OrgUserRoleNames.USER, CfUserRoleParams.ORGANIZATIONS);
    updateUser(users, existingUsers, newUsers, orgOrSpaceEntityRecord, OrgUserRoleNames.MANAGER, CfUserRoleParams.MANAGED_ORGS);
    updateUser(users, existingUsers, newUsers, orgOrSpaceEntityRecord, OrgUserRoleNames.BILLING_MANAGERS,
      CfUserRoleParams.BILLING_MANAGER_ORGS);
    updateUser(users, existingUsers, newUsers, orgOrSpaceEntityRecord, OrgUserRoleNames.AUDITOR, CfUserRoleParams.AUDITED_ORGS);
  } else if (cfOrgOrSpaceEntityKey === getCFEntityKey(spaceEntityType)) {
    updateUser(users, existingUsers, newUsers, orgOrSpaceEntityRecord, SpaceUserRoleNames.DEVELOPER, CfUserRoleParams.SPACES);
    updateUser(users, existingUsers, newUsers, orgOrSpaceEntityRecord, SpaceUserRoleNames.MANAGER, CfUserRoleParams.MANAGED_SPACES);
    updateUser(users, existingUsers, newUsers, orgOrSpaceEntityRecord, SpaceUserRoleNames.AUDITOR, CfUserRoleParams.AUDITED_SPACES);
  }
  if (!Object.keys(newUsers).length) {
    return null;
  }
  if (apiResponse) {
    // The apiResponse will make it into the store, as this is an api.effect validation
    apiResponse.response.entities = deepMergeState(apiResponse.response.entities, { [cfUserEntityKey]: newUsers });
    return null;
  } else {

    // The apiResponse will NOT make it into the store, as this is a general validation. So create a mock event to push to store
    const response = {
      entities: {
        [cfUserEntityKey]: newUsers
      },
      result: Object.keys(newUsers)
    };

    const paginatedAction: PaginatedAction = {
      actions: [],
      endpointGuid: action.endpointGuid,
      entity: userCatalogEntity.getSchema(),
      entityType: userCatalogEntity.definition.type,
      endpointType: CF_ENDPOINT_TYPE,
      type: '[Entity] Post-process Org/Space Users',
      paginationKey: createEntityRelationPaginationKey(action.entityType, action.guid)
    };

    const successAction = new WrapperRequestActionSuccess(response, paginatedAction, 'fetch', 1, 1);
    return {
      action: successAction,
      fetchingState$: store.select(selectPaginationState(cfUserEntityKey, paginatedAction.paginationKey)).pipe(
        map((state: PaginationEntityState) => {
          const res: ValidateResultFetchingState = {
            fetching: !state || !(state.ids as Record<number, string[]>)[1]
          };
          return res;
        })
      )
    };
  }
}
