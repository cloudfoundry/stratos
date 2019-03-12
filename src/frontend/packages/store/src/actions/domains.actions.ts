import { RequestOptions, URLSearchParams } from '@angular/http';

import { domainSchemaKey, endpointSchemaKey, entityFactory } from '../helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';

export const GET_DOMAIN = '[domain] Get domain ';
export const GET_DOMAIN_SUCCESS = '[domain] Get domain success';
export const GET_DOMAIN_FAILED = '[domain] Get domain failed';

export const GET_ALL_DOMAIN = '[domain] Get all domain ';
export const GET_ALL_DOMAIN_SUCCESS = '[domain] Get all domain success';
export const GET_ALL_DOMAIN_FAILED = '[domain] Get all domain failed';

export class FetchDomain extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `shared_domains/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = [GET_DOMAIN, GET_DOMAIN_SUCCESS, GET_DOMAIN_FAILED];
  entity = [entityFactory(domainSchemaKey)];
  entityKey = domainSchemaKey;
  options: RequestOptions;
}
export class FetchAllDomains extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public flattenPagination = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'shared_domains';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, endpointGuid);
  }
  actions = [GET_ALL_DOMAIN, GET_ALL_DOMAIN_SUCCESS, GET_ALL_DOMAIN_FAILED];
  entity = [entityFactory(domainSchemaKey)];
  entityKey = domainSchemaKey;
  options: RequestOptions;
  paginationKey = 'all-domains';
  initialParams = {
    'results-per-page': 100,
  };
}
