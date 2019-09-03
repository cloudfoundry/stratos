import { RequestOptions, URLSearchParams } from '@angular/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory, serviceBrokerEntityType } from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';

export class GetServiceBrokers extends CFStartAction implements PaginatedAction {
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
  entity = [cfEntityFactory(serviceBrokerEntityType)];
  entityType = serviceBrokerEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
export class GetServiceBroker extends CFStartAction implements EntityRequestAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `service_brokers/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Brokers', 'Get specific by ID');
  entity = [cfEntityFactory(serviceBrokerEntityType)];
  entityType = serviceBrokerEntityType;
  options: RequestOptions;
}
