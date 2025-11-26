import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllFeatureFlags } from '../actions/feature-flags.actions';

export interface FeatureFlagActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid: string,
    paginationKey?: string,
  ) => GetAllFeatureFlags;
}

export const featureFlagActionBuilders: FeatureFlagActionBuilders = {
  getMultiple: (
    endpointGuid: string,
    paginationKey?: string,
  ) => new GetAllFeatureFlags(endpointGuid, paginationKey)
};
