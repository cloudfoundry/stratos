import { Headers, RequestOptions, URLSearchParams } from '@angular/http';
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

export const GET_SUMMARY = '[Application] Get summary';
export const GET_SUMMARY_SUCCESS = '[Application] Get summary success';
export const GET_SUMMARY_FAILED = '[Application] Get summary failed';

export const CREATE = '[Application] Create';
export const CREATE_SUCCESS = '[Application] Create success';
export const CREATE_FAILED = '[Application] Create failed';

export const UPDATE = '[Application] Update';
export const UPDATE_SUCCESS = '[Application] Update success';
export const UPDATE_FAILED = '[Application] Update failed';

export const ASSIGN_ROUTE = '[Application] Assign route';
export const ASSIGN_ROUTE_SUCCESS = '[Application] Assign route success';
export const ASSIGN_ROUTE_FAILED = '[Application] Assign route failed';

export const DELETE = '[Application] Delete';
export const DELETE_SUCCESS = '[Application] Delete success';
export const DELETE_FAILED = '[Application] Delete failed';


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

export interface UpdateApplication {
    name?: string;
    instances?: number;
    memory?: number;
    enable_ssh?: boolean;
    environment_json?: any;
}

export class UpdateExistingApplicationBase implements APIAction {
    static updateKey = 'Updating-Existing-Application';

    constructor(public guid: string, public cnis: string, application: UpdateApplication) {
        this.options = new RequestOptions();
        this.options.url = `apps/${guid}`;
        this.options.method = 'put';
        this.options.body = application;
        this.options.headers = new Headers();
        const cnsiPassthroughHeader = 'x-cap-passthrough';
        this.options.headers.set(cnsiPassthroughHeader, 'true');
    }
    actions = [
        UPDATE,
        UPDATE_SUCCESS,
        UPDATE_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [ApplicationSchema];
    entityKey = ApplicationSchema.key;
    options: RequestOptions;
}
export class UpdateExistingApplication extends UpdateExistingApplicationBase {
    static updateKey = 'Updating-Existing-Application';

    constructor(public guid: string, public cnis: string, application: UpdateApplication) {
        super(guid, cnis, application);
    }

    updatingKey = UpdateExistingApplication.updateKey;
}

export class DeleteApplication implements APIAction {
    static updateKey = 'Updating-Existing-Application';

    constructor(public guid: string, public cnis: string) {
        this.options = new RequestOptions();
        this.options.url = `apps/${guid}`;
        this.options.method = 'delete';
        this.options.headers = new Headers();
        const cnsiPassthroughHeader = 'x-cap-passthrough';
        this.options.headers.set(cnsiPassthroughHeader, 'true');
    }
    actions = [
        DELETE,
        DELETE_SUCCESS,
        DELETE_FAILED
    ];
    type = ApiActionTypes.API_REQUEST;
    entity = [ApplicationSchema];
    entityKey = ApplicationSchema.key;
    options: RequestOptions;
}
// TODO: RC Factor into own process outside of entity update
export class UpdateExistingApplicationEnvVar extends UpdateExistingApplicationBase {
    static updateKey = 'Updating-Existing-Application-Env-Var';

    constructor(public guid: string, public cnis: string, application: UpdateApplication) {
        super(guid, cnis, application);
    }
    updatingKey = UpdateExistingApplicationEnvVar.updateKey;

}

