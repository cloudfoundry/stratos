import { ISpace } from '../../../core/src/core/cf-api.types';
import { IRequestEntityTypeState } from '../app-state';
import { spaceQuotaSchemaKey } from '../helpers/entity-factory';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';
import { ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS, AssociateSpaceQuota } from '../actions/quota-definitions.actions';

type entityOrgType = APIResource<ISpace>;
export function updateSpaceQuotaReducer(
  state: IRequestEntityTypeState<any>,
  action: APISuccessOrFailedAction<NormalizedResponse>
) {
  switch (action.type) {
    case ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS:
      const associateAction = action.apiAction as AssociateSpaceQuota;
      const response = action.response;
      const newSpaceQuota = response.entities[spaceQuotaSchemaKey][response.result[0]];
      const space = state[associateAction.spaceGuid];

      return applySpaceQuota(state, space, newSpaceQuota.metadata.guid);
  }
  return state;
}

function applySpaceQuota(
  state: IRequestEntityTypeState<entityOrgType>,
  space: entityOrgType,
  spaceQuotaGuid: string
) {
  return {
    ...state,
    [space.metadata.guid]: {
      ...space,
      entity: {
        ...space.entity,
        space_quota_definition: spaceQuotaGuid
      },
    },
  };
}
