import { CFStartAction, IRequestAction, ICFAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { schema } from 'normalizr';
import { ApiActionTypes } from './request.actions';
import { RequestOptions } from '@angular/http';
import { getActions } from './action.helper';
import { PaginatedAction } from '../types/pagination.types';

export const GET = '[Stack] Get one';
export const GET_SUCCESS = '[Stack] Get one success';
export const GET_FAILED = '[Stack] Get one failed';

export const StackSchema = new schema.Entity('stack', {}, {
  idAttribute: getAPIResourceGuid
});

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
  entity = [StackSchema];
  entityKey = StackSchema.key;
  options: RequestOptions;
}
export class GetAllStacks extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `stacks`;
    this.options.method = 'get';
  }
  actions = getActions('Stack', 'Fetch all');
  entity = [StackSchema];
  entityKey = StackSchema.key;
  options: RequestOptions;
}
