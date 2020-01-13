import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppRoutes } from '../actions/application-service-routes.actions';
import { CreateRoute, DeleteRoute, GetAllRoutes, NewRoute, UnmapRoute } from '../actions/route.actions';
import { GetSpaceRoutes } from '../actions/space.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

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
  getMultiple: (
    endpointGuid,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
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
  ),
  getAllInSpace: (
    spaceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[],
    populateMissing?: boolean,
    flattenPagination?: boolean

  ) => new GetSpaceRoutes(
    spaceGuid,
    endpointGuid,
    paginationKey,
    includeRelations,
    populateMissing,
    flattenPagination
  )
} as OrchestratedActionBuilders;
