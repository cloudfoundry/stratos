import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllAppEvents } from '../actions/app-event.actions';

export const applicationEventActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
    { applicationGuid }: { applicationGuid: string },
  ) => new GetAllAppEvents(paginationKey, endpointGuid, applicationGuid)
} as OrchestratedActionBuilders;
