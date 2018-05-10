import { RequestOptions, URLSearchParams } from '@angular/http';

import { entityFactory, serviceBrokerSchemaKey } from '../helpers/entity-factory';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
import { getActions } from './action.helper';

export class GetServiceBrokers extends CFStartAction implements PaginationAction {
  constructor(
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'service_brokers';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Brokers', 'Get all');
  entity = [entityFactory(serviceBrokerSchemaKey)];
  entityKey = serviceBrokerSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
