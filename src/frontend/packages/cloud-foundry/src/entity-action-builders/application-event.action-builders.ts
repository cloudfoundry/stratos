import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllAppEvents } from '../actions/app-event.actions';

export const applicationEventActionBuilders = {
  getAll: (
    endpointGuid,
    paginationKey,
    applicationGuid,
  ) => new GetAllAppEvents(paginationKey, endpointGuid, applicationGuid)
} as OrchestratedActionBuilders;
