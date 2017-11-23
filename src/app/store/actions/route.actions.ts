import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';
import { APIAction } from '../types/api.types';

export const CREATE_ROUTE = '[Route] Create start';
export const CREATE_ROUTE_SUCCESS = '[Route] Create success';
export const CREATE_ROUTE_ERROR = '[Route] Create error';

export const RouteSchema = new schema.Entity('route', {}, {
  idAttribute: getAPIResourceGuid
});

export interface NewRoute {
  domain_guid: string;
  space_guid: string;
  host: string;
}

export class CreateRoute implements APIAction {
  constructor(public guid: string, public cnis: string, route: NewRoute) {
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
  type = ApiActionTypes.API_REQUEST;
  entity = [RouteSchema];
  entityKey = RouteSchema.key;
  options: RequestOptions;
}


export class CheckRouteExists implements APIAction {
  constructor(public guid: string, public cnis: string, route: NewRoute) {
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
  type = ApiActionTypes.API_REQUEST;
  entity = [RouteSchema];
  entityKey = RouteSchema.key;
  options: RequestOptions;
}
