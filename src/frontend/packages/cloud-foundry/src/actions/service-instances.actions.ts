import { Headers, RequestOptions, URLSearchParams } from '@angular/http';

import { getActions } from '../../../store/src/actions/action.helper';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import {
  applicationEntityType,
  cfEntityFactory,
  organizationEntityType,
  serviceBindingEntityType,
  serviceBindingNoBindingsEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
  servicePlanEntityType,
  spaceEntityType,
} from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { createEntityRelationKey, EntityInlineParentAction } from '../entity-relations/entity-relations.types';

export const DELETE_SERVICE_BINDING = '[Service Instances] Delete service binding';
export const UPDATE_SERVICE_INSTANCE_SUCCESS = getActions('Service Instances', 'Update Service Instance')[1];
export const getServiceInstanceRelations = [
  createEntityRelationKey(serviceInstancesEntityType, serviceBindingEntityType),
  createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
  createEntityRelationKey(serviceInstancesEntityType, spaceEntityType),
  createEntityRelationKey(serviceInstancesEntityType, serviceEntityType),
  createEntityRelationKey(spaceEntityType, organizationEntityType),
  createEntityRelationKey(serviceBindingEntityType, applicationEntityType)
];

export class GetServiceInstances
  extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = getServiceInstanceRelations,
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Instances', 'Get all');
  entity = [cfEntityFactory(serviceInstancesWithSpaceEntityType)];
  entityType = serviceInstancesEntityType;
  schemaKey = serviceInstancesWithSpaceEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'asc',
    'order-direction-field': 'creation',
    q: []
  };
  flattenPagination = true;
}
export class GetServiceInstance
  extends CFStartAction implements EntityInlineParentAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public includeRelations: string[] = getServiceInstanceRelations,
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Instances', 'Get particular instance');
  entity = [cfEntityFactory(serviceInstancesWithSpaceEntityType)];
  schemaKey = serviceInstancesWithSpaceEntityType;
  entityType = serviceInstancesEntityType;
  options: RequestOptions;
}

export class DeleteServiceInstance extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public guid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.set('accepts_incomplete', 'true');
    this.options.params.set('async', 'false');
    this.options.params.set('recursive', 'true');
    this.options.headers = new Headers();
  }
  actions = getActions('Service Instances', 'Delete Service Instance');
  entity = [cfEntityFactory(serviceInstancesEntityType)];
  entityType = serviceInstancesEntityType;
  options: RequestOptions;
  clearPaginationEntityKeys = [serviceBindingEntityType];
  removeEntityOnDelete = true;
}
export class CreateServiceInstance extends CFStartAction implements ICFAction {
  constructor(
    public endpointGuid: string,
    public guid: string,
    public name: string,
    public servicePlanGuid: string,
    public spaceGuid: string,
    public params: object,
    public tags: string[],
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances`;
    this.options.params = new URLSearchParams();
    this.options.params.set('accepts_incomplete', 'true');
    this.options.method = 'post';
    this.options.body = {
      name,
      space_guid: spaceGuid,
      service_plan_guid: servicePlanGuid,
      parameters: params,
      tags
    };
  }
  actions = getActions('Service Instances', 'Create Service Instance');
  entity = [cfEntityFactory(serviceInstancesEntityType)];
  entityType = serviceInstancesEntityType;
  options: RequestOptions;
}

export class UpdateServiceInstance extends CreateServiceInstance {
  static updateServiceInstance = 'Updating-Service-Instance';
  constructor(
    public endpointGuid: string,
    public guid: string,
    public name: string,
    public servicePlanGuid: string,
    public spaceGuid: string,
    public params: object,
    public tags: string[],
  ) {
    super(endpointGuid, guid, name, servicePlanGuid, spaceGuid, params, tags);
    this.options.method = 'put';
    this.options.url = `${this.options.url}/${this.guid}`;
    this.options.params = new URLSearchParams();
    this.options.params.set('accepts_incomplete', 'true');
    this.actions = getActions('Service Instances', 'Update Service Instance');
  }
  updatingKey = UpdateServiceInstance.updateServiceInstance;
}

export class ListServiceBindingsForInstance
  extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public endpointGuid: string,
    public serviceInstanceGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceBindingEntityType, serviceInstancesEntityType),
      createEntityRelationKey(serviceBindingEntityType, applicationEntityType)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances/${serviceInstanceGuid}/service_bindings`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Instances', 'Get all service bindings for instance');
  entity = [cfEntityFactory(serviceBindingNoBindingsEntityType)];
  entityType = serviceBindingEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
  };
  flattenPagination = true;
}
