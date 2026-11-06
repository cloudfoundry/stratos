import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { FetchAllBuildpacks } from '../actions/buildpack.action';

export interface BuildpackActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
  ) => FetchAllBuildpacks;
}

export const buildpackActionBuilders: BuildpackActionBuilders = {
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
  ) => new FetchAllBuildpacks(endpointGuid, paginationKey)
};
