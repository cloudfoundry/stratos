import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { entityFactory } from '../helpers/entity-factory';
import { domainSchemaKey } from '../helpers/entity-factory';

export const GET_DOMAIN = '[domain] Get domain ';
export const GET_DOMAIN_SUCCESS = '[domain] Get domain success';
export const GET_DOMAIN_FAILED = '[domain] Get domain failed';

export class FetchDomain extends CFStartAction implements ICFAction {
  constructor(public domainGuid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `shared_domains/${domainGuid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = [GET_DOMAIN, GET_DOMAIN_SUCCESS, GET_DOMAIN_FAILED];
  entity = [entityFactory(domainSchemaKey)];
  entityKey = domainSchemaKey;
  options: RequestOptions;
}
export class FetchAllDomains extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'shared_domains';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = [GET_DOMAIN, GET_DOMAIN_SUCCESS, GET_DOMAIN_FAILED];
  entity = [entityFactory(domainSchemaKey)];
  entityKey = domainSchemaKey;
  options: RequestOptions;
  paginationKey = 'all-domains';
}
