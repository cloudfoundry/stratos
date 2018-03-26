import { RequestOptions, URLSearchParams } from '@angular/http';
import { Action } from '@ngrx/store';

import { EntityInfo } from '../types/api.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { entityFactory } from '../helpers/entity-factory';
import { routeSchemaKey } from '../helpers/entity-factory';
import { schema } from 'normalizr';

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
}

export abstract class BaseRouteAction extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string, public appGuid?: string) {
    super();
  }
  actions: string[];
  entity = [entityFactory(routeSchemaKey)];
  entityKey = routeSchemaKey;
  options: RequestOptions;
}

export class CreateRoute extends BaseRouteAction {
  constructor(guid: string, endpointGuid: string, route: NewRoute) {
    super(guid, endpointGuid);
    this.options = new RequestOptions();
    this.options.url = 'routes';
    this.options.method = 'post';
    this.options.body = {
      generate_port: true,
      ...route
    };
  }
  actions = [CREATE_ROUTE, CREATE_ROUTE_SUCCESS, CREATE_ROUTE_ERROR];
}

export class DeleteRoute extends BaseRouteAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public async: boolean = false,
    public recursive: boolean = true,
    appGuid?: string
  ) {
    super(guid, endpointGuid, appGuid);
    this.options = new RequestOptions();
    this.options.url = `routes/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.append('recursive', recursive ? 'true' : 'false');
    this.options.params.append('async', async ? 'true' : 'false');
  }
  actions = [
    RouteEvents.DELETE,
    RouteEvents.DELETE_SUCCESS,
    RouteEvents.DELETE_FAILED
  ];
  removeEntityOnDelete = true;
}

export class UnmapRoute extends BaseRouteAction {
  constructor(
    public routeGuid: string,
    public appGuid: string,
    public endpointGuid: string
  ) {
    super(routeGuid, endpointGuid, appGuid);
    this.options = new RequestOptions();
    this.options.url = `routes/${routeGuid}/apps/${appGuid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
  }
  actions = [
    RouteEvents.UNMAP_ROUTE,
    RouteEvents.UNMAP_ROUTE_SUCCESS,
    RouteEvents.UNMAP_ROUTE_FAILED
  ];
  updatingKey = 'unmapping';
}

export class CheckRouteExists extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string, route: NewRoute) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'routes';
    this.options.method = 'post';
    this.options.body = {
      generate_port: true,
      ...route
    };
  }
  actions = [CREATE_ROUTE, CREATE_ROUTE_SUCCESS, CREATE_ROUTE_ERROR];
  entity = [entityFactory(routeSchemaKey)];
  entityKey = routeSchemaKey;
  options: RequestOptions;
}

export class MapRouteSelected implements Action {
  constructor(routeEntity: EntityInfo) { }
  type = MAP_ROUTE_SELECTED;
}
