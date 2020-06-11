import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllFeatureFlags } from '../actions/feature-flags.actions';

export interface FeatureFlagActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid,
    paginationKey?,
  ) => GetAllFeatureFlags;
};

export const featureFlagActionBuilders: FeatureFlagActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey?,
  ) => new GetAllFeatureFlags(endpointGuid, paginationKey)
};
