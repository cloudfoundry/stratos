import { RequestOptions, URLSearchParams } from '@angular/http';

import { endpointSchemaKey } from '../../../store/src/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../entity-relations/entity-relations.types';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { cfEntityFactory, domainEntityType } from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';

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
    this.options.url = `domains/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = [GET_DOMAIN, GET_DOMAIN_SUCCESS, GET_DOMAIN_FAILED];
  entity = [cfEntityFactory(domainEntityType)];
  entityType = domainEntityType;
  options: RequestOptions;
}
export class FetchAllDomains extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public paginationKey: string = null, public flattenPagination = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'domains';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(endpointSchemaKey, endpointGuid);
  }
  actions = [GET_ALL_DOMAIN, GET_ALL_DOMAIN_SUCCESS, GET_ALL_DOMAIN_FAILED];
  entity = [cfEntityFactory(domainEntityType)];
  entityType = domainEntityType;
  options: RequestOptions;
  initialParams = {
    'results-per-page': 100,
  };
}
