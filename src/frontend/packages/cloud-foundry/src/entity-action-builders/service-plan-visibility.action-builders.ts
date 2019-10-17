import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetServicePlanVisibilities } from '../actions/service-plan-visibility.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export const servicePlanVisibilityActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServicePlanVisibilities(endpointGuid, paginationKey, includeRelations, populateMissing)
} as OrchestratedActionBuilders;
