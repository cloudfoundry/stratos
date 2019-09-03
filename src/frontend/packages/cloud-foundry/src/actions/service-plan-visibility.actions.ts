import { RequestOptions, URLSearchParams } from '@angular/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import {
  cfEntityFactory,
  organizationEntityType,
  servicePlanEntityType,
  servicePlanVisibilityEntityType,
  spaceEntityType,
} from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { createEntityRelationKey } from '../entity-relations/entity-relations.types';

export class GetServicePlanVisibilities extends CFStartAction implements PaginatedAction {
  constructor(
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(servicePlanVisibilityEntityType, servicePlanEntityType),
      createEntityRelationKey(servicePlanVisibilityEntityType, organizationEntityType),
      createEntityRelationKey(organizationEntityType, spaceEntityType)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'service_plan_visibilities';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Plan Visibilities', 'Get all');
  entity = [cfEntityFactory(servicePlanVisibilityEntityType)];
  entityType = servicePlanVisibilityEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'service_plan_guid',
  };
  flattenPagination = true;
}
