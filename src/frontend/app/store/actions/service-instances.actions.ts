import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';
import { ServiceInstancesSchema } from './action-types';

export class GetServicesInstancesInSpace extends CFStartAction implements PaginationAction {
  constructor(public cfGuid: string, public spaceGuid: string, public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `spaces/${spaceGuid}/service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Instaces', 'Get all in Space');
  entity = [ServiceInstancesSchema];
  entityKey = ServiceInstancesSchema.key;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 2,
    'exclude-relations': 'space'
  };
}

export class DeleteServiceInstance extends CFStartAction implements ICFAction {
  constructor(public cfGuid: string, public serviceInstanceGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_instances/${serviceInstanceGuid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.set('async', 'false');
    this.options.params.set('recursive', 'true');
  }
  actions = getActions('Service Instaces', 'Delete Service Instance');
  entity = ServiceInstancesSchema;
  entityKey = ServiceInstancesSchema.key;
  options: RequestOptions;
}


export class DeleteServiceBinding extends CFStartAction implements ICFAction {
  constructor(public cfGuid: string, public serviceBindingGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_bindings/${serviceBindingGuid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.set('async', 'false');

  }
  actions = getActions('Service Instaces', 'Delete Service binding');
  entity = ServiceInstancesSchema;
  entityKey = ServiceInstancesSchema.key;
  options: RequestOptions;
}

