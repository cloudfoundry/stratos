import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './api.actions';
import { APIAction } from '../types/api.types';

export const GET_ALL = '[Space] Get all';
export const GET_ALL_SUCCESS = '[Space] Get all success';
export const GET_ALL_FAILED = '[Space] Get all failed';

export const SpaceSchema = new schema.Entity('space', {}, {
  idAttribute: getAPIResourceGuid
});

export class GetAllSpaces implements APIAction {
  constructor(public paginationKey?: string) {
    this.options = new RequestOptions();
    this.options.url = 'space';
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
  entity = [SpaceSchema];
  entityKey = SpaceSchema.key;
  options: RequestOptions;
}
