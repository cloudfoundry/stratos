import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { getAPIResourceGuid } from './api.actions';
import { APIAction, ApiActionTypes } from './api.actions';
import { SpaceSchema } from './space.actions';

export const GET_ALL = '[Application] Get all';
export const GET_ALL_SUCCESS = '[Application] Get all success';
export const GET_ALL_FAILED = '[Application] Get all failed';

export const GET = '[Application] Get one';
export const GET_SUCCESS = '[Application] Get one success';
export const GET_FAILED = '[Application] Get one failed';

export const CREATE = '[Application] Create';
export const CREATE_SUCCESS = '[Application] Create success';
export const CREATE_FAILED = '[Application] Create failed';

export const ASSIGN_ROUTE = '[Application] Assign route';
export const ASSIGN_ROUTE_SUCCESS = '[Application] Assign route success';
export const ASSIGN_ROUTE_FAILED = '[Application] Assign route failed';


// ###### Move these schemas - NJ
export const StackSchema = new schema.Entity('stack', {}, {
    idAttribute: getAPIResourceGuid
});
// ######


export const ApplicationSchema = new schema.Entity('application', {
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
        this.options.params.set('inline-relations-depth', '1');
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
    entity = [ApplicationSchema];
    entityKey = ApplicationSchema.key;
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

export class AssociateRouteWithAppApplication implements APIAction {
    constructor(public guid: string, public routeGuid: string, public cnis: string) {
        this.options = new RequestOptions();
        this.options.url = `apps/${guid}/routes/${routeGuid}`;
        this.options.method = 'put';
    }
    actions = [
        ASSIGN_ROUTE,
        ASSIGN_ROUTE_SUCCESS,
        ASSIGN_ROUTE_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [ApplicationSchema];
    entityKey = ApplicationSchema.key;
    options: RequestOptions;
    updatingKey = 'Assigning-Route';
}
