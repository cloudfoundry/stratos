import { BaseSpaceAction, CREATE_SPACE_SUCCESS, DELETE_SPACE_SUCCESS } from '../actions/space.actions';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';

export function updateOrganizationSpaceReducer() {
  return function (state: APIResource, action: APISuccessOrFailedAction) {
    switch (action.type) {
      case DELETE_SPACE_SUCCESS:
      case CREATE_SPACE_SUCCESS:
        const spaceAction: BaseSpaceAction = action.apiAction as BaseSpaceAction;
        return deleteOrgSpaces(state, spaceAction.orgGuid);
    }
    return state;
  };
}
function deleteOrgSpaces(state: APIResource, orgGuid: string) {
  if (!orgGuid) {
    return state;
  }
  const oldEntities = Object.values(state);
  const entities = {};
  oldEntities.forEach(org => {
    if (org.metadata.guid === orgGuid) {
      const newOrg = {
        ...org,
        entity: {
          ...org.entity,
          spaces: null
        }
      };
      entities[org.metadata.guid] = newOrg;
    } else {
      entities[org.metadata.guid] = org;
    }
  });
  return entities;
}
