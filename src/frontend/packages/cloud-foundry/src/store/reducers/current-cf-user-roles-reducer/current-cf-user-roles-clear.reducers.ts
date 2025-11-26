import type { EndpointActionComplete } from '../../../../../store/src/actions/endpoint.actions';
import type { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import type { APISuccessOrFailedAction } from '../../../../../store/src/types/request.types';
import { CF_ENDPOINT_TYPE } from '../../../cf-types';
import type { IAllCfRolesState } from '../../types/cf-current-user-roles.types';
import { getDefaultCfEndpointRoles } from './current-cf-user-base-cf-role.reducer';

export function removeEndpointCfRoles(state: IAllCfRolesState, action: EndpointActionComplete) {
  if (!state[action.guid]) {
    return state;
  }
  const cfState = {
    ...state
  };
  delete cfState[action.guid];
  return {
    ...cfState,
  };
}

export function addCfEndpoint(state: IAllCfRolesState, action: EndpointActionComplete) {
  if (action.endpointType !== CF_ENDPOINT_TYPE) {
    return state;
  }
  const endpoint = action.endpoint as EndpointModel;
  const guid = endpoint.guid;
  if (state[guid]) {
    return state;
  }
  const cfState = {
    ...state
  };

  cfState[guid] = getDefaultCfEndpointRoles();
  return cfState;
}

export function removeCfSpaceRoles(state: IAllCfRolesState, action: APISuccessOrFailedAction): IAllCfRolesState {
  const { endpointGuid, guid } = action.apiAction;
  const removedOrgOrSpaceState = removeOrgOrSpaceRoles(state, endpointGuid as string, guid, 'spaces');
  return removeSpaceIdFromOrg(removedOrgOrSpaceState, endpointGuid as string, guid);
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

export function removeCfOrgRoles(state: IAllCfRolesState, action: APISuccessOrFailedAction): IAllCfRolesState {
  const { endpointGuid, guid } = action.apiAction;
  if (!state[endpointGuid as string].organizations[guid]) {
    return state;
  }
  // const spaceIds = state.cf[endpointGuid].organizations[guid].spaceIds;
  const spaceIds: string[] = [];
  const newState = removeOrgOrSpaceRoles(state, endpointGuid as string, guid, 'organizations');
  return cleanUpOrgSpaces(newState, spaceIds, endpointGuid as string);
}

function removeOrgOrSpaceRoles(
  state: IAllCfRolesState,
  endpointGuid: string,
  orgOrSpaceId: string,
  type: 'organizations' | 'spaces'
): IAllCfRolesState {
  const cfEndpoint = state[endpointGuid] as unknown as Record<string, Record<string, unknown>>;
  if (!cfEndpoint[type][orgOrSpaceId]) {
    return state;
  }
  // Remove orgOrSpaceId
  const {
    [orgOrSpaceId]: omit,
    ...newTypeState
  } = cfEndpoint[type];

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
