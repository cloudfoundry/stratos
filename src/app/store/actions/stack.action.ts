import { schema } from 'normalizr';
import { getAPIResourceGuid, APIAction, ApiActionTypes } from './api.actions';
import { RequestOptions } from '@angular/http';

export const GET = '[Stack] Get one';
export const GET_SUCCESS = '[Stack] Get one success';
export const GET_FAILED = '[Stack] Get one failed';

export const StackSchema = new schema.Entity('stack', {}, {
    idAttribute: getAPIResourceGuid
});

export class GetStack implements APIAction {
    constructor(public guid: string, public cnis: string) {
        this.options = new RequestOptions();
        this.options.url = `stacks/${guid}`;
        this.options.method = 'get';
    }
    actions = [
        GET,
        GET_SUCCESS,
        GET_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [StackSchema];
    entityKey = StackSchema.key;
    options: RequestOptions;
}
