import { GetAllStacks, GetStack } from '../actions/stack.action';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';

export interface StackActionBuilders extends CFOrchestratedActionBuilders {
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
