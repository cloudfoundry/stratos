import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { FetchAllBuildpacks } from '../actions/buildpack.action';

export const buildpackActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
  ) => new FetchAllBuildpacks(endpointGuid, paginationKey)
} as OrchestratedActionBuilders;


