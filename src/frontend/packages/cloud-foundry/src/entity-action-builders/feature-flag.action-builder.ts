import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAllFeatureFlags } from '../actions/feature-flags.actions';

export const featureFlagActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
  ) => new GetAllFeatureFlags(endpointGuid, paginationKey)
} as OrchestratedActionBuilders;
