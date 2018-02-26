import { RequestOptions } from '@angular/http';
import { schema } from 'normalizr';

import { pathGet } from '../../core/utils.service';
import {
  EntityInlineChild,
  EntityInlineChildAction,
  EntityInlineParentAction,
  EntityRelation,
} from '../helpers/entity-relations.helpers';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { RouteEvents } from './route.actions';
import { entityFactory } from '../helpers/entity-factory';
import { spaceSchemaKey, spaceWithOrgsEntitySchema, spaceWithOrgKey, routesInSpaceKey } from '../helpers/entity-factory';

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
  entity = [entityFactory(spaceSchemaKey)];
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
  entity = [entityFactory(spaceWithOrgKey)];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  initialParams = {
    'results-per-page': 100,
    'inline-relations-depth': '1'
  };
}

export class GetSpaceRoutes extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public spaceGuid: string,
    public cfGuid: string,
    public paginationKey: string,
    public includeRelations = [],
    public populateMissing = false
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/routes`;
    this.options.method = 'get';
    this.endpointGuid = cfGuid;
    this.parentGuid = spaceGuid;
  }
  actions = [
    RouteEvents.GET_SPACE_ALL,
    RouteEvents.GET_SPACE_ALL_SUCCESS,
    RouteEvents.GET_SPACE_ALL_FAILED
  ];
  initialParams = {
    'results-per-page': 100,
    'inline-relations-depth': '1',
    page: 1,
    'order-direction': 'desc',
    'order-direction-field': 'attachedApps',
  };
  parentGuid: string;
  entity = entityFactory<EntityInlineChild>(routesInSpaceKey);
  entityKey = routesInSpaceKey;
  options: RequestOptions;
  endpointGuid: string;
  flattenPagination = true;
}
