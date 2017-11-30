import { CFAction, IAPIAction, ICFAction } from '../types/request.types';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { ApiActionTypes } from './request.actions';
import { SpaceSchema } from './space.actions';
import { StackSchema } from './stack.action';
import { ActionMergeFunction } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';
import { NewApplication } from '../types/application.types';
import { pick } from '../helpers/reducer.helper';

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

const ApplicationEntiySchema = {
  entity: {
    stack: StackSchema,
    space: SpaceSchema
  }
};

export const ApplicationSchema = new schema.Entity('application', ApplicationEntiySchema, {
  idAttribute: getAPIResourceGuid
});

export class GetAllApplications implements PaginatedAction {

  private static sortField = 'creation'; // This is the field that 'order-direction' is applied to. Cannot be changed

  constructor(public paginationKey: string) {
    this.options = new RequestOptions();
    this.options.url = 'apps';
    this.options.method = 'get';
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
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': GetAllApplications.sortField,
    page: 1,
    'results-per-page': 50,
    'inline-relations-depth': 2
  };
}

export class GetApplication extends CFAction implements ICFAction {
  constructor(public guid: string, public cnis: string) {
    super();
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

export class CreateNewApplication extends CFAction implements ICFAction {
  constructor(public guid: string, public cnis: string, application: NewApplication) {
    super();
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

export class AssociateRouteWithAppApplication extends CFAction implements ICFAction {
  constructor(public guid: string, public routeGuid: string, public cnis: string) {
    super();
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
  state?: string;
}


// declare function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;

export class UpdateExistingApplication extends CFAction implements ICFAction {
  static updateKey = 'Updating-Existing-Application';

  constructor(public guid: string, public cnis: string, application: UpdateApplication) {
    super();
    this.options = new RequestOptions();
    this.options.url = `apps/${guid}`;
    this.options.method = 'put';
    this.options.body = application;
    // TODO: Ensure all failure style information is captured in non-passthrough result
    // this.options.headers = new Headers();
    // const cnsiPassthroughHeader = 'x-cap-passthrough';
    // this.options.headers.set(cnsiPassthroughHeader, 'true');
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
  updatingKey = UpdateExistingApplication.updateKey;
  entityMerge: ActionMergeFunction = (oldEntities, newEntities) => {
    const keepFromOld = pick(oldEntities[ApplicationSchema.key][this.guid].entity, Object.keys(ApplicationEntiySchema.entity) as [string]);
    newEntities[ApplicationSchema.key][this.guid].entity = { ...newEntities[ApplicationSchema.key][this.guid].entity, ...keepFromOld };
    return newEntities;
  }
}

export class DeleteApplication extends CFAction implements ICFAction {
  static updateKey = 'Deleting-Existing-Application';

  constructor(public guid: string, public cnis: string) {
    super();
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
