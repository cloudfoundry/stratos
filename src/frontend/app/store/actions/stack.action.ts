import { RequestOptions } from '@angular/http';

import { entityFactory } from '../helpers/entity-factory';
import { CFStartAction, ICFAction } from '../types/request.types';
import { schema } from 'normalizr';
import { stackSchemaKey } from '../helpers/entity-factory';

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
