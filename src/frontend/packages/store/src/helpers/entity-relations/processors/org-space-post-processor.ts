import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../cloud-foundry/cf-types';
import { getCFEntityKey } from '../../../../../cloud-foundry/src/cf-entity-helpers';
import { entityCatalogue } from '../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { GetOrganization } from '../../../../../cloud-foundry/src/actions/organization.actions';
import { APIResponse } from '../../../actions/request.actions';
import { GetSpace } from '../../../../../cloud-foundry/src/actions/space.actions';
import { GeneralEntityAppState, GeneralRequestDataState, IRequestEntityTypeState } from '../../../app-state';
import { selectPaginationState } from '../../../selectors/pagination.selectors';
import { APIResource } from '../../../types/api.types';
import { PaginatedAction, PaginationEntityState } from '../../../types/pagination.types';
import { RequestEntityLocation, WrapperRequestActionSuccess } from '../../../types/request.types';
import { CfUser, CfUserRoleParams, OrgUserRoleNames, SpaceUserRoleNames } from '../../../types/user.types';
import { deepMergeState, mergeEntity } from '../../reducer.helper';
import {
  createEntityRelationPaginationKey,
  ValidateEntityResult,
  ValidateResultFetchingState,
} from '../entity-relations.types';

import {
  cfUserEntityType,
  organizationEntityType,
  spaceEntityType,
} from '../../../../../cloud-foundry/src/cf-entity-factory';
import { EntityCatalogueHelpers } from '../../../../../core/src/core/entity-catalogue/entity-catalogue.helper';
/**
 * Add roles from (org|space)\[role\]\[user\] into user\[role\]
 */
function updateUser(
  apiUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  existingUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  newUsers: IRequestEntityTypeState<APIResource<CfUser>>,
  orgOrSpace,
  orgSpaceParamName: string,
  userParamName: string) {
  if (orgOrSpace[orgSpaceParamName]) {
    orgOrSpace[orgSpaceParamName].forEach(userGuid => {
      const existingUser = apiUsers[userGuid] || existingUsers[userGuid];
      const existingRoles = existingUser.entity[userParamName] || [];

      if (existingRoles.indexOf(orgOrSpace.guid) < 0) {
        newUsers[userGuid] = mergeEntity({
          entity: {
            [userParamName]: [
              ...existingRoles,
              orgOrSpace.guid
            ]
          }
        }, newUsers[userGuid] || existingUser);
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
  store: Store<GeneralEntityAppState>,
  action: GetOrganization | GetSpace,
  apiResponse: APIResponse,
  allEntities: GeneralRequestDataState): ValidateEntityResult {
  const entities = apiResponse ? apiResponse.response.entities : allEntities;
  const orgOrSpaceCatalogueEntity = entityCatalogue.getEntity(action.endpointType, action.entityType);
  const { entityKey } = orgOrSpaceCatalogueEntity;
  const orgOrSpace = entities[entityKey][action.guid];
  const users = entities[entityKey];
  const existingUsers = allEntities[entityKey];

  const newUsers = {};
  if (entityKey === getCFEntityKey(organizationEntityType)) {
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, OrgUserRoleNames.USER, CfUserRoleParams.ORGANIZATIONS);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, OrgUserRoleNames.MANAGER, CfUserRoleParams.MANAGED_ORGS);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, OrgUserRoleNames.BILLING_MANAGERS,
      CfUserRoleParams.BILLING_MANAGER_ORGS);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, OrgUserRoleNames.AUDITOR, CfUserRoleParams.AUDITED_ORGS);
  } else if (entityKey === getCFEntityKey(spaceEntityType)) {
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, SpaceUserRoleNames.DEVELOPER, CfUserRoleParams.SPACES);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, SpaceUserRoleNames.MANAGER, CfUserRoleParams.MANAGED_SPACES);
    updateUser(users, existingUsers, newUsers, orgOrSpace.entity, SpaceUserRoleNames.AUDITOR, CfUserRoleParams.AUDITED_SPACES);
  }
  const userCatalogueEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, cfUserEntityType);
  if (!Object.keys(newUsers).length) {
    return;
  }
  if (apiResponse) {
    // The apiResponse will make it into the store, as this is an api.effect validation
    apiResponse.response.entities = deepMergeState(apiResponse.response.entities, { [userCatalogueEntity.entityKey]: newUsers });
    return;
  } else {

    // The apiResponse will NOT make it into the store, as this is a general validation. So create a mock event to push to store
    const response = {
      entities: {
        [userCatalogueEntity.entityKey]: newUsers
      },
      result: Object.keys(newUsers)
    };

    const paginatedAction: PaginatedAction = {
      actions: [],
      endpointGuid: action.endpointGuid,
      entity: userCatalogueEntity.getSchema(),
      entityLocation: RequestEntityLocation.ARRAY,
      entityType: userCatalogueEntity.definition.type,
      endpointType: CF_ENDPOINT_TYPE,
      type: '[Entity] Post-process Org/Space Users',
      paginationKey: createEntityRelationPaginationKey(action.entityType, action.guid)
    };

    const successAction = new WrapperRequestActionSuccess(response, paginatedAction, 'fetch', 1, 1);
    return {
      action: successAction,
      fetchingState$: store.select(selectPaginationState(userCatalogueEntity.entityKey, paginatedAction.paginationKey)).pipe(
        map((state: PaginationEntityState) => {
          const res: ValidateResultFetchingState = {
            fetching: !state || !state.ids[1]
          };
          return res;
        })
      )
    };
  }
}
