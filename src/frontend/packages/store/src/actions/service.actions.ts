import { RequestOptions, URLSearchParams } from '@angular/http';

import { CF_ENDPOINT_TYPE } from '../../../cloud-foundry/cf-types';
import { cfEntityFactory, serviceEntityType, servicePlanEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { createEntityRelationKey, EntityInlineParentAction } from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
import { getActions } from './action.helper';

export class GetAllServices extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid: string = null,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceEntityType, servicePlanEntityType)
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
  entity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceEntityType).getSchema();
  entityType = serviceEntityType;
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
      createEntityRelationKey(serviceEntityType, servicePlanEntityType)
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
  entity = cfEntityFactory(serviceEntityType);
  entityType = serviceEntityType;
  options: RequestOptions;
}

export class GetServicePlansForService extends CFStartAction implements PaginatedAction {
  constructor(
    public serviceGuid: string,
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(servicePlanEntityType, serviceEntityType),
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
  entity = [cfEntityFactory(servicePlanEntityType)];
  entityType = servicePlanEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
