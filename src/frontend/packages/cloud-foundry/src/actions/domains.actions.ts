import { HttpRequest } from '@angular/common/http';

import { endpointSchemaKey } from '../../../store/src/helpers/entity-factory';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { domainEntityType } from '../cf-entity-types';
import { createEntityRelationPaginationKey } from '../entity-relations/entity-relations.types';
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
    this.options = new HttpRequest(
      'GET',
      `domains/${guid}`
    );
  }
  actions = [GET_DOMAIN, GET_DOMAIN_SUCCESS, GET_DOMAIN_FAILED];
  entity = [cfEntityFactory(domainEntityType)];
  entityType = domainEntityType;
  options: HttpRequest<any>;
}
export class FetchAllDomains extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public paginationKey: string = null, public flattenPagination = true) {
    super();
    this.options = new HttpRequest(
      'GET',
      'domains',
    );
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(endpointSchemaKey, endpointGuid);
  }
  actions = [GET_ALL_DOMAIN, GET_ALL_DOMAIN_SUCCESS, GET_ALL_DOMAIN_FAILED];
  entity = [cfEntityFactory(domainEntityType)];
  entityType = domainEntityType;
  options: HttpRequest<any>;
  initialParams = {
    'results-per-page': 100,
  };
}
