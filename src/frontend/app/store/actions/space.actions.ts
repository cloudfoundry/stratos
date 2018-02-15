import { RequestOptions } from '@angular/http';

import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { SpaceSchema, spaceSchemaKey } from './action-types';
import { SpaceWithOrganisationSchema } from './organisation.actions';

export const GET_SPACES = '[Space] Get all';
export const GET_SPACES_SUCCESS = '[Space] Get all success';
export const GET_SPACES_FAILED = '[Space] Get all failed';

export const GET_SPACE = '[Space] Get one';
export const GET_SPACE_SUCCESS = '[Space] Get one success';
export const GET_SPACE_FAILED = '[Space] Get one failed';

export class GetSpace extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `space/${guid}`;
    this.options.method = 'get';
  }
  actions = [
    GET_SPACE,
    GET_SPACE_SUCCESS,
    GET_SPACE_FAILED
  ];
  entity = [SpaceSchema];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
}

export class GetAllSpaces extends CFStartAction implements PaginatedAction {
  constructor(public paginationKey: string, public cnsi?: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'spaces';
    this.options.method = 'get';
  }
  actions = [GET_SPACES, GET_SPACES_SUCCESS, GET_SPACES_FAILED];
  entity = [SpaceWithOrganisationSchema];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  flattenPagination = true;
  initialParams = {
    'results-per-page': 100,
    'inline-relations-depth': '1'
  };
}
