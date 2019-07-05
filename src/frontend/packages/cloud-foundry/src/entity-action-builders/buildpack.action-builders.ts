import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { FetchAllBuildpacks } from '../actions/buildpack.action';

export const buildpackActionBuilders = {
  getAll: (
    endpointGuid,
    paginationKey,
  ) => new FetchAllBuildpacks(endpointGuid, paginationKey)
} as OrchestratedActionBuilders;


