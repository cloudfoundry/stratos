
import { CFStartAction, ICFAction } from '../types/request.types';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { getActions } from './action.helper';
import { entityFactory, serviceBindingSchemaKey } from '../helpers/entity-factory';

export const DELETE_SERVICE_BINDING_ACTION = '[ Service Instances ] Delete Service Binding';
export const DELETE_SERVICE_BINDING_ACTION_SUCCESS = '[ Service Instances ] Delete Service Binding success';
export const DELETE_SERVICE_BINDING_ACTION_FAILURE = '[ Service Instances ] Delete Service Binding failure';
export class CreateServiceBinding extends CFStartAction implements ICFAction {
  constructor(
    public endpointGuid: string,
    public guid: string,
    public appGuid: string,
    public serviceInstanceGuid: string,
    public params: Object,
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_bindings`;
    this.options.method = 'post';
    this.options.body = {
      app_guid: appGuid,
      service_instance_guid: serviceInstanceGuid,
      parameters: params ? params : null,
    };
  }
  actions = getActions('Service Bindings', 'Create Service Binding');
  entity = [entityFactory(serviceBindingSchemaKey)];
  entityKey = serviceBindingSchemaKey;
  options: RequestOptions;
}

export class DeleteServiceBinding extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public guid: string, public serviceInstanceGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_bindings/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.set('async', 'false');

  }
  actions = [
    DELETE_SERVICE_BINDING_ACTION,
    DELETE_SERVICE_BINDING_ACTION_SUCCESS,
    DELETE_SERVICE_BINDING_ACTION_FAILURE
  ];
  entity = [entityFactory(serviceBindingSchemaKey)];
  entityKey = serviceBindingSchemaKey;
  options: RequestOptions;
  removeEntityOnDelete = true;
}
