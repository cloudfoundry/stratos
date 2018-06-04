import { Headers, RequestOptions, URLSearchParams } from '@angular/http';

import {
  applicationSchemaKey,
  entityFactory,
  organizationSchemaKey,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  serviceInstancesWithSpaceSchemaKey,
  servicePlanSchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
} from '../helpers/entity-factory';
import {
  createEntityRelationKey,
  EntityInlineChildAction,
  EntityInlineParentAction,
} from '../helpers/entity-relations.types';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';

export const DELETE_SERVICE_BINDING = '[Service Instances] Delete service binding';
export const UPDATE_SERVICE_INSTANCE_SUCCESS = getActions('Service Instances', 'Update Service Instance')[1];

export class GetServicesInstancesInSpace
  extends CFStartAction implements PaginationAction, EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public endpointGuid: string,
    public spaceGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceInstancesSchemaKey, serviceBindingSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, servicePlanSchemaKey)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.parentGuid = spaceGuid;
  }
  actions = getActions('Service Instances', 'Get all in Space');
  entity = [entityFactory(serviceInstancesSchemaKey)];
  entityKey = serviceInstancesSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
  };
  parentGuid: string;
  parentEntitySchema = entityFactory(spaceSchemaKey);
  flattenPagination = true;
}

export class GetServiceInstances
  extends CFStartAction implements PaginationAction, EntityInlineParentAction {
  constructor(
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceInstancesSchemaKey, serviceBindingSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, servicePlanSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, spaceSchemaKey),
      createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
      createEntityRelationKey(servicePlanSchemaKey, serviceSchemaKey),
      createEntityRelationKey(serviceBindingSchemaKey, applicationSchemaKey)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Instances', 'Get all');
  entity = [entityFactory(serviceInstancesWithSpaceSchemaKey)];
  entityKey = serviceInstancesSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'asc',
    'order-direction-field': 'creation',
  };
  flattenPagination = true;
}
export class GetServiceInstance
  extends CFStartAction implements EntityInlineParentAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceInstancesSchemaKey, serviceBindingSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, servicePlanSchemaKey)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Instances', 'Get particular instance');
  entity = [entityFactory(serviceInstancesSchemaKey)];
  entityKey = serviceInstancesSchemaKey;
  options: RequestOptions;
}

export class DeleteServiceInstance extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public guid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.set('async', 'false');
    this.options.params.set('recursive', 'true');
    this.options.headers = new Headers();
  }
  actions = getActions('Service Instances', 'Delete Service Instance');
  entity = [entityFactory(serviceInstancesSchemaKey)];
  entityKey = serviceInstancesSchemaKey;
  options: RequestOptions;
  removeEntityOnDelete = true;
}
export class CreateServiceInstance extends CFStartAction implements ICFAction {
  constructor(
    public endpointGuid: string,
    public guid: string,
    public name: string,
    public servicePlanGuid: string,
    public spaceGuid: string,
    public params: Object,
    public tags: string[],
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances`;
    this.options.method = 'post';
    this.options.body = {
      name: name,
      space_guid: spaceGuid,
      service_plan_guid: servicePlanGuid,
      parameters: params,
      tags: tags
    };
  }
  actions = getActions('Service Instances', 'Create Service Instance');
  entity = [entityFactory(serviceInstancesSchemaKey)];
  entityKey = serviceInstancesSchemaKey;
  options: RequestOptions;
}

export class UpdateServiceInstance extends CreateServiceInstance {
  constructor(
    public endpointGuid: string,
    public guid: string,
    public name: string,
    public servicePlanGuid: string,
    public spaceGuid: string,
    public params: Object,
    public tags: string[],
  ) {
    super(endpointGuid, guid, name, servicePlanGuid, spaceGuid, params, tags);
    this.options.method = 'put';
    this.options.url = `${this.options.url}/${this.guid}`;

    this.actions = getActions('Service Instances', 'Update Service Instance');
  }
}
