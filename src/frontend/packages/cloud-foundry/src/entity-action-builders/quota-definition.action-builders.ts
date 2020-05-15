import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  CreateQuotaDefinition,
  GetQuotaDefinition,
  GetQuotaDefinitions,
  UpdateQuotaDefinition,
} from '../actions/quota-definitions.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';
import { QuotaFormValues } from '../features/cloud-foundry/quota-definition-form/quota-definition-form.component';

export interface QuotaDefinitionActionBuilder extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetQuotaDefinition;
  create: (
    id: string,
    endpointGuid: string,
    createQuota: QuotaFormValues
  ) => CreateQuotaDefinition;
  update: (
    guid: string,
    endpointGuid: string,
    updateQuota: QuotaFormValues
  ) => UpdateQuotaDefinition;
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetQuotaDefinitions;
}

export const quotaDefinitionActionBuilder: QuotaDefinitionActionBuilder = {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => new GetQuotaDefinition(guid, endpointGuid, includeRelations, populateMissing),
  create: (
    id: string,
    endpointGuid: string,
    createQuota: QuotaFormValues
  ) => new CreateQuotaDefinition(id, endpointGuid, createQuota),
  update: (
    guid: string,
    endpointGuid: string,
    updateQuota: QuotaFormValues
  ) => new UpdateQuotaDefinition(guid, endpointGuid, updateQuota),
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetQuotaDefinitions(paginationKey, endpointGuid, includeRelations, populateMissing),
};

