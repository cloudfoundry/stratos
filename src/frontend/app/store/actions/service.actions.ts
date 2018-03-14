import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';
import { ServiceInstancesSchema, ServiceSchema } from './action-types';

export class GetAllServices extends CFStartAction implements PaginationAction {
  constructor(public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `services`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service', 'Get all Services');
  entity = [ServiceSchema];
  entityKey = ServiceSchema.key;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 2,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}
