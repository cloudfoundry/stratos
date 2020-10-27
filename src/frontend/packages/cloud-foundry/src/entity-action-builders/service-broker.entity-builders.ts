import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetServiceBroker, GetServiceBrokers } from '../actions/service-broker.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface ServiceBrokerActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetServiceBroker;
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetServiceBrokers;
}

export const serviceBrokerActionBuilders: ServiceBrokerActionBuilders = {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServiceBroker(
    guid,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServiceBrokers(endpointGuid, paginationKey, includeRelations, populateMissing)
};
