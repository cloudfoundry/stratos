import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllAppEvents } from '../actions/app-event.actions';

export interface ApplicationEventActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { applicationGuid }: { applicationGuid: string },
  ) => GetAllAppEvents;
}

export const applicationEventActionBuilders: ApplicationEventActionBuilders = {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { applicationGuid }: { applicationGuid: string },
  ) => new GetAllAppEvents(paginationKey, applicationGuid, endpointGuid)
};
