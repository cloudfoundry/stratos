import { CFStartAction, IRequestAction, ICFAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { schema } from 'normalizr';
import { ApiActionTypes } from './request.actions';
import { RequestOptions } from '@angular/http';

export const GET = '[Stack] Get one';
export const GET_SUCCESS = '[Stack] Get one success';
export const GET_FAILED = '[Stack] Get one failed';

export const StackSchema = new schema.Entity('stack', {}, {
  idAttribute: getAPIResourceGuid
});

export class GetStack extends CFStartAction implements ICFAction {
  constructor(public guid: string, public cnis: string) {
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
