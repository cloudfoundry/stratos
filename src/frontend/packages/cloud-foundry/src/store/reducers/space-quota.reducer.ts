import { IRequestEntityTypeState } from '../../../../store/src/app-state';
import { APIResource, NormalizedResponse } from '../../../../store/src/types/api.types';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import {
  ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS,
  AssociateSpaceQuota,
  DISASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS,
  DisassociateSpaceQuota,
} from '../../actions/quota-definitions.actions';
import { ISpace, ISpaceQuotaDefinition } from '../../cf-api.types';
import { getCFEntityKey } from '../../cf-entity-helpers';

type entityOrgType = APIResource<ISpace>;
export function updateSpaceQuotaReducer(
  state: IRequestEntityTypeState<any>,
  action: APISuccessOrFailedAction<NormalizedResponse>
) {
  let space;

  switch (action.type) {
    case ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS:
      const associateAction = action.apiAction as AssociateSpaceQuota;
      const response = action.response;
      const entityKey = getCFEntityKey(action.apiAction.entityType);
      const newSpaceQuota = response.entities[entityKey][response.result[0]];
      space = state[associateAction.spaceGuid];

      return applySpaceQuota(state, space, newSpaceQuota);
    case DISASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS:
      const disassociateAction = action.apiAction as DisassociateSpaceQuota;
      space = state[disassociateAction.spaceGuid];

      return removeSpaceQuota(state, space);
  }
  return state;
}

function applySpaceQuota(
  state: IRequestEntityTypeState<entityOrgType>,
  space: entityOrgType,
  spaceQuota: APIResource<ISpaceQuotaDefinition>
) {
  return {
    ...state,
    [space.metadata.guid]: {
      ...space,
      entity: {
        ...space.entity,
        space_quota_definition: spaceQuota.metadata.guid,
        space_quota_definition_guid: spaceQuota.metadata.guid,
        space_quota_definition_url: spaceQuota.metadata.url
      },
    },
  };
}

function removeSpaceQuota(
  state: IRequestEntityTypeState<entityOrgType>,
  space: entityOrgType,
) {
  return {
    ...state,
    [space.metadata.guid]: {
      ...space,
      entity: {
        ...space.entity,
        space_quota_definition: null,
        space_quota_definition_guid: null,
        space_quota_definition_url: null
      },
    },
  };
}
