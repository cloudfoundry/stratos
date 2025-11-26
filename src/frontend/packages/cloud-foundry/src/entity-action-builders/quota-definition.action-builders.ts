import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  CreateQuotaDefinition,
  GetQuotaDefinition,
  GetQuotaDefinitions,
  UpdateQuotaDefinition,
} from '../actions/quota-definitions.actions';
import type { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';
import type { QuotaFormValues } from '../features/cf/quota-definition-form/quota-definition-form.component';

export interface QuotaDefinitionActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    extraArgs?: Record<string, unknown>
  ) => GetQuotaDefinition;
  create: (
    id: string,
    endpointGuid: string,
    extraArgs?: Record<string, unknown>
  ) => CreateQuotaDefinition;
  update: (
    guid: string,
    endpointGuid: string,
    extraArgs?: Record<string, unknown>
  ) => UpdateQuotaDefinition;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    extraArgs?: Record<string, unknown>
  ) => GetQuotaDefinitions;
}

export const quotaDefinitionActionBuilder: QuotaDefinitionActionBuilder = {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetQuotaDefinition(guid, endpointGuid, includeRelations, populateMissing),
  create: (
    id: string,
    endpointGuid: string,
    createQuota?: QuotaFormValues | Record<string, unknown>
  ) => new CreateQuotaDefinition(id, endpointGuid, createQuota as QuotaFormValues),
  update: (
    guid: string,
    endpointGuid: string,
    updateQuota?: QuotaFormValues | Record<string, unknown>
  ) => new UpdateQuotaDefinition(guid, endpointGuid, updateQuota as QuotaFormValues),
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetQuotaDefinitions(paginationKey, endpointGuid, includeRelations, populateMissing),
};

