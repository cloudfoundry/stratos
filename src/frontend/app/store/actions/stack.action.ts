import { RequestOptions } from '@angular/http';
import { getActions } from './action.helper';
import { PaginatedAction } from '../types/pagination.types';

import { entityFactory, endpointSchemaKey } from '../helpers/entity-factory';
import { CFStartAction, ICFAction } from '../types/request.types';
import { schema } from 'normalizr';
import { stackSchemaKey } from '../helpers/entity-factory';
import { createEntityRelationPaginationKey, createEntityRelationKey } from '../helpers/entity-relations/entity-relations.types';

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
  entity = [entityFactory(stackSchemaKey)];
  entityKey = stackSchemaKey;
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
  entity = [entityFactory(stackSchemaKey)];
  entityKey = stackSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
