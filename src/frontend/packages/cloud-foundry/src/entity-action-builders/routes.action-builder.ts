import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAppRoutes } from '../actions/application-service-routes.actions';
import { CreateRoute, NewRoute, DeleteRoute, UnmapRoute, GetAllRoutes } from '../actions/route.actions';

export const routesActionBuilders = {
  create: (id, endpointGuid, route: NewRoute) => new CreateRoute(
    id,
    endpointGuid,
    route
  ),
  delete: (
    guid,
    endpointGuid,
    appGuid?: string,
    appGuids?: string[],
    async: boolean = false,
    recursive: boolean = true
  ) => new DeleteRoute(
    guid,
    endpointGuid,
    appGuid,
    appGuids,
    async,
    recursive
  ),
  getAll: (
    endpointGuid,
    paginationKey?: string,
    includeRelations?: string[],
    populateMissing?: boolean
  ) => new GetAllRoutes(endpointGuid, includeRelations, populateMissing),
  unmap: (
    guid: string,
    appGuid: string,
    endpointGuid: string,
    clearPaginationKey?: string
  ) => new UnmapRoute(
    guid,
    appGuid,
    endpointGuid,
    clearPaginationKey
  ),
  getAllForApplication: (
    applicationGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations: string[]
  ) => new GetAppRoutes(
    applicationGuid,
    endpointGuid,
    paginationKey,
    includeRelations
  )
} as OrchestratedActionBuilders;
