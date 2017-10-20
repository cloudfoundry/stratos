import { schema } from 'normalizr';
import { getAPIResourceGuid, ApiActionTypes } from './api.actions';
import { RequestOptions } from '@angular/http';
import { OrganisationSchema } from './organisation.action';
import { APIAction } from '../types/api.types';

export const GET = '[Space] Get one';
export const GET_SUCCESS = '[Space] Get one success';
export const GET_FAILED = '[Space] Get one failed';

export const SpaceSchema = new schema.Entity('space', {
  entity: {
    organization: OrganisationSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export class GetSpace implements APIAction {
  constructor(public guid: string, public cnis: string) {
    this.options = new RequestOptions();
    this.options.url = `space/${guid}`;
    this.options.method = 'get';
  }
  actions = [
    GET,
    GET_SUCCESS,
    GET_FAILED
  ];
  type = ApiActionTypes.API_REQUEST;
  entity = [SpaceSchema];
  entityKey = SpaceSchema.key;
  options: RequestOptions;
}
