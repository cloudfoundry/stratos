import { RequestOptions, URLSearchParams } from '@angular/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import {
  applicationEntityType,
  cfEntityFactory,
  organizationEntityType,
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
  spaceEntityType,
} from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { createEntityRelationKey } from '../entity-relations/entity-relations.types';

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
    this.options = new RequestOptions();
    this.options.url = `service_plan/${servicePlanGuid}/service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service Plan', 'Get service instances');
  entity = [cfEntityFactory(serviceInstancesEntityType)];
  entityType = serviceInstancesEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
  };
  flattenPagination = true;
}
