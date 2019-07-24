import { RequestOptions, URLSearchParams } from '@angular/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { RequestEntityLocation } from '../../../store/src/types/request.types';
import { cfEntityFactory, featureFlagEntityType } from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';

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
  entityType = featureFlagEntityType;
  entity = [cfEntityFactory(featureFlagEntityType)];
  actions = getActions('Feature Flags', 'Fetch all');
  options: RequestOptions;
  flattenPagination: false;
  entityLocation = RequestEntityLocation.ARRAY;
  initialParams = {
    page: 1,
    'order-direction': 'desc',
    'order-direction-field': 'name',
    'results-per-page': 25,
  };
}
