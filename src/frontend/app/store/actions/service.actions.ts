import { RequestOptions, URLSearchParams } from '@angular/http';

import { entityFactory, serviceSchemaKey, servicePlanSchemaKey } from '../helpers/entity-factory';
import { PaginationAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
import { getActions } from './action.helper';
import { EntityInlineParentAction, createEntityRelationKey } from '../helpers/entity-relations.types';

export class GetAllServices extends CFStartAction implements PaginationAction, EntityInlineParentAction {
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
    'inline-relations-depth': 2,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
}
export class GetService extends CFStartAction implements EntityInlineParentAction {
  constructor(
    public serviceGuid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [
      createEntityRelationKey(serviceSchemaKey, servicePlanSchemaKey)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `services/${serviceGuid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Service', 'Get Service');
  entity = entityFactory(serviceSchemaKey);
  entityKey = serviceSchemaKey;
  options: RequestOptions;
}
