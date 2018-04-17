import { IOrganization, ISpace } from '../../core/cf-api.types';
import { BaseSpaceAction, CREATE_SPACE_SUCCESS, DELETE_SPACE_SUCCESS } from '../actions/space.actions';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';

// Note - This reducer will be updated when we address general entity relation deletion
export function updateOrganizationSpaceReducer() {
  return function (state: APIResource, action: APISuccessOrFailedAction) {
    switch (action.type) {
      case DELETE_SPACE_SUCCESS:
      case CREATE_SPACE_SUCCESS:
        const spaceAction: BaseSpaceAction = action.apiAction as BaseSpaceAction;
        return deleteOrgSpaces(state, spaceAction.orgGuid, spaceAction);
    }
    return state;
  };
}

function deleteOrgSpaces(state: APIResource, orgGuid: string, spaceAction: BaseSpaceAction) {
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
      let newSpaces: APIResource<ISpace>[] = null;
      if (spaceAction.removeEntityOnDelete) {
        const spaceIndex = org.entity.spaces.findIndex(space => {
          return typeof (space) === 'string' ? space === spaceAction.guid : space.metadata.guid === spaceAction.guid;
        });
        if (spaceIndex >= 0) {
          newSpaces = [...org.entity.spaces];
          newSpaces.splice(spaceIndex, 1);
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
