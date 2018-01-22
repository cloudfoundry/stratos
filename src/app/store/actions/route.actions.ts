import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, IRequestAction, ICFAction } from '../types/request.types';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';
import { getPaginationKey } from './pagination.actions';

export const CREATE_ROUTE = '[Route] Create start';
export const CREATE_ROUTE_SUCCESS = '[Route] Create success';
export const CREATE_ROUTE_ERROR = '[Route] Create error';

export const RouteEvents = {
  GET_ALL: '[Application Routes] Get all',
  GET_ALL_SUCCESS: '[Application Routes] Get all success',
  GET_ALL_FAILED: '[Application Routes] Get all failed',
  DELETE: '[Application Routes] Delete',
  DELETE_SUCCESS: '[Application Routes] Delete success',
  DELETE_FAILED: '[Application Routes] Delete failed',
  UNMAP_ROUTE: '[Application Routes] Unmap route',
  UNMAP_ROUTE_SUCCESS: '[Application Routes] Unmap route success',
  UNMAP_ROUTE_FAILED: '[Application Routes] Unmap route failed',
};

export const RouteSchema = new schema.Entity('route', {}, {
  idAttribute: getAPIResourceGuid
});

export interface NewRoute {
  domain_guid: string;
  space_guid: string;
  host?: string;
}

export class CreateRoute extends CFStartAction implements ICFAction {
  constructor(public guid: string, public cfGuid: string, route: NewRoute) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'routes';
    this.options.method = 'post';
    this.options.body = {
      generate_port: true,
      ...route
    };
  }
  actions = [
    CREATE_ROUTE,
    CREATE_ROUTE_SUCCESS,
    CREATE_ROUTE_ERROR
  ];
  entity = [RouteSchema];
  entityKey = RouteSchema.key;
  options: RequestOptions;
}

export class DeleteRoute extends CFStartAction implements ICFAction {
  constructor(
    public routeGuid: string,
    public cfGuid: string,
    public async: boolean = false,
    public recursive: boolean = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `routes/${routeGuid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.append('recursive', recursive ? 'true' : 'false');
    this.options.params.append('async', async ? 'true' : 'false');
  }
  actions = [
    RouteEvents.DELETE,
    RouteEvents.DELETE_SUCCESS,
    RouteEvents.DELETE_FAILED,
  ];
  entity = [RouteSchema];
  entityKey = RouteSchema.key;
  options: RequestOptions;

}


export class UnmapRoute extends CFStartAction implements ICFAction {
  constructor(
    public routeGuid: string,
    public appGuid: string,
    public cfGuid: string
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `routes/${routeGuid}/apps/${appGuid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
  }
  actions = [
    RouteEvents.UNMAP_ROUTE,
    RouteEvents.UNMAP_ROUTE_SUCCESS,
    RouteEvents.UNMAP_ROUTE_FAILED,
  ];
  entity = [RouteSchema];
  entityKey = RouteSchema.key;
  options: RequestOptions;

}

export class CheckRouteExists extends CFStartAction implements ICFAction {
  constructor(public guid: string, public cfGuid: string, route: NewRoute) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'routes';
    this.options.method = 'post';
    this.options.body = {
      generate_port: true,
      ...route
    };
  }
  actions = [
    CREATE_ROUTE,
    CREATE_ROUTE_SUCCESS,
    CREATE_ROUTE_ERROR
  ];
  entity = [RouteSchema];
  entityKey = RouteSchema.key;
  options: RequestOptions;
}

export class GetRoutes extends CFStartAction implements PaginatedAction {
  constructor(
    public guid: string,
    public cfGuid: string,
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `apps/${guid}/routes`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.options.params.append('', '');
    this.paginationKey = getPaginationKey(this.entityKey, cfGuid, guid);

  }
  actions = [
    RouteEvents.GET_ALL,
    RouteEvents.GET_ALL_SUCCESS,
    RouteEvents.GET_ALL_FAILED,
  ];
  paginationKey: string;
  entity = [RouteSchema];
  entityKey = RouteSchema.key;
  options: RequestOptions;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'host',
    'inline-relations-depth': '2'
  };
}
