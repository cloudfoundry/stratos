import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetServiceBroker, GetServiceBrokers } from '../actions/service-broker.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export const serviceBrokerActionBuilders = {
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
} as OrchestratedActionBuilders;
