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
import { IRequestEntityTypeState } from '../app-state';
type entityOrgType = APIResource<IOrganization<string[]>>;
// Note - This reducer will be updated when we address general deletion of entities within inline lists (not paginated lists)
export function updateOrganizationSpaceReducer() {
  return function (state: IRequestEntityTypeState<entityOrgType>, action: APISuccessOrFailedAction<NormalizedResponse>) {
    switch (action.type) {
      case DELETE_SPACE_SUCCESS:
        const deleteSpaceAction: DeleteSpace = action.apiAction as DeleteSpace;
        return removeSpaceFromOrg(state, deleteSpaceAction.orgGuid, deleteSpaceAction.guid);
      case CREATE_SPACE_SUCCESS:
        const createSpaceAction = action.apiAction as CreateSpace;
        const response = action.response;
        const space = response.entities[spaceSchemaKey][response.result[0]];
        return addSpaceToOrg(state, createSpaceAction.orgGuid, space);
    }
    return state;
  };
}

function addSpaceToOrg(
  state: IRequestEntityTypeState<entityOrgType>,
  orgGuid: string,
  newSpace: APIResource<ISpace>
) {
  const orgToModify = getOrg(state, orgGuid);
  const newSpaces = [
    ...orgToModify.entity.spaces,
    newSpace.metadata.guid
  ];
  const mergedOrg = applySpacesToOrg(orgToModify, newSpaces);
  return {
    ...state,
    [orgGuid]: mergedOrg
  };
}

function removeSpaceFromOrg(
  state: IRequestEntityTypeState<entityOrgType>,
  orgGuid: string,
  spaceGuid: string
) {
  const orgToModify = getOrg(state, orgGuid);
  const newSpaces = orgToModify.entity.spaces.reduce((spaceIds, spaceId) => {
    if (spaceId !== spaceGuid) {
      spaceIds.push(spaceId);
    }
    return spaceIds;
  }, []);
  const mergedOrg = applySpacesToOrg(orgToModify, newSpaces);
  return applyModifyOrgToState(state, mergedOrg);
}

function applySpacesToOrg(org: entityOrgType, spaces: string[]): entityOrgType {
  return {
    ...org,
    entity: {
      ...org.entity,
      spaces
    }
  };
}

function applyModifyOrgToState(state: IRequestEntityTypeState<entityOrgType>, org: entityOrgType) {
  return {
    ...state,
    [org.metadata.guid]: org
  };
}

function getOrg(
  state: IRequestEntityTypeState<entityOrgType>,
  orgGuid: string,
) {
  const {
    [orgGuid]: newOrg
  } = state;
  return newOrg;
}
