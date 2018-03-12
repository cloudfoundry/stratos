import { RequestOptions, URLSearchParams } from '@angular/http';

import { entityFactory, serviceInstancesSchemaKey, serviceBindingSchemaKey, servicePlanSchemaKey, spaceSchemaKey } from '../helpers/entity-factory';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';
import { EntityInlineParentAction, EntityInlineChildAction, createEntityRelationKey } from '../helpers/entity-relations.types';

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
    'order-direction-field': 'name',
  };
  parentGuid: string;
  parentEntitySchema = entityFactory(spaceSchemaKey);
}

export class DeleteServiceInstance extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public serviceInstanceGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances/${serviceInstanceGuid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.set('async', 'false');
    this.options.params.set('recursive', 'true');
  }
  actions = getActions('Service Instaces', 'Delete Service Instance');
  entity = [entityFactory(serviceInstancesSchemaKey)];
  entityKey = serviceInstancesSchemaKey;
  options: RequestOptions;
}


export class DeleteServiceBinding extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public serviceBindingGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_bindings/${serviceBindingGuid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.set('async', 'false');

  }
  actions = getActions('Service Instaces', 'Delete Service binding');
  entity = [entityFactory(serviceInstancesSchemaKey)];
  entityKey = serviceInstancesSchemaKey;
  options: RequestOptions;
}

