import { getPaginationKey } from './app-metadata.actions';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, IRequestAction, ICFAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { schema } from 'normalizr';
import { ApiActionTypes } from './request.actions';
import { RequestOptions, URLSearchParams } from '@angular/http';

export const GET = '[Shared Domains] Get All';
export const GET_SUCCESS = '[Shared Domains] Get one success';
export const GET_FAILED = '[Shared Domains] Get one failed';

export const DomainsSchema = new schema.Entity('domain', {}, {
  idAttribute: getAPIResourceGuid
});

export class GetSharedDomains extends CFStartAction implements PaginatedAction {
  constructor(
    public cfGuid: string
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `shared_domains`;
    this.options.method = 'get';
    this.cfGuid = cfGuid;
    this.options.params = new URLSearchParams();
    this.options.params.append('', '');
  }
  actions = [
    GET,
    GET_SUCCESS,
    GET_FAILED
  ];
  entity = [DomainsSchema];
  entityKey = DomainsSchema.key;
  paginationKey = getPaginationKey(this.entityKey, this.cfGuid, '');
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
  };
}
