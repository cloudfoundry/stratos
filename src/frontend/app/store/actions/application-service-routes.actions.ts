import { RequestOptions, URLSearchParams } from '@angular/http';

import {
  applicationSchemaKey,
  domainSchemaKey,
  entityFactory,
  routeSchemaKey,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
} from '../helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineChildAction,
  EntityInlineParentAction,
} from '../helpers/entity-relations/entity-relations.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';

export const ASSIGN_ROUTE = '[Application] Assign route';
export const ASSIGN_ROUTE_SUCCESS = '[Application] Assign route success';
export const ASSIGN_ROUTE_FAILED = '[Application] Assign route failed';

const applicationEntitySchema = entityFactory(applicationSchemaKey);

export class GetAppRoutes extends CFStartAction implements EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public paginationKey: string = null,
    public includeRelations: string[] = [
      createEntityRelationKey(routeSchemaKey, domainSchemaKey)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `apps/${guid}/routes`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.parentGuid = guid;
    this.paginationKey = paginationKey || createEntityRelationPaginationKey(applicationSchemaKey, guid);
  }
  actions = [
    '[Application Routes] Get all',
    '[Application Routes] Get all success',
    '[Application Routes] Get all failed',
  ];
  initialParams = {
    'results-per-page': 100,
    page: 1,
    'order-direction': 'desc',
    'order-direction-field': 'route',
  };
  entity = [entityFactory(routeSchemaKey)];
  entityKey = routeSchemaKey;
  options: RequestOptions;
  flattenPagination = true;
  parentGuid: string;
  parentEntitySchema = entityFactory(applicationSchemaKey);
}

export class GetAppServiceBindings extends CFStartAction implements EntityInlineParentAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public paginationKey: string = null,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceBindingSchemaKey, serviceInstancesSchemaKey),
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `apps/${guid}/service_bindings`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.paginationKey = paginationKey || createEntityRelationPaginationKey(applicationSchemaKey, guid);
  }
  actions = getActions('Application Service Bindings', 'Get All');
  initialParams = {
    'results-per-page': 100,
    page: 1,
    'order-direction': 'asc',
    'order-direction-field': 'creation',
  };
  entity = [entityFactory(serviceBindingSchemaKey)];
  entityKey = serviceBindingSchemaKey;
  options: RequestOptions;
}

export class AssociateRouteWithAppApplication extends CFStartAction
  implements ICFAction {
  constructor(
    public guid: string,
    public routeGuid: string,
    public endpointGuid: string
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `apps/${guid}/routes/${routeGuid}`;
    this.options.method = 'put';
  }
  actions = [ASSIGN_ROUTE, ASSIGN_ROUTE_SUCCESS, ASSIGN_ROUTE_FAILED];
  entity = [applicationEntitySchema];
  entityKey = applicationSchemaKey;
  options: RequestOptions;
  updatingKey = 'Assigning-Route';
}
