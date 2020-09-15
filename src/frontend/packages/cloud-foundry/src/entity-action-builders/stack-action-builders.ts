import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllStacks, GetStack } from '../actions/stack.action';

export interface StackActionBuilders extends OrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
  ) => GetStack;
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
  ) => GetAllStacks;
}

export const stackActionBuilders: StackActionBuilders = {
  get: (
    guid: string,
    endpointGuid: string,
  ) => new GetStack(guid, endpointGuid),
  getMultiple: (
    paginationKey: string,
    endpointGuid: string,
  ) => new GetAllStacks(endpointGuid),
};
