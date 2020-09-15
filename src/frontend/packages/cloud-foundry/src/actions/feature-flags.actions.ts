import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { endpointEntityType } from '../../../store/src/helpers/stratos-entity-factory';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { featureFlagEntityType } from '../cf-entity-types';
import { createEntityRelationPaginationKey } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export class GetAllFeatureFlags extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public paginationKey: string = null) {
    super();
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(endpointEntityType, this.endpointGuid);
    this.options = new HttpRequest(
      'GET',
      `config/feature_flags`
    );
    this.guid = endpointGuid;
  }
  guid: string;
  entityType = featureFlagEntityType;
  entity = [cfEntityFactory(featureFlagEntityType)];
  actions = getActions('Feature Flags', 'Fetch all');
  options: HttpRequest<any>;
  flattenPagination = true;
  initialParams = {
    page: 1,
    'order-direction': 'desc',
    'order-direction-field': 'name',
    'results-per-page': 25,
  };
}
