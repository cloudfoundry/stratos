import { CFStartAction, IRequestAction, ICFAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';

export const GET_ALL = '[Space] Get all';
export const GET_ALL_SUCCESS = '[Space] Get all success';
export const GET_ALL_FAILED = '[Space] Get all failed';

export const SpaceSchema = new schema.Entity('space', {}, {
  idAttribute: getAPIResourceGuid
});

export class GetAllSpaces extends CFStartAction implements ICFAction {
  constructor(public paginationKey?: string) {
    super();
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
  entity = [SpaceSchema];
  entityKey = SpaceSchema.key;
  options: RequestOptions;
}
