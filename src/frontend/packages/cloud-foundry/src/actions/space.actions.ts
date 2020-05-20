import { HttpParams, HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { IUpdateSpace } from '../cf-api.types';
import { cfEntityFactory } from '../cf-entity-factory';
import {
  applicationEntityType,
  domainEntityType,
  routeEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
  servicePlanEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
} from '../cf-entity-types';
import { CFEntityConfig } from '../cf-types';
import {
  createEntityRelationKey,
  EntityInlineChildAction,
  EntityInlineParentAction,
} from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';
import { GetAllOrgUsers } from './organization.actions';
import { RouteEvents } from './route.actions';
import { getServiceInstanceRelations } from './service-instances.actions';

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
    this.options = new HttpRequest(
      'GET',
      `spaces/${guid}`
    );
  }
  actions = [
    GET_SPACE,
    GET_SPACE_SUCCESS,
    GET_SPACE_FAILED
  ];
  entity = [cfEntityFactory(spaceEntityType)];
  schemaKey = ''; // Required by builder
  entityType = spaceEntityType;
  options: HttpRequest<any>;
}

export class GetAllSpaces extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid?: string,
    public includeRelations: string[] = [],
    public populateMissing = true,
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      'space'
    );
  }
  actions = [GET_SPACES, GET_SPACES_SUCCESS, GET_SPACES_FAILED];
  entity = [cfEntityFactory(spaceWithOrgEntityType)];
  schemaKey = spaceWithOrgEntityType;
  entityType = spaceEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      `spaces/${spaceGuid}/routes`
    );
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
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      `spaces/${spaceGuid}/apps`
    );
    this.parentGuid = spaceGuid;
  }
  actions = getActions('Spaces', 'Get Apps');
  entity = [cfEntityFactory(applicationEntityType)];
  entityType = applicationEntityType;
  options: HttpRequest<any>;
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
  options: HttpRequest<any>;
  removeEntityOnDelete?: boolean;
}

export class DeleteSpace extends BaseSpaceAction {
  constructor(guid: string, orgGuid: string, endpointGuid: string) {
    super(guid, orgGuid, endpointGuid);
    this.options = new HttpRequest(
      'DELETE',
      `spaces/${guid}`,
      {
        params: new HttpParams({
          fromObject: {
            recursive: 'true',
            async: 'false'
          }
        })
      }
    );
  }
  actions = [DELETE_SPACE, DELETE_SPACE_SUCCESS, DELETE_SPACE_FAILED];
  removeEntityOnDelete = true;
}

export class CreateSpace extends BaseSpaceAction {
  constructor(public endpointGuid: string, orgGuid: string, createSpace: IUpdateSpace, key = `${orgGuid}-${createSpace.name}`) {
    super(key, orgGuid, endpointGuid);
    this.options = new HttpRequest(
      'POST',
      'spaces',
      createSpace
    );
  }
  actions = [CREATE_SPACE, CREATE_SPACE_SUCCESS, CREATE_SPACE_FAILED];
}
export class UpdateSpace extends CFStartAction implements ICFAction {

  public static UpdateExistingSpace = 'Updating-Existing-Space';
  constructor(public guid: string, public endpointGuid: string, updateSpace: IUpdateSpace) {
    super();
    this.options = new HttpRequest(
      'PUT',
      `spaces/${guid}`,
      updateSpace
    );
  }
  actions = getActions('Spaces', 'Update Space');
  entity = [cfEntityFactory(spaceEntityType)];
  entityType = spaceEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      `spaces/${guid}/user_roles`
    );
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
    this.options = new HttpRequest(
      'GET',
      `spaces/${spaceGuid}/services`
    );
  }
  actions = getActions('Space', 'Get all Services');
  entity = cfEntityFactory(serviceEntityType);
  entityType = serviceEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      `spaces/${spaceGuid}/service_instances`
    );
    if (q) {
      this.initialParams.q = q;
    }
    this.parentGuid = spaceGuid;
  }
  actions = getActions('Space', 'Get all service instances');
  entity = [cfEntityFactory(serviceInstancesWithSpaceEntityType)];
  schemaKey = serviceInstancesWithSpaceEntityType;
  entityType = serviceInstancesEntityType;
  options: HttpRequest<any>;
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
