import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { serviceBrokerEntityType } from '../cf-entity-types';
import { CFStartAction } from './cf-action.types';

export class GetServiceBrokers extends CFStartAction implements PaginatedAction {
  constructor(
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [],
    public populateMissing = true
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      'service_brokers'
    );
  }
  actions = getActions('Service Brokers', 'Get all');
  entity = [cfEntityFactory(serviceBrokerEntityType)];
  entityType = serviceBrokerEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      `service_brokers/${guid}`
    );
  }
  actions = getActions('Service Brokers', 'Get specific by ID');
  entity = [cfEntityFactory(serviceBrokerEntityType)];
  entityType = serviceBrokerEntityType;
  options: HttpRequest<any>;
}
