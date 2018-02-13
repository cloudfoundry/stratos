import { CFStartAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';
import { SpaceSchema } from './space.actions';
import { PaginatedAction } from '../types/pagination.types';

export const GET_ALL = '[Users] Get all';
export const GET_ALL_SUCCESS = '[Users] Get all success';
export const GET_ALL_FAILED = '[Users] Get all failed';

export const UserSchema = new schema.Entity(
  'user',
  {},
  {
    idAttribute: getAPIResourceGuid
  }
);

export class GetAllUsers extends CFStartAction implements PaginatedAction {
  constructor(public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'users';
    this.options.method = 'get';
  }
  actions = [GET_ALL, GET_ALL_SUCCESS, GET_ALL_FAILED];
  entity = [UserSchema];
  entityKey = UserSchema.key;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 1
  };
}
