import type { IRequestEntityTypeState } from '../../../../store/src/app-state';
import type { APIResource, NormalizedResponse } from '../../../../store/src/types/api.types';
import type { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import {
  ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS,
  type AssociateSpaceQuota,
  DISASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS,
  type DisassociateSpaceQuota,
} from '../../actions/quota-definitions.actions';
import type { ISpace, ISpaceQuotaDefinition } from '../../cf-api.types';
import { getCFEntityKey } from '../../cf-entity-helpers';

type entityOrgType = APIResource<ISpace>;
export function updateSpaceQuotaReducer(
  state: IRequestEntityTypeState<entityOrgType>,
  action: APISuccessOrFailedAction<NormalizedResponse>
): IRequestEntityTypeState<entityOrgType> {
  let space: entityOrgType;

  switch (action.type) {
    case ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS: {
      const associateAction = action.apiAction as AssociateSpaceQuota;
      const response = action.response;
      const entityKey = getCFEntityKey(action.apiAction.entityType);
      const newSpaceQuota = response.entities[entityKey][response.result[0]] as APIResource<ISpaceQuotaDefinition>;
      space = state[associateAction.spaceGuid];

      return applySpaceQuota(state, space, newSpaceQuota);
    }
    case DISASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS: {
      const disassociateAction = action.apiAction as DisassociateSpaceQuota;
      space = state[disassociateAction.spaceGuid];

      return removeSpaceQuota(state, space);
    }
  }
  return state;
}

function applySpaceQuota(
  state: IRequestEntityTypeState<entityOrgType>,
  space: entityOrgType,
  spaceQuota: APIResource<ISpaceQuotaDefinition>
): IRequestEntityTypeState<entityOrgType> {
  return {
    ...state,
    [space.metadata.guid]: {
      ...space,
      entity: {
        ...space.entity,
        space_quota_definition: spaceQuota,
        space_quota_definition_guid: spaceQuota.metadata.guid,
        space_quota_definition_url: spaceQuota.metadata.url
      },
    },
  };
}

function removeSpaceQuota(
  state: IRequestEntityTypeState<entityOrgType>,
  space: entityOrgType
): IRequestEntityTypeState<entityOrgType> {
  return {
    ...state,
    [space.metadata.guid]: {
      ...space,
      entity: {
        ...space.entity,
        space_quota_definition: undefined,
        space_quota_definition_guid: null,
        space_quota_definition_url: undefined
      },
    },
  };
}
