import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { FetchAllBuildpacks } from '../actions/buildpack.action';

export interface BuildpackActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid,
    paginationKey,
  ) => FetchAllBuildpacks;
}

export const buildpackActionBuilders: BuildpackActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
  ) => new FetchAllBuildpacks(endpointGuid, paginationKey)
};
