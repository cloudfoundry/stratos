import { RequestOptions, URLSearchParams } from '@angular/http';

import { CFStartAction, ICFAction } from '../types/request.types';
import { SpaceSchema, spaceSchemaKey, SpaceWithOrganisationSchema } from './action-types';
import { getActions } from './action.helper';
import { PaginationAction } from '../types/pagination.types';
import { ApplicationSchema } from './application.actions';

export const GET_SPACES = '[Space] Get all';
export const GET_SPACES_SUCCESS = '[Space] Get all success';
export const GET_SPACES_FAILED = '[Space] Get all failed';

export const GET_SPACE = '[Space] Get one';
export const GET_SPACE_SUCCESS = '[Space] Get one success';
export const GET_SPACE_FAILED = '[Space] Get one failed';

export class GetSpace extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string, private withInlineDepth: number) {
    super();
    this.options = new RequestOptions();
    this.options.url = `space/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    if (withInlineDepth !== 0) {
      this.options.params.append('inline-relations-depth', '' + withInlineDepth);
    }
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

export class GetAllSpaces extends CFStartAction implements ICFAction {
  constructor(public paginationKey?: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'spaces';
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

export class GetAllAppsInSpace extends CFStartAction implements PaginationAction {
  constructor(public cfGuid: string, public spaceGuid: string, public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/apps`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Spaces', 'Get Apps');
  entity = [ApplicationSchema];
  entityKey = ApplicationSchema.key;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 2
  };
}



export class DeleteSpace extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.append('recursive', 'true');
    this.options.params.append('async', 'false');
  }
  actions = getActions('Spaces', 'Delete Space');
  entity = [SpaceSchema];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
}
