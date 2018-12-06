import { RequestOptions, URLSearchParams } from '@angular/http';

import { entityFactory, servicePlanSchemaKey, serviceSchemaKey } from '../helpers/entity-factory';
import { createEntityRelationKey, EntityInlineParentAction } from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
import { getActions } from './action.helper';

export class GetAllServices extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid: string = null,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceSchemaKey, servicePlanSchemaKey)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `services`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service', 'Get all Services');
  entity = entityFactory(serviceSchemaKey);
  entityKey = serviceSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'label',
  };
  flattenPagination = true;
}
export class GetService extends CFStartAction implements EntityInlineParentAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceSchemaKey, servicePlanSchemaKey)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `services/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service', 'Get Service');
  entity = entityFactory(serviceSchemaKey);
  entityKey = serviceSchemaKey;
  options: RequestOptions;
}

export class GetServicePlansForService extends CFStartAction implements PaginatedAction {
  constructor(
    public serviceGuid: string,
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(servicePlanSchemaKey, serviceSchemaKey),
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `services/${serviceGuid}/service_plans`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service', 'Get Service plans');
  entity = [entityFactory(servicePlanSchemaKey)];
  entityKey = servicePlanSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'creation',
  };
  flattenPagination = true;
}
