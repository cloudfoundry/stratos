import { HttpParams, HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction, PaginationParam } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { applicationEntityType, domainEntityType, routeEntityType, spaceEntityType } from '../cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export const CREATE_ROUTE = '[Route] Create start';
export const CREATE_ROUTE_SUCCESS = '[Route] Create success';
export const CREATE_ROUTE_ERROR = '[Route] Create error';

export const MAP_ROUTE_SELECTED = '[Map Route] Selected route';
export const RouteEvents = {
  GET_SPACE_ALL: '[Space Routes] Get all',
  GET_SPACE_ALL_SUCCESS: '[Space Routes] Get all success',
  GET_SPACE_ALL_FAILED: '[Space Routes] Get all failed',
  DELETE: '[Application Routes] Delete',
  DELETE_SUCCESS: '[Application Routes] Delete success',
  DELETE_FAILED: '[Application Routes] Delete failed',
};

export interface NewRoute {
  domain_guid: string;
  space_guid: string;
  host?: string;
  port?: number;
  path?: string;
}

export abstract class BaseRouteAction extends CFStartAction implements ICFAction {
  endpointType = 'cf';
  actions!: string[];
  entity = [cfEntityFactory(routeEntityType)];
  entityType = routeEntityType;
  options!: HttpRequest<any>;
  constructor(public guid: string, public endpointGuid: string, public appGuid?: string) {
    super();
  }
}

export class CreateRoute extends BaseRouteAction {
  constructor(guid: string, endpointGuid: string, route: NewRoute) {
    super(guid, endpointGuid);
    const generatePort = (!route.host && route.port) && route.port === -1;
    this.options = new HttpRequest<any>(
      'POST',
      'routes',
      {
        ...route,
        port: generatePort ? undefined : route.port
      }, {
      params: new HttpParams(generatePort ? {
        fromObject: { generate_port: 'true' }
      } : {})
    }
    );
  }
  actions = [CREATE_ROUTE, CREATE_ROUTE_SUCCESS, CREATE_ROUTE_ERROR];
}

export class DeleteRoute extends BaseRouteAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    appGuid?: string,
    public appGuids?: string[],
    public async: boolean = false,
    public recursive: boolean = true
  ) {
    super(guid, endpointGuid, appGuid);
    this.options = new HttpRequest(
      'DELETE',
      `routes/${guid}`,
      {
        params: new HttpParams({
          fromObject: {
            recursive: recursive ? 'true' : 'false',
            async: async ? 'true' : 'false'
          }
        })
      }
    );
  }
  actions = [
    RouteEvents.DELETE,
    RouteEvents.DELETE_SUCCESS,
    RouteEvents.DELETE_FAILED
  ];
  removeEntityOnDelete = true;
}

export class GetAllRoutes extends CFStartAction implements PaginatedAction, EntityInlineParentAction, ICFAction {
  endpointType = 'cf';
  paginationKey: string;
  constructor(
    public endpointGuid: string,
    pKey?: string,
    public includeRelations = [
      createEntityRelationKey(routeEntityType, applicationEntityType),
      createEntityRelationKey(routeEntityType, domainEntityType),
      createEntityRelationKey(routeEntityType, spaceEntityType),
    ],
    public populateMissing = true
  ) {
    super();
    // V3-native: drives the absolute /pp/v1/cf/routes/{cnsi} handler in
    // native_handlers.go (getNativeRouteCount), bypassing the v2 proxy. The
    // backend returns the flat StRoutesResponse{resources,totalResults}
    // envelope (no `pagination` block), so the route entity uses a custom
    // paginationConfig in cf-entity-generator.ts that reads totalResults
    // off the flat envelope. Field renames in v3EntitiesFromResponse alias
    // domainGuid→domain_guid, spaceGuid→space_guid, url→domain_url so V2
    // consumers continue to read snake_case keys.
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/routes/${endpointGuid}`
    );
    this.paginationKey = pKey || createEntityRelationPaginationKey('cf', this.endpointGuid);
  }
  entity = [cfEntityFactory(routeEntityType)];
  entityType = routeEntityType;
  options: HttpRequest<any>;
  actions = getActions('Routes', 'Fetch all');
  initialParams: PaginationParam = {
    'results-per-page': 100,
    page: 1,
    'order-direction': 'desc',
    'order-direction-field': 'route',
  };
  flattenPaginationMax = true;
  flattenPagination = true;
}
