import { StratosOrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetServicePlanVisibilities } from '../actions/service-plan-visibility.actions';

export const servicePlanVisibilityActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetServicePlanVisibilities(endpointGuid, paginationKey, includeRelations, populateMissing)
} as StratosOrchestratedActionBuilders;
