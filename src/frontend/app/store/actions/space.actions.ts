import { RequestOptions, URLSearchParams } from '@angular/http';

import { CFStartAction, ICFAction } from '../types/request.types';
import {
  SpaceSchema,
  spaceSchemaKey,
  SpaceWithOrganisationSchema
} from './action-types';

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
  actions = [GET_SPACE, GET_SPACE_SUCCESS, GET_SPACE_FAILED];
  entity = [SpaceSchema];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
}

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
  actions = [GET_SPACES, GET_SPACES_SUCCESS, GET_SPACES_FAILED];
  entity = [SpaceWithOrganisationSchema];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
}
