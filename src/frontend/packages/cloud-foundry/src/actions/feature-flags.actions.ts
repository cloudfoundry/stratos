import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { endpointEntityType } from '../../../store/src/helpers/stratos-entity-factory';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { featureFlagEntityType } from '../cf-entity-types';
import { createEntityRelationPaginationKey } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export class GetAllFeatureFlags extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public paginationKey: string = '') {
    super();
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(endpointEntityType, this.endpointGuid);
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/feature_flags/${endpointGuid}`
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
    per_page: 100,
  };
}
