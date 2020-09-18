import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { serviceEntityType, servicePlanEntityType } from '../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { createEntityRelationKey, EntityInlineParentAction } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

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
    this.options = new HttpRequest(
      'GET',
      `services`
    );
  }
  actions = getActions('Service', 'Get all Services');
  entity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceEntityType).getSchema();
  entityType = serviceEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'label',
  };
  flattenPagination = true;
  flattenPaginationMax = true;
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
    this.options = new HttpRequest(
      'GET',
      `services/${guid}`
    );
  }
  actions = getActions('Service', 'Get Service');
  entity = cfEntityFactory(serviceEntityType);
  entityType = serviceEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      `services/${serviceGuid}/service_plans`
    );
  }
  actions = getActions('Service', 'Get Service plans');
  entity = [cfEntityFactory(servicePlanEntityType)];
  entityType = servicePlanEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
