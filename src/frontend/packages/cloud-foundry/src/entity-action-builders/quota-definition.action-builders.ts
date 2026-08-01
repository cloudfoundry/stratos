import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetQuotaDefinition, GetQuotaDefinitions } from '../actions/quota-definitions.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface QuotaDefinitionActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetQuotaDefinition;
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    meta?: CFBasePipelineRequestActionMeta
  ) => GetQuotaDefinitions;
}

export const quotaDefinitionActionBuilder: QuotaDefinitionActionBuilder = {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetQuotaDefinition(guid, endpointGuid, includeRelations, populateMissing),
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetQuotaDefinitions(paginationKey, endpointGuid, includeRelations, populateMissing),
};
