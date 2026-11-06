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
    // V3-native: drives /pp/v1/cf/service_brokers/{cnsi} (handler in
    // native_service_brokers_reads.go). Returns StratosPagedResponse
    // shape so the standard v3PaginationConfig applies. Field renames
    // alias `url`→`broker_url`, `spaceGuid`→`space_guid`,
    // `authUsername`→`auth_username` so V2 consumers continue to read
    // snake_case keys.
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/service_brokers/${endpointGuid}`
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
    // V3-native single-resource: drives
    // /pp/v1/cf/service_brokers/{cnsi}/{guid} (getNativeServiceBrokerDetail).
    // Backend returns a flat StServiceBroker (no APIResource wrapper); the
    // global successfulRequestDataMapper stamps cfGuid+guid and the
    // tolerant v3EntitiesFromResponse adapter on the entity wraps it.
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/service_brokers/${endpointGuid}/${guid}`
    );
  }
  actions = getActions('Service Brokers', 'Get specific by ID');
  entity = [cfEntityFactory(serviceBrokerEntityType)];
  entityType = serviceBrokerEntityType;
  options: HttpRequest<any>;
}
