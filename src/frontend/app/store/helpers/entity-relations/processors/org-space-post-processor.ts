import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { APIResponse } from '../../../actions/request.actions';
import { AppState } from '../../../app-state';
import { selectPaginationState } from '../../../selectors/pagination.selectors';
import { IRequestDataState } from '../../../types/entity.types';
import { PaginatedAction, PaginationEntityState } from '../../../types/pagination.types';
import { IRequestAction, RequestEntityLocation, WrapperRequestActionSuccess } from '../../../types/request.types';
import { CfUserRoleParams } from '../../../types/user.types';
import { deepMergeState, mergeEntity } from '../../reducer.helper';
import {
  createEntityRelationPaginationKey,
  ValidateEntityResult,
  ValidateResultFetchingState,
} from '../entity-relations.types';
import { cfUserSchemaKey, entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../entity-factory';

function updateUserFromOrgSpaceArray(
  existingUsers: { [guid: string]: any },
  newUsers: { [guid: string]: any },
  orgOrSpace,
  orgSpaceParamName: string,
  userParamName: string) {
  if (orgOrSpace[orgSpaceParamName]) {
    orgOrSpace[orgSpaceParamName].forEach(userGuid => {
      if (!existingUsers[userGuid]) {
        console.log('DANGER');
      }
      const existingUser = existingUsers[userGuid];
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
      }
    });
  }
  return newUsers;
}

export function orgSpacePostProcess(
  store: Store<AppState>,
  action: IRequestAction,
  apiResponse: APIResponse,
  allEntities: IRequestDataState): ValidateEntityResult {
  const entities = apiResponse ? apiResponse.response.entities : allEntities;
  const orgOrSpace = entities[action.entityKey][action.guid];
  const users = entities[cfUserSchemaKey];

  const newUsers = {};
  if (action.entityKey === organizationSchemaKey) {
    updateUserFromOrgSpaceArray(users, newUsers, orgOrSpace.entity, 'users', CfUserRoleParams.ORGANIZATIONS);
    updateUserFromOrgSpaceArray(users, newUsers, orgOrSpace.entity, 'managers', CfUserRoleParams.MANAGER_ORGS);
    updateUserFromOrgSpaceArray(users, newUsers, orgOrSpace.entity, 'billing_managers', CfUserRoleParams.BILLING_MANAGER_ORGS);
    updateUserFromOrgSpaceArray(users, newUsers, orgOrSpace.entity, 'auditors_managers', CfUserRoleParams.AUDITED_ORGS);
  } else if (action.entityKey === spaceSchemaKey) {
    updateUserFromOrgSpaceArray(users, newUsers, orgOrSpace.entity, 'developers', CfUserRoleParams.SPACES);
    updateUserFromOrgSpaceArray(users, newUsers, orgOrSpace.entity, 'managers', CfUserRoleParams.MANAGED_SPACES);
    updateUserFromOrgSpaceArray(users, newUsers, orgOrSpace.entity, 'auditors', CfUserRoleParams.AUDITED_SPACES);
  }

  if (!Object.keys(newUsers).length) {
    return;
  }
  if (apiResponse) {
    // The apiResponse will make it into the store, as this is an api.effect validation
    apiResponse.response.entities = deepMergeState(apiResponse.response.entities, { [cfUserSchemaKey]: newUsers });
    return;
  } else {
    // The apiResponse will NOT make it into the store, as this is a general validation. So create a mock event to push to store
    const response = {
      entities: {
        [cfUserSchemaKey]: newUsers
      },
      result: Object.keys(newUsers)
    };
    const paginatedAction: PaginatedAction = {
      actions: [],
      endpointGuid: action.endpointGuid,
      entity: entityFactory(cfUserSchemaKey),
      entityLocation: RequestEntityLocation.ARRAY,
      entityKey: cfUserSchemaKey,
      type: '[Entity] Post-process Org/Space Users',
      paginationKey: createEntityRelationPaginationKey(action.entityKey, action.guid)
    };

    const successAction = new WrapperRequestActionSuccess(response, paginatedAction, 'fetch', 1, 1);
    return {
      action: successAction,
      fetchingState$: store.select(selectPaginationState(paginatedAction.entityKey, paginatedAction.paginationKey)).pipe(
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
