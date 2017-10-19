import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { APIAction, ApiActionTypes, getAPIResourceGuid } from './api.actions';
import { SpaceSchema } from './space.actions';
import { PaginatedAction, PaginationAction } from '../reducers/pagination.reducer';

export const GET_ALL = '[Organization] Get all';
export const GET_ALL_SUCCESS = '[Organization] Get all success';
export const GET_ALL_FAILED = '[Organization] Get all failed';

export const OrganizationSchema = new schema.Entity('organization', {
  entity: {
    spaces: [SpaceSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export class GetAllOrganizations implements PaginatedAction {
  constructor(public paginationKey: string) {
    this.options = new RequestOptions();
    this.options.url = 'organizations';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.options.params.set('page', '1');
    this.options.params.set('results-per-page', '100');
    this.options.params.set('inline-relations-depth', '1');
  }
  actions = [
    GET_ALL,
    GET_ALL_SUCCESS,
    GET_ALL_FAILED
  ];
  type = ApiActionTypes.API_REQUEST;
  entity = [OrganizationSchema];
  entityKey = OrganizationSchema.key;
  options: RequestOptions;
  initialParams: {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 1
  };
}
