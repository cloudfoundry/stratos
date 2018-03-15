import { RequestOptions, URLSearchParams } from '@angular/http';

import { entityFactory, serviceSchemaKey } from '../helpers/entity-factory';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
import { getActions } from './action.helper';

export class GetAllServices extends CFStartAction implements PaginationAction {
  constructor(public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `services`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service', 'Get all Services');
  entity = entityFactory(serviceSchemaKey);
  entityKey = serviceSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 2,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}
