import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetServiceBrokers, GetServiceBroker } from '../actions/service-broker.actions';

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
  // TODO: This is good reason to remove pagination key
  getAll: (
    endpointGuid,
    paginationKey,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => new GetServiceBrokers(endpointGuid, paginationKey, includeRelations, populateMissing)
} as OrchestratedActionBuilders;
