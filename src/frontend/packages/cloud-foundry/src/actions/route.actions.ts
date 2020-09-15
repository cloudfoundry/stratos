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
  UNMAP_ROUTE: '[Application Routes] Unmap route',
  UNMAP_ROUTE_SUCCESS: '[Application Routes] Unmap route success',
  UNMAP_ROUTE_FAILED: '[Application Routes] Unmap route failed'
};

export interface NewRoute {
  domain_guid: string;
  space_guid: string;
  host?: string;
  port?: number;
  path?: string;
}

export abstract class BaseRouteAction extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string, public appGuid?: string) {
    super();
  }
  endpointType = 'cf';
  actions: string[];
  entity = [cfEntityFactory(routeEntityType)];
  entityType = routeEntityType;
  options: HttpRequest<any>;
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

export class UnmapRoute extends BaseRouteAction {
  /**
   * The key of the pagination section to remove the route from. Note, this should not be called `paginationKey`
   */
  constructor(
    public routeGuid: string,
    public appGuid: string,
    public endpointGuid: string,
    public clearPaginationKey?: string,
  ) {
    super(routeGuid, endpointGuid, appGuid);
    this.options = new HttpRequest(
      'DELETE',
      `routes/${routeGuid}/apps/${appGuid}`
    );
  }
  actions = [
    RouteEvents.UNMAP_ROUTE,
    RouteEvents.UNMAP_ROUTE_SUCCESS,
    RouteEvents.UNMAP_ROUTE_FAILED
  ];
  updatingKey = 'unmapping';
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
    this.options = new HttpRequest(
      'GET',
      'routes'
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
