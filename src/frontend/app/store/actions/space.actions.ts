import { RequestOptions, URLSearchParams } from '@angular/http';

import { IUpdateSpace } from '../../core/cf-api.types';
import {
  applicationSchemaKey,
  entityFactory,
  routeSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../helpers/entity-factory';
import { EntityInlineChildAction, EntityInlineParentAction } from '../helpers/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';
import { RouteEvents } from './route.actions';

export const GET_SPACES = '[Space] Get all';
export const GET_SPACES_SUCCESS = '[Space] Get all success';
export const GET_SPACES_FAILED = '[Space] Get all failed';

export const GET_SPACE = '[Space] Get one';
export const GET_SPACE_SUCCESS = '[Space] Get one success';
export const GET_SPACE_FAILED = '[Space] Get one failed';

export class GetSpace extends CFStartAction implements ICFAction, EntityInlineParentAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${guid}`;
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

export class GetAllSpaces extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid?: string,
    public includeRelations: string[] = [],
    public populateMissing = true,
  ) {
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
  };
}

export class GetSpaceRoutes extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public spaceGuid: string,
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations = [],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/routes`;
    this.options.method = 'get';
    this.parentGuid = spaceGuid;
  }
  actions = [
    RouteEvents.GET_SPACE_ALL,
    RouteEvents.GET_SPACE_ALL_SUCCESS,
    RouteEvents.GET_SPACE_ALL_FAILED
  ];
  initialParams = {
    'results-per-page': 100,
    page: 1,
    'order-direction': 'desc',
    'order-direction-field': 'attachedApps',
  };
  parentGuid: string;
  entity = entityFactory(routeSchemaKey);
  entityKey = routeSchemaKey;
  options: RequestOptions;
  flattenPagination = true;
  parentEntitySchema = entityFactory(spaceSchemaKey);
}

export class GetAllAppsInSpace extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public endpointGuid: string,
    public spaceGuid: string,
    public paginationKey: string,
    public includeRelations = [],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/apps`;
    this.options.method = 'get';
    this.parentGuid = spaceGuid;
  }
  actions = getActions('Spaces', 'Get Apps');
  entity = [entityFactory(applicationSchemaKey)];
  entityKey = applicationSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
  };
  parentGuid: string;
  parentEntitySchema = entityFactory(spaceSchemaKey);
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
  entity = [entityFactory(spaceSchemaKey)];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
}

export class CreateSpace extends CFStartAction implements ICFAction {
  constructor(public name: string, public orgGuid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces`;
    this.options.method = 'post';
    this.guid = `${orgGuid}-${name}`;
    this.options.body = {
      name: name,
      organization_guid: orgGuid
    };
  }
  actions = getActions('Spaces', 'Create Space');
  entity = [entityFactory(spaceSchemaKey)];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  guid: string;
}
export class UpdateSpace extends CFStartAction implements ICFAction {

  public static UpdateExistingSpace = 'Updating-Existing-Space';
  constructor(public guid: string, public endpointGuid: string, updateSpace: IUpdateSpace) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${guid}`;
    this.options.method = 'put';
    this.options.body = updateSpace;
  }
  actions = getActions('Spaces', 'Update Space');
  entity = [entityFactory(spaceSchemaKey)];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  updatingKey = UpdateSpace.UpdateExistingSpace;
}
