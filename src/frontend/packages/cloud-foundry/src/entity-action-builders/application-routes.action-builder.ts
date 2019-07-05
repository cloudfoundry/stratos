import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAppRoutes } from '../actions/application-service-routes.actions';
// TODO Can these be added or proxied to the application entity?
export const appRoutesActionBuilders = {
  getAll: (endpointGuid, paginationKey, applicationGuid: string, includeRelations: string[]) => new GetAppRoutes(
    applicationGuid,
    endpointGuid,
    paginationKey,
    includeRelations
  )
} as OrchestratedActionBuilders;
