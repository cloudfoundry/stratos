import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetServiceBroker, GetServiceBrokers } from '../actions/service-broker.actions';
import type { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface ServiceBrokerActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetServiceBroker;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetServiceBrokers;
}

export const serviceBrokerActionBuilders: ServiceBrokerActionBuilders = {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServiceBroker(
    guid,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServiceBrokers(endpointGuid, paginationKey, includeRelations, populateMissing)
};
