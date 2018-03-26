import { RequestOptions, URLSearchParams } from '@angular/http';

import { entityFactory, featureFlagSchemaKey } from '../helpers/entity-factory';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, RequestEntityLocation } from '../types/request.types';
import { getActions } from './action.helper';

export class GetAllFeatureFlags extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `config/feature_flags`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.guid = endpointGuid;
  }
  guid: string;
  entityKey = featureFlagSchemaKey;
  entity = [entityFactory(featureFlagSchemaKey)];
  actions = getActions('Feature Flags', 'Fetch all');
  options: RequestOptions;
  flattenPagination: false;
  entityLocation = RequestEntityLocation.ARRAY;
  initialParams = {
    page: 1,
    'results-per-page': 25,
  };
}
