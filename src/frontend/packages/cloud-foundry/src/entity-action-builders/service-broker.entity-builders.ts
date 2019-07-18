import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetServiceBroker, GetServiceBrokers } from '../actions/service-broker.actions';

export const serviceBrokerActionBuilders = {
  get: (
    guid,
    endpointGuid,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => new GetServiceBroker(
    guid,
    endpointGuid,
    includeRelations,
    populateMissing
  ),
  getAll: (
    endpointGuid,
    paginationKey,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => new GetServiceBrokers(endpointGuid, paginationKey, includeRelations, populateMissing)
} as OrchestratedActionBuilders;
