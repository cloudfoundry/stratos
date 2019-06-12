import { RequestOptions } from '@angular/http';

import { CF_ENDPOINT_TYPE } from '../../../cloud-foundry/cf-types';
import { stackEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { createEntityRelationKey } from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';

export const GET = '[Stack] Get one';
export const GET_SUCCESS = '[Stack] Get one success';
export const GET_FAILED = '[Stack] Get one failed';

export class GetStack extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `stacks/${guid}`;
    this.options.method = 'get';
  }
  actions = [
    GET,
    GET_SUCCESS,
    GET_FAILED
  ];
  entity = [entityCatalogue.getEntity(CF_ENDPOINT_TYPE, stackEntityType).getSchema()];
  entityType = stackEntityType;
  options: RequestOptions;
}
export class GetAllStacks extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `stacks`;
    this.options.method = 'get';
    this.paginationKey = createEntityRelationKey(endpointSchemaKey, endpointGuid);
  }
  paginationKey: string;
  actions = getActions('Stack', 'Fetch all');
  entity = [entityCatalogue.getEntity(CF_ENDPOINT_TYPE, stackEntityType).getSchema()];
  entityType = stackEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
