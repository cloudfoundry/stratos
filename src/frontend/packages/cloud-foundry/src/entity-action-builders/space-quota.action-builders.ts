import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetOrganizationSpaceQuotaDefinitions } from '../actions/quota-definitions.actions';

export interface SpaceQuotaDefinitionActionBuilders extends OrchestratedActionBuilders {
  getAllInOrganization: (
    orgGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => GetOrganizationSpaceQuotaDefinitions;
}

export const spaceQuotaDefinitionActionBuilders: SpaceQuotaDefinitionActionBuilders = {
  getAllInOrganization: (
    orgGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations: string[] = [],
    populateMissing = false,
  ) => new GetOrganizationSpaceQuotaDefinitions(
    paginationKey,
    orgGuid,
    endpointGuid,
    includeRelations,
    populateMissing
  )
};
