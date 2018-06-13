import { RequestOptions, URLSearchParams } from '@angular/http';

import {
  entityFactory,
  organizationSchemaKey,
  servicePlanSchemaKey,
  servicePlanVisibilitySchemaKey,
  spaceSchemaKey,
  serviceInstancesSchemaKey,
  serviceBindingSchemaKey,
  applicationSchemaKey,
  serviceSchemaKey,
} from '../helpers/entity-factory';
import { createEntityRelationKey } from '../helpers/entity-relations.types';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
import { getActions } from './action.helper';

export class GetServicePlanServiceInstances extends CFStartAction implements PaginationAction {
  constructor(
    public servicePlanGuid: string,
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceInstancesSchemaKey, serviceBindingSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, servicePlanSchemaKey),
      createEntityRelationKey(serviceInstancesSchemaKey, spaceSchemaKey),
      createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
      createEntityRelationKey(servicePlanSchemaKey, serviceSchemaKey),
      createEntityRelationKey(serviceBindingSchemaKey, applicationSchemaKey)
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
  entity = [entityFactory(serviceInstancesSchemaKey)];
  entityKey = serviceInstancesSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
  };
  flattenPagination = true;
}
