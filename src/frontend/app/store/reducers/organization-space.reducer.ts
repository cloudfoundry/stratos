import { IOrganization, ISpace } from '../../core/cf-api.types';
import {
  BaseSpaceAction,
  CREATE_SPACE_SUCCESS,
  CreateSpace,
  DELETE_SPACE_SUCCESS,
  DeleteSpace,
} from '../actions/space.actions';
import { spaceSchemaKey } from '../helpers/entity-factory';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';

// Note - This reducer will be updated when we address general deletion of entities within inline lists (not paginated lists)
export function updateOrganizationSpaceReducer() {
  return function (state: APIResource, action: APISuccessOrFailedAction) {
    switch (action.type) {
      case DELETE_SPACE_SUCCESS:
        const deleteSpaceAction: DeleteSpace = action.apiAction as DeleteSpace;
        return updateOrgSpaces(state, deleteSpaceAction.orgGuid, deleteSpaceAction);
      case CREATE_SPACE_SUCCESS:
        const createSpaceAction: CreateSpace = action.apiAction as CreateSpace;
        const response: NormalizedResponse = action.response as NormalizedResponse;
        const space = response.entities[spaceSchemaKey][response.result[0]];
        return updateOrgSpaces(state, createSpaceAction.orgGuid, createSpaceAction, space);
    }
    return state;
  };
}

function updateOrgSpaces(state: APIResource, orgGuid: string, spaceAction: BaseSpaceAction, newSpace?: APIResource<ISpace>) {
  if (!orgGuid) {
    return state;
  }

  const orgGuids = Object.keys(state);
  if (orgGuids.indexOf(orgGuid) === -1) {
    return state;
  }

  const newState = {};
  orgGuids.forEach(currentGuid => {
    const org: APIResource<IOrganization> = state[currentGuid];
    if (currentGuid === orgGuid) {
      const newSpaces: (APIResource<ISpace> | string)[] = [...org.entity.spaces];
      if (newSpace) {
        newSpaces.push(newSpace.metadata.guid);
      } else {
        if (spaceAction.removeEntityOnDelete) {
          const spaceIndex = org.entity.spaces.findIndex(space => {
            return typeof (space) === 'string' ? space === spaceAction.guid : space.metadata.guid === spaceAction.guid;
          });
          if (spaceIndex >= 0) {
            newSpaces.splice(spaceIndex, 1);
          }
        }
      }
      const newOrg = {
        ...org,
        entity: {
          ...org.entity,
          spaces: newSpaces
        }
      };
      newState[currentGuid] = newOrg;
    } else {
      newState[currentGuid] = org;
    }
  });
  return newState;
}
