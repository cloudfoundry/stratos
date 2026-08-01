import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import {
  serviceBindingEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  serviceInstancesWithSpaceEntityType,
  servicePlanEntityType,
  spaceEntityType,
} from '../cf-entity-types';
import { createEntityRelationKey, EntityInlineParentAction } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export class GetServiceInstances
  extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceInstancesEntityType, serviceBindingEntityType),
      createEntityRelationKey(serviceInstancesEntityType, servicePlanEntityType),
      // Ideally this should just be `createEntityRelationKey(serviceInstancesEntityType, serviceEntityType)`, however even though CF
      // returns `si.service_url` and `si.service_guid` it does not return the actual service. This means the service is not fetched in the
      // initial fetch SI request but in lots of separate ones.
      createEntityRelationKey(servicePlanEntityType, serviceEntityType),
      createEntityRelationKey(serviceInstancesEntityType, spaceEntityType),
    ],
    public populateMissing = true
  ) {
    super();
    // V3-native: drives /pp/v1/cf/service_instances/{cnsi} (handler in
    // native_service_instances_reads.go). Returns StratosPagedResponse
    // shape so v3PaginationConfig applies. Field renames alias
    // servicePlanGuid→service_plan_guid, serviceOfferingGuid→service_guid,
    // spaceGuid→space_guid, dashboardUrl→dashboard_url so V2 consumers
    // continue to work.
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/service_instances/${endpointGuid}`
    );
  }
  actions = getActions('Service Instances', 'Get all');
  entity = [cfEntityFactory(serviceInstancesWithSpaceEntityType)];
  entityType = serviceInstancesEntityType;
  schemaKey = serviceInstancesWithSpaceEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'asc',
    'order-direction-field': 'creation',
    q: [] as string[]
  };
  flattenPagination = true;
  flattenPaginationMax = true;
}
