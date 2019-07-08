import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllServices, GetService } from '../actions/service.actions';

export const serviceBrokerActionBuilders = {
  get: (
    guid,
    endpointGuid,
    includeRelations?: string[],
    populateMissing?: boolean,
  ) => new GetService(
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
  ) => new GetAllServices(paginationKey, endpointGuid, includeRelations, populateMissing)
} as OrchestratedActionBuilders;
