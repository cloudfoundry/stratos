
import { CFStartAction, ICFAction } from '../types/request.types';
import { RequestOptions } from '@angular/http';
import { getActions } from './action.helper';
import { entityFactory, serviceBindingSchemaKey } from '../helpers/entity-factory';

export class CreateServiceBinding extends CFStartAction implements ICFAction {
  constructor(
    public endpointGuid: string,
    public guid: string,
    public appGuid: string,
    public serviceInstanceGuid: string,
    public params: string,
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_bindings`;
    this.options.method = 'post';
    this.options.body = {
      app_guid: appGuid,
      service_instance_guid: serviceInstanceGuid,
      parameters: params,
    };
  }
  actions = getActions('Service Bindings', 'Create Service Binding');
  entity = [entityFactory(serviceBindingSchemaKey)];
  entityKey = serviceBindingSchemaKey;
  options: RequestOptions;
}
