import { CFStartAction, IRequestAction, ICFAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { schema } from 'normalizr';
import { ApiActionTypes } from './request.actions';
import { RequestOptions } from '@angular/http';

export const GET = '[Organisation] Get one';
export const GET_SUCCESS = '[Organisation] Get one success';
export const GET_FAILED = '[Organisation] Get one failed';

export const OrganisationSchema = new schema.Entity('organization', {}, {
  idAttribute: getAPIResourceGuid
});

export class GetOrganisation extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organization/${guid}`;
    this.options.method = 'get';
  }
  actions = [
    GET,
    GET_SUCCESS,
    GET_FAILED
  ];
  entity = [OrganisationSchema];
  entityKey = OrganisationSchema.key;
  options: RequestOptions;
}
