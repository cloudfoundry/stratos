import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllCfEvents } from '../actions/cf-event.actions';

export interface CfEventActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
  ) => GetAllCfEvents;
}

export const cfEventActionBuilders: CfEventActionBuilders = {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
  ) => new GetAllCfEvents(paginationKey, endpointGuid)
};
