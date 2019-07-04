import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllAppEvents } from '../actions/app-event.actions';

export const applicationEventActionBuilders = {
  getAll: (
    paginationKey,
    endpointGuid,
    appGuid,
  ) => new GetAllAppEvents(paginationKey, endpointGuid, appGuid)
} as OrchestratedActionBuilders;


