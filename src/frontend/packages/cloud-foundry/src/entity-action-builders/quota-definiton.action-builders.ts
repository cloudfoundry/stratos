import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetQuotaDefinitions } from '../actions/quota-definitions.actions';

export const quotaDefinitionActionBuilders = {
  getAll: (
    endpointGuid,
    paginationKey,
    includeRelations: string[] = [],
    populateMissing = false,
  ) => new GetQuotaDefinitions(paginationKey, endpointGuid, includeRelations, populateMissing)
} as OrchestratedActionBuilders;
