import { DisconnectEndpoint } from '../../actions/endpoint.actions';
import { ICurrentUserRolesState } from '../../types/current-user-roles.types';
import { APISuccessOrFailedAction } from '../../types/request.types';

export function removeEndpointRoles(state: ICurrentUserRolesState, action: DisconnectEndpoint) {
  const cfState = {
    ...state.cf
  };
  if (action.endpointType !== 'cf' || !cfState[action.guid]) {
    return state;
  }
  delete cfState[action.guid];
  return {
    ...state,
    cf: cfState
  };
}

export function removeSpaceRoles(state: ICurrentUserRolesState, action: APISuccessOrFailedAction) {
  const { endpointGuid, guid } = action.apiAction;
  return removeOrgOrSpaceRoles(state, endpointGuid, guid, 'spaces');
}

export function removeOrgRoles(state: ICurrentUserRolesState, action: APISuccessOrFailedAction) {
  const { endpointGuid, guid } = action.apiAction;
  if (!state.cf[endpointGuid].organizations[guid]) {
    return state;
  }
  // const spaceIds = state.cf[endpointGuid].organizations[guid].spaceIds;
  const spaceIds = [];
  const newState = removeOrgOrSpaceRoles(state, endpointGuid, guid, 'organizations');
  return cleanUpOrgSpaces(newState, spaceIds, endpointGuid);
}

function removeOrgOrSpaceRoles(
  state: ICurrentUserRolesState,
  endpointGuid: string,
  orgOrSpaceId: string,
  type: 'organizations' | 'spaces'
) {
  if (!state.cf[endpointGuid][type][orgOrSpaceId]) {
    return state;
  }
  // Remove orgOrSpaceId
  const {
    [orgOrSpaceId]: omit,
    ...newTypeState
  } = state.cf[endpointGuid][type];

  const newState = {
    ...state,
    cf: {
      ...state.cf,
      [endpointGuid]: {
        ...state.cf[endpointGuid],
        [type]: newTypeState
      }
    }
  };
  return newState;
}

function cleanUpOrgSpaces(state: ICurrentUserRolesState, spaceIds: string[], endpointGuid: string) {
  if (!spaceIds || spaceIds.length === 0 || !state.cf[endpointGuid]) {
    return state;
  }
  return spaceIds.reduce((newState, spaceId) => {
    if (newState.cf[endpointGuid].spaces[spaceId]) {
      delete newState.cf[endpointGuid].spaces[spaceId];
    }
    return newState;
  }, { ...state });
}



