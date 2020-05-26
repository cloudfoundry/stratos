import { EndpointActionComplete } from '../../../../../store/src/actions/endpoint.actions';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { APISuccessOrFailedAction } from '../../../../../store/src/types/request.types';
import { IAllCfRolesState } from '../../types/cf-current-user-roles.types';
import { getDefaultEndpointRoles } from './current-user-base-cf-role.reducer';

export function removeEndpointRoles(state: IAllCfRolesState, action: EndpointActionComplete) {
  const cfState = {
    ...state
  };
  if (!cfState[action.guid]) {
    return state;
  }
  delete cfState[action.guid];
  return {
    ...cfState,
  };
}

export function addEndpoint(state: IAllCfRolesState, action: EndpointActionComplete) {
  const endpoint = action.endpoint as EndpointModel;
  const guid = endpoint.guid;
  if (state[guid]) {
    return state;
  }
  const cfState = {
    ...state
  };

  cfState[guid] = getDefaultEndpointRoles();
  return cfState;
}

export function removeSpaceRoles(state: IAllCfRolesState, action: APISuccessOrFailedAction) {
  const { endpointGuid, guid } = action.apiAction;
  const removedOrgOrSpaceState = removeOrgOrSpaceRoles(state, endpointGuid as string, guid, 'spaces'); // TODO: RC HUH
  return removeSpaceIdFromOrg(state, endpointGuid as string, guid);
}

function removeSpaceIdFromOrg(state: IAllCfRolesState, endpointGuid: string, spaceGuid: string) {
  const space = state[endpointGuid].spaces[spaceGuid];
  if (!space) {
    return state;
  }
  const { orgId } = space;
  return {
    ...state,
    [endpointGuid]: {
      ...state[endpointGuid],
      organizations: {
        ...state[endpointGuid].organizations,
        [orgId]: {
          ...state[endpointGuid].organizations[orgId],
          spaceGuids: state[endpointGuid].organizations[orgId].spaceGuids.filter(id => id !== spaceGuid)
        }
      }
    }
  };
}

export function removeOrgRoles(state: IAllCfRolesState, action: APISuccessOrFailedAction) {
  const { endpointGuid, guid } = action.apiAction;
  if (!state[endpointGuid as string].organizations[guid]) {
    return state;
  }
  // const spaceIds = state.cf[endpointGuid].organizations[guid].spaceIds;
  const spaceIds = [];
  const newState = removeOrgOrSpaceRoles(state, endpointGuid, guid, 'organizations');
  return cleanUpOrgSpaces(newState, spaceIds, endpointGuid);
}

function removeOrgOrSpaceRoles(
  state: IAllCfRolesState,
  endpointGuid: string,
  orgOrSpaceId: string,
  type: 'organizations' | 'spaces'
) {
  if (!state[endpointGuid][type][orgOrSpaceId]) {
    return state;
  }
  // Remove orgOrSpaceId
  const {
    [orgOrSpaceId]: omit,
    ...newTypeState
  } = state[endpointGuid][type];

  const newState = {
    ...state,
    [endpointGuid]: {
      ...state[endpointGuid],
      [type]: newTypeState
    }
  };
  return newState;
}

function cleanUpOrgSpaces(state: IAllCfRolesState, spaceIds: string[], endpointGuid: string) {
  if (!spaceIds || spaceIds.length === 0 || !state[endpointGuid]) {
    return state;
  }
  return spaceIds.reduce((newState, spaceId) => {
    if (newState[endpointGuid].spaces[spaceId]) {
      delete newState[endpointGuid].spaces[spaceId];
    }
    return newState;
  }, { ...state });
}
