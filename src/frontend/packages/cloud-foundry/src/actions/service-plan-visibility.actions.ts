import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import {
  organizationEntityType,
  servicePlanEntityType,
  servicePlanVisibilityEntityType,
  spaceEntityType,
} from '../cf-entity-types';
import { createEntityRelationKey } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

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
    this.options = new HttpRequest(
      'GET',
      'service_plan_visibilities'
    );
  }
  actions = getActions('Service Plan Visibilities', 'Get all');
  entity = [cfEntityFactory(servicePlanVisibilityEntityType)];
  entityType = servicePlanVisibilityEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'service_plan_guid',
  };
  flattenPagination = true;
}
