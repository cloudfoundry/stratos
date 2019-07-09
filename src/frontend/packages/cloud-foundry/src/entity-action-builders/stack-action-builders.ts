import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllOrgUsers } from '../actions/organization.actions';
import { GetAllSpaceUsers } from '../actions/space.actions';
import { GetStack, GetAllStacks } from '../actions/stack.action';

export const stackActionBuilders = {
  get: (
    guid: string,
    endpointGuid: string,
  ) => new GetStack(guid, endpointGuid),
  getAll: (
    endpointGuid: string,
  ) => new GetAllStacks(endpointGuid),

} as OrchestratedActionBuilders;
