import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetServicePlanVisibilities } from '../actions/service-plan-visibility.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface ServicePlanVisibilityActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta
  ) => GetServicePlanVisibilities;
};

export const servicePlanVisibilityActionBuilders: ServicePlanVisibilityActionBuilders = {
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetServicePlanVisibilities(endpointGuid, paginationKey, includeRelations, populateMissing)
};
