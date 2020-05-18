import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetServicePlansForService } from '../actions/service.actions';

export interface ServicePlanActionBuilders extends OrchestratedActionBuilders {
  getAllForServiceInstance: (
    serviceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[]
  ) => GetServicePlansForService
};

export const servicePlanActionBuilders: ServicePlanActionBuilders = {
  getAllForServiceInstance: (
    serviceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[]
  ) => new GetServicePlansForService(
    serviceGuid,
    endpointGuid,
    paginationKey,
    includeRelations
  )
};
