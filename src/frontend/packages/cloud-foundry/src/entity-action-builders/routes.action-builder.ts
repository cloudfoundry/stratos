import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppRoutes } from '../actions/application-service-routes.actions';
import { CreateRoute, DeleteRoute, GetAllRoutes, type NewRoute, UnmapRoute } from '../actions/route.actions';
import { GetSpaceRoutes } from '../actions/space.actions';
import type { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface RoutesActionBuilders extends OrchestratedActionBuilders {
  create: (id: string, endpointGuid: string, extraArgs?: Record<string, unknown>) => CreateRoute;
  delete: (
    guid: string,
    endpointGuid: string,
    appGuid?: string,
    appGuids?: string[],
    async?: boolean,
    recursive?: boolean
  ) => DeleteRoute;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    extraArgs?: Record<string, unknown>
  ) => GetAllRoutes;
  unmap: (
    guid: string,
    appGuid: string,
    endpointGuid: string,
    clearPaginationKey?: string
  ) => UnmapRoute;
  getAllForApplication: (
    applicationGuid: string,
    endpointGuid: string,
    paginationKey?: string,
    includeRelations?: string[]
  ) => GetAppRoutes;
  getAllInSpace: (
    spaceGuid: string,
    endpointGuid: string,
    paginationKey: string,
    includeRelations?: string[],
    populateMissing?: boolean,
    flattenPagination?: boolean
  ) => GetSpaceRoutes;
}

export const routesActionBuilders: RoutesActionBuilders = {
  create: (id: string, endpointGuid: string, route?: Record<string, unknown>) => new CreateRoute(
    id,
    endpointGuid,
    route as NewRoute
  ),
  delete: (
    guid: string,
    endpointGuid: string,
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
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllRoutes(endpointGuid, paginationKey, includeRelations, populateMissing),
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
};
