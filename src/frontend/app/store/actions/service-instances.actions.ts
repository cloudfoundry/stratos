import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
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

