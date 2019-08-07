import { StratosOrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAllFeatureFlags } from '../actions/feature-flags.actions';

export const featureFlagActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
  ) => new GetAllFeatureFlags(endpointGuid, paginationKey)
} as StratosOrchestratedActionBuilders;
