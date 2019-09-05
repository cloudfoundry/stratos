import { RequestOptions, URLSearchParams } from '@angular/http';

import { IUpdateSpace } from '../../../core/src/core/cf-api.types';
import { getActions } from '../../../store/src/actions/action.helper';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { CFEntityConfig } from '../../cf-types';
import {
  applicationEntityType,
  cfEntityFactory,
  domainEntityType,
  routeEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
  servicePlanEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
} from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { GetAllOrgUsers } from './organization.actions';
import { RouteEvents } from './route.actions';
import { getServiceInstanceRelations } from './service-instances.actions';
import { QParam } from '../../../store/src/q-param';
import { EntityInlineParentAction, EntityInlineChildAction, createEntityRelationKey } from '../entity-relations/entity-relations.types';

export const GET_SPACES = '[Space] Get all';
export const GET_SPACES_SUCCESS = '[Space] Get all success';
export const GET_SPACES_FAILED = '[Space] Get all failed';

export const GET_SPACE = '[Space] Get one';
export const GET_SPACE_SUCCESS = '[Space] Get one success';
export const GET_SPACE_FAILED = '[Space] Get one failed';

export const CREATE_SPACE = '[Space] Create';
export const CREATE_SPACE_SUCCESS = '[Space] Create Success';
export const CREATE_SPACE_FAILED = '[Space] Create Failed';

export const DELETE_SPACE = '[Space] Delete';
export const DELETE_SPACE_SUCCESS = '[Space] Delete Success';
export const DELETE_SPACE_FAILED = '[Space] Delete Failed';

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
  entity = [cfEntityFactory(spaceEntityType)];
  entityType = spaceEntityType;
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
  entity = [cfEntityFactory(spaceWithOrgEntityType)];
  schemaKey = spaceWithOrgEntityType;
  entityType = spaceEntityType;
  options: RequestOptions;
  initialParams = {
    'results-per-page': 100,
    'order-direction': 'asc',
    'order-direction-field': 'name',
    'order-by': 'name'
  };
}

export class GetSpaceRoutes extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public spaceGuid: string,
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations = [
      createEntityRelationKey(routeEntityType, domainEntityType),
      createEntityRelationKey(routeEntityType, applicationEntityType)
    ],
    public populateMissing = true,
    public flattenPagination = true
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
    'order-direction-field': 'creation',
  };
  parentGuid: string;
  entity = cfEntityFactory(routeEntityType);
  entityType = routeEntityType;
  options: RequestOptions;
  parentEntityConfig = new CFEntityConfig(spaceEntityType);
}

export class GetAllAppsInSpace extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public endpointGuid: string,
    public spaceGuid: string,
    public paginationKey: string,
    public includeRelations = [],
    public populateMissing = true,
    public flattenPagination = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/apps`;
    this.options.method = 'get';
    this.parentGuid = spaceGuid;
  }
  actions = getActions('Spaces', 'Get Apps');
  entity = [cfEntityFactory(applicationEntityType)];
  entityType = applicationEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
  };
  parentGuid: string;
  parentEntityConfig = new CFEntityConfig(spaceEntityType);
}


export abstract class BaseSpaceAction extends CFStartAction implements ICFAction {
  constructor(public guid: string, public orgGuid: string, public endpointGuid: string) {
    super();
  }
  actions: string[];
  entity = [cfEntityFactory(spaceEntityType)];
  entityType = spaceEntityType;
  options: RequestOptions;
  removeEntityOnDelete?: boolean;
}

export class DeleteSpace extends BaseSpaceAction {
  constructor(guid: string, orgGuid: string, endpointGuid: string) {
    super(guid, orgGuid, endpointGuid);
    this.options = new RequestOptions();
    this.options.url = `spaces/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.append('recursive', 'true');
    this.options.params.append('async', 'false');
  }
  actions = [DELETE_SPACE, DELETE_SPACE_SUCCESS, DELETE_SPACE_FAILED];
  removeEntityOnDelete = true;
}

export class CreateSpace extends BaseSpaceAction {
  constructor(public endpointGuid: string, orgGuid: string, createSpace: IUpdateSpace, key = `${orgGuid}-${createSpace.name}`) {
    super(key, orgGuid, endpointGuid);
    this.options = new RequestOptions();
    this.options.url = `spaces`;
    this.options.method = 'post';
    this.options.body = createSpace;
  }
  actions = [CREATE_SPACE, CREATE_SPACE_SUCCESS, CREATE_SPACE_FAILED];
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
  entity = [cfEntityFactory(spaceEntityType)];
  entityType = spaceEntityType;
  options: RequestOptions;
  updatingKey = UpdateSpace.UpdateExistingSpace;
}

export class GetAllSpaceUsers extends GetAllOrgUsers {
  constructor(
    public guid: string,
    public paginationKey: string,
    public endpointGuid: string,
    public isAdmin: boolean,
    includeRelations?: string[]) {
    super(guid, paginationKey, endpointGuid, isAdmin, includeRelations);
    this.options.url = `spaces/${guid}/user_roles`;
    this.flattenPaginationMax = 600;
  }
  actions = getActions('Spaces', 'List all user roles');
}


export class GetAllServicesForSpace extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid: string = null,
    public spaceGuid: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceEntityType, servicePlanEntityType)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/services`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Space', 'Get all Services');
  entity = cfEntityFactory(serviceEntityType);
  entityType = serviceEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
  };
  flattenPagination = true;
}


export class GetServiceInstancesForSpace
  extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public spaceGuid: string,
    public endpointGuid: string,
    public paginationKey: string,
    public q: string[] = null,
    public includeRelations: string[] = getServiceInstanceRelations,
    public populateMissing = true,
    public flattenPagination = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    if (q) {
      this.initialParams.q = q;
    }
    this.parentGuid = spaceGuid;
  }
  actions = getActions('Space', 'Get all service instances');
  entity = [cfEntityFactory(serviceInstancesWithSpaceEntityType)];
  schemaKey = serviceInstancesWithSpaceEntityType;
  entityType = serviceInstancesEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
    q: []
  };
  parentGuid: string;
  parentEntityConfig = new CFEntityConfig(spaceEntityType);
}
