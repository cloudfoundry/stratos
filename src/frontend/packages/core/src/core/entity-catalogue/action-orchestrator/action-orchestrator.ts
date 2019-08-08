import { Action } from '@ngrx/store';

import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import {
  EntityRequestAction, StartAction,
} from '../../../../../store/src/types/request.types';
import { EntityActionDispatcherManager } from '../action-dispatcher/action-dispatcher';
import { EntitySchema } from '../../../../../store/src/helpers/entity-schema';
import { HttpRequest, HttpHeaders, HttpParams } from '@angular/common/http';
import { Omit } from '../../utils.service';


// A function that returns a ICFAction
export type OrchestratedActionBuilder<
  T extends any[]= any[],
  Y extends Action = Action
  > = (...args: T) => Y;


export type KnownEntityActionBuilder<T extends any[]= any[]> = (guid: string, endpointGuid: string, ...args: T) => EntityRequestAction;
// createTrackingId should be unique to the thing that's being created.
// It is used to track the status of the entity creation.
type CreateActionBuilder<T extends any[]= any[]> = (createTrackingId: string, endpointGuid: string, ...args: T) => EntityRequestAction;
// paginationKey could be optional, we could give it a default value.
export type GetMultipleActionBuilder<T extends any[]= any[]> = (
  endpointGuid: string,
  paginationKey?: string,
  ...args: T
) => PaginatedAction;

// This is used to create a basic single entity pipeline action.
export class EntityRequestActionConfig<T extends OrchestratedActionBuilder> {
  constructor(
    public getUrl: (...args: Parameters<T>) => string,
    public requestConfig: BaseEntityRequestConfig = {},
    public schemaKey: string = null,
    public externalRequest: boolean = false
  ) { }
}


export class PaginationRequestActionConfig<T extends OrchestratedActionBuilder> {
  constructor(
    public paginationKey: string,
    public getUrl: (...args: Parameters<T>) => string,
    public requestConfig: BasePaginationRequestConfig = {},
    public schemaKey: string = null,
    public externalRequest: boolean = false
  ) { }
}

export interface BaseEntityRequestConfig {
  httpMethod?: BaseEntityRequestMethods;
  requestInit?: {
    headers?: HttpHeaders;
    reportProgress?: boolean;
    params?: HttpParams;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
    withCredentials?: boolean;
  };
  requestBody?: any;
}

export type BasePaginationRequestConfig = Omit<BaseEntityRequestConfig, 'httpMethod'>;

export type BaseEntityRequestMethods = 'DELETE' | 'GET' | 'HEAD' | 'JSONP' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH';

export class BaseRequestAction extends StartAction {
  constructor(
    public entity: EntitySchema,
    public endpointGuid: string | null,
    public entityType: string,
    public endpointType: string,
    public metadata: any[] = [],
    public jetstreamRequest: boolean = true
  ) {
    super();
  }
}

export class BaseEntityRequestAction extends BaseRequestAction implements EntityRequestAction {
  public options: HttpRequest<any>;
  constructor(
    public entity: EntitySchema,
    public guid: string,
    public endpointGuid: string | null,
    public entityType: string,
    public endpointType: string,
    url: string,
    requestConfig: BaseEntityRequestConfig,
    public metadata: any[] = [],
    public jetstreamRequest: boolean = true
  ) {
    super(entity, endpointGuid, entityType, endpointType, metadata, jetstreamRequest);
    this.options = new HttpRequest(requestConfig.httpMethod || 'GET', url, requestConfig.requestBody, requestConfig.requestInit);
  }
}

export class BasePaginationRequestAction extends BaseRequestAction implements EntityRequestAction {
  public options: HttpRequest<any>;
  constructor(
    public entity: EntitySchema,
    // If pagination key is null then we expect it to come from the action builder.
    public paginationKey: string | null,
    public endpointGuid: string | null,
    public entityType: string,
    public endpointType: string,
    url: string,
    requestConfig: BasePaginationRequestConfig,
    public metadata: any[] = [],
    public jetstreamRequest: boolean = true

  ) {
    super(entity, endpointGuid, entityType, endpointType, metadata, jetstreamRequest);
    this.options = new HttpRequest('GET', url, requestConfig.requestBody, requestConfig.requestInit);
  }
}


// A list of functions that can be used get interface with the entity
export interface StratosOrchestratedActionBuilders {
  get?: KnownEntityActionBuilder;
  remove?: KnownEntityActionBuilder;
  update?: KnownEntityActionBuilder;
  create?: CreateActionBuilder;
  getMultiple?: GetMultipleActionBuilder;
  [actionType: string]: OrchestratedActionBuilder;
}
export interface OrchestratedActionBuilderConfig {
  get?: KnownEntityActionBuilder | EntityRequestActionConfig<KnownEntityActionBuilder>;
  remove?: KnownEntityActionBuilder | EntityRequestActionConfig<KnownEntityActionBuilder>;
  update?: KnownEntityActionBuilder | EntityRequestActionConfig<KnownEntityActionBuilder>;
  create?: CreateActionBuilder | EntityRequestActionConfig<CreateActionBuilder>;
  getMultiple?: GetMultipleActionBuilder | PaginationRequestActionConfig<GetMultipleActionBuilder>;
  [actionType: string]: OrchestratedActionBuilder |
  EntityRequestActionConfig<KnownEntityActionBuilder> |
  PaginationRequestActionConfig<GetMultipleActionBuilder>;
}

export class OrchestratedActionBuildersClass implements StratosOrchestratedActionBuilders {
  [actionType: string]: OrchestratedActionBuilder<any[], EntityRequestAction>;
}
export class ActionOrchestrator<T extends StratosOrchestratedActionBuilders = StratosOrchestratedActionBuilders> {
  public getEntityActionDispatcher(actionDispatcher?: (action: Action) => void) {
    return new EntityActionDispatcherManager<T>(actionDispatcher, this);
  }

  public getActionBuilder<Y extends keyof T>(actionType: Y): T[Y] {
    return this.actionBuilders[actionType];
  }

  public hasActionBuilder(actionType: keyof T) {
    return !!this.actionBuilders[actionType];
  }

  constructor(public entityKey: string, private actionBuilders: T = {} as T) { }
}
