import { IRequestEntityTypeState } from '../../../../store/src/app-state';
import { APIResource, NormalizedResponse } from '../../../../store/src/types/api.types';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { IOrganization } from '../../cf-api.types';
import { getCFEntityKey } from '../../cf-entity-helpers';

type entityOrgType = APIResource<IOrganization<string>>;
export function updateOrganizationQuotaReducer(
  state: IRequestEntityTypeState<entityOrgType>,
  action: APISuccessOrFailedAction<NormalizedResponse>
) {
  switch (action.type) {
    // TODO: This action type is not strictly defined anywhere
    case '[Organizations] Update Org success':
      const response = action.response;
      const entityKey = getCFEntityKey(action.apiAction.entityType);
      const newOrg = response.entities[entityKey][response.result[0]];
      const quotaDefinitionGuid = newOrg.entity.quota_definition_guid;
      const org = state[newOrg.metadata.guid];
      return applyQuotaDefinition(state, org, quotaDefinitionGuid);
  }
  return state;
}

function applyQuotaDefinition(
  state: IRequestEntityTypeState<entityOrgType>,
  org: entityOrgType,
  quotaDefinitionGuid: string
): IRequestEntityTypeState<entityOrgType> {
  return {
    ...state,
    [org.metadata.guid]: {
      ...org,
      entity: {
        ...org.entity,
        quota_definition: quotaDefinitionGuid
      },
    },
  };
}
