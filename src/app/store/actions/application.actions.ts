import { normalize, schema } from 'normalizr';
import { RequestOptions, URLSearchParams } from '@angular/http';
import { ApiActionTypes, APIAction } from './api.actions';

export const GET_ALL = '[Application] Get all';
export const GET_ALL_SUCCESS = '[Application] Get all success';
export const GET_ALL_FAILED = '[Application] Get all failed';

export const applicationSchema = new schema.Entity('application', {}, {
    idAttribute: 'guid'
});

export class GetAllApplications implements APIAction {
    constructor(public paginationKey?: string) {
        this.options = new RequestOptions();
        this.options.url = 'apps';
        this.options.method = 'get';
        this.options.params = new URLSearchParams();
        this.options.params.set('page', '1');
        this.options.params.set('results-per-page', '100');

    }
    actions = [
        GET_ALL,
        GET_ALL_SUCCESS,
        GET_ALL_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [applicationSchema];
    entityKey = applicationSchema.key;
    options: RequestOptions;
}
