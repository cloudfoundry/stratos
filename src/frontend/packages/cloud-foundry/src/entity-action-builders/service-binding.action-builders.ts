import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAppServiceBindings } from '../actions/application-service-routes.actions';

export const serviceBindingActionBuilders = {
  getAllForApplication: (
    applicationGuid: string,
    endpointGuid: string,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetAppServiceBindings(applicationGuid, endpointGuid, paginationKey, includeRelations, populateMissing)
} as OrchestratedActionBuilders;


