import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { getAPIResourceGuid } from './api.actions';
import { APIAction, ApiActionTypes } from './api.actions';
import { SpaceSchema } from './space.actions';
import { StackSchema } from './stack.action';

export const GET_ALL = '[Application] Get all';
export const GET_ALL_SUCCESS = '[Application] Get all success';
export const GET_ALL_FAILED = '[Application] Get all failed';

export const GET = '[Application] Get one';
export const GET_SUCCESS = '[Application] Get one success';
export const GET_FAILED = '[Application] Get one failed';

export const CREATE = '[Application] Create';
export const CREATE_SUCCESS = '[Application] Create success';
export const CREATE_FAILED = '[Application] Create failed';


export const ApplicationSchema = new schema.Entity('application', {
    entity: {
        stack: StackSchema,
        space: SpaceSchema
    }
}, {
        idAttribute: getAPIResourceGuid
    });

export const ApplicationSummarySchema = new schema.Entity('applicationSummary', {
    entity: {
        stack: StackSchema,
        space: SpaceSchema
    }
}, {
        idAttribute: getAPIResourceGuid
    });


export class GetAllApplications implements APIAction {
    constructor(public paginationKey?: string) {
        this.options = new RequestOptions();
        this.options.url = 'apps';
        this.options.method = 'get';
        this.options.params = new URLSearchParams();
        this.options.params.set('page', '1');
        this.options.params.set('results-per-page', '100');
        this.options.params.set('inline-relations-depth', '2');
    }
    actions = [
        GET_ALL,
        GET_ALL_SUCCESS,
        GET_ALL_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [ApplicationSchema];
    entityKey = ApplicationSchema.key;
    options: RequestOptions;
}

export class GetApplication implements APIAction {
    constructor(public guid: string, public cnis: string) {
        this.options = new RequestOptions();
        this.options.url = `apps/${guid}`;
        this.options.method = 'get';
        this.options.params = new URLSearchParams();
        this.options.params.set('inline-relations-depth', '2');
        this.options.params.set('include-relations', 'space,organization,stack');

    }
    actions = [
        GET,
        GET_SUCCESS,
        GET_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [ApplicationSchema];
    entityKey = ApplicationSchema.key;
    options: RequestOptions;
}


export class GetApplicationSummary implements APIAction {
    constructor(public guid: string, public cnis: string) {
        this.options = new RequestOptions();
        this.options.url = `apps/${guid}/summary`;
        this.options.method = 'get';
    }
    actions = [
        GET,
        GET_SUCCESS,
        GET_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [ApplicationSummarySchema];
    entityKey = ApplicationSummarySchema.key;
    options: RequestOptions;
}

export interface NewApplication {
    name: string;
    space_guid: string;
}
export class CreateNewApplication implements APIAction {
    constructor(public guid: string, public cnis: string, application: NewApplication) {
        this.options = new RequestOptions();
        this.options.url = `apps`;
        this.options.method = 'post';
        this.options.body = {
            name: application.name,
            space_guid: application.space_guid
        };
    }
    actions = [
        CREATE,
        CREATE_SUCCESS,
        CREATE_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [ApplicationSchema];
    entityKey = ApplicationSchema.key;
    options: RequestOptions;
}
