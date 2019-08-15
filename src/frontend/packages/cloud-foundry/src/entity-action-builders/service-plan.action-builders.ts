import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetServicePlansForService } from '../actions/service.actions';

export const servicePlanActionBuilders = {
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
} as OrchestratedActionBuilders;
