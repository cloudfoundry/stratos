import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import {
  applicationEntityType,
  organizationEntityType,
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
  spaceEntityType,
} from '../cf-entity-types';
import { createEntityRelationKey } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export class GetServicePlanServiceInstances extends CFStartAction implements PaginatedAction {
  constructor(
    public servicePlanGuid: string,
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceInstancesEntityType, serviceBindingEntityType),
      createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
      createEntityRelationKey(serviceInstancesEntityType, spaceEntityType),
      createEntityRelationKey(spaceEntityType, organizationEntityType),
      createEntityRelationKey(servicePlanEntityType, serviceEntityType),
      createEntityRelationKey(serviceBindingEntityType, applicationEntityType)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `service_plan/${servicePlanGuid}/service_instances`
    );
  }
  actions = getActions('Service Plan', 'Get service instances');
  entity = [cfEntityFactory(serviceInstancesEntityType)];
  entityType = serviceInstancesEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
  };
  flattenPagination = true;
}
