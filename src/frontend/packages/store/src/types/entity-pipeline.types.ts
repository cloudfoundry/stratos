import type { HttpRequest } from '@angular/common/http';
import type { Action, Store } from './action.types';
import type { Observable } from 'rxjs';

import type { AppState, GeneralEntityAppState, InternalAppState } from '../app-state';
import type {
  StratosBaseCatalogEntity,
} from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import type { JetStreamErrorResponse } from '../jetstream';
import type { EntityInfo, NormalizedResponse } from './api.types';
import type { EndpointUser } from './endpoint.types';
import type { PaginatedAction, PaginationEntityState } from './pagination.types';
import type { EntityRequestAction } from './request.types';

// --- Relocated from the deleted entity-request-pipeline/pipeline.types.ts ---

export const stratosEndpointGuidKey = '__stratosEndpointGuid__';

export interface EntityPipelineEntity {
  __stratosEndpointGuid__?: string;
}

// --- Relocated from the deleted entity-request-base-handlers/handle-multi-endpoints.pipe.ts ---
// Still referenced as a config type by cloud-foundry's cf-entity-generator
// (globalErrorMessageHandler / getTotalPages / getTotalEntities) and the
// entity-catalog definition interfaces.

/**
 * Generic container for information about an errored request to a specific endpoint
 */
export class JetstreamError<T = any> {
  constructor(
    public errorCode: string,
    public guid: string,
    public url: string,
    /**
     * Actual content of response from backend
     */
    public jetstreamErrorResponse: JetStreamErrorResponse<T>
  ) { }
}

// --- Relocated from the deleted entity-request-pipeline/entity-request-pipeline.types.ts ---
// These remain the public config shapes carried by entity-catalog definitions
// (errorMessageHandler, preRequest, prePaginationRequest, fetch/emit handlers,
// successfulRequestDataMapper) even though the runtime pipeline that consumed
// them has been removed.

export interface JetstreamResponse<T = any> {
  [endpointGuid: string]: T;
}

export interface PagedJetstreamResponse<T = any> {
  [endpointId: string]: T[] | JetStreamErrorResponse[];
}

export type SuccessfulApiResponseDataMapper<O = any, I = O> = (
  response: I,
  endpointGuid: string,
  guid: string,
  entityType: string,
  endpointType: string,
  action: EntityRequestAction
) => O;

export type PreApiRequest = (
  request: HttpRequest<any>,
  action: EntityRequestAction,
  catalogEntity: StratosBaseCatalogEntity
) => HttpRequest<any> | Observable<HttpRequest<any>>;

export type PrePaginationApiRequest = (
  request: HttpRequest<any>,
  action: PaginatedAction,
  catalogEntity: StratosBaseCatalogEntity,
  appState: InternalAppState
) => HttpRequest<any> | Observable<HttpRequest<any>>;

export type ApiErrorMessageHandler = (
  errors: JetstreamError[]
) => string;

export type EntityInfoHandler = (action: EntityRequestAction, actionDispatcher: ActionDispatcher) => (entityInfo: EntityInfo) => void;

export type EntitiesInfoHandler = (
  action: PaginatedAction | PaginatedAction[],
  actionDispatcher: ActionDispatcher,
) => (
    state: PaginationEntityState,
  ) => void;

export type EntityFetch<T = any> = (entity: T) => void;
export type EntityFetchHandler<T = any> = (store: Store<GeneralEntityAppState>, action: EntityRequestAction) => EntityFetch<T>;
export type EntitiesFetchHandler = (store: Store<GeneralEntityAppState>, actions: PaginatedAction[]) => () => void;

export interface EntityUserRolesEndpoint {
  user?: EndpointUser;
  guid?: string;
}

export type EntityUserRolesFetch = (
  endpoints: string[] | EntityUserRolesEndpoint[],
  store: Store<AppState>,
  httpClient: import('@angular/common/http').HttpClient,
  endpointsService: import('../services/endpoints-data.service').EndpointsDataService
) => Observable<boolean>;

// --- Relocated from the deleted pagination-request-base-handlers/pagination-iterator.pipe.ts ---

export interface PaginationPageIteratorConfig<R = any, E = any> {
  // TODO This should also pass page size for apis that use start=&end= params.
  getPaginationParameters: (page: number) => Record<string, string>;
  getTotalPages: (initialResponses: JetstreamResponse<R>) => number;
  getTotalEntities: (initialResponses: JetstreamResponse<R>) => number;
  getEntitiesFromResponse: (responses: R) => E[];
  /**
   * After fetching the first page check that the total number of entities does not exceed this number.
   * If so do not fetch other pages and enter 'maxed' error mode
   * Only applicable to 'local' collections (everything is fetch up front and paginated locally)
   *
   * Optional: the legacy pagination iterator that consumed this is gone (the signal-native maxed-state
   * lives in core `maxed-state.signal.ts`); the field is retained only so existing inert paginationConfig
   * declarations keep type-checking.
   */
  maxedStateStartAt?: (store: Store<AppState>, action: PaginatedAction) => Observable<number>;
  /**
   * If the collection has entered 'maxed' error mode, can the user ignore and fetch all results regardless (see `maxedStateStartAt`)?
   */
  canIgnoreMaxedState?: (store: Store<AppState>) => Observable<boolean>;
}

// --- Relocated from the deleted entity-request-pipeline/entity-request-pipeline.types.ts ---

export type ActionDispatcher<T extends Action = Action> = (action: T) => void;

// --- Relocated from the deleted reducers/api-request-reducer/types.ts ---
// Request/action state shapes still consumed by surviving signal data services,
// the kube registration types and CF endpoint/application services.

export const rootUpdatingKey = '_root_';

export interface ActionState {
  busy: boolean;
  error: boolean;
  message: string;
}

// Status of an action
export interface ActionStatus {
  busy: boolean;
  error: boolean;
  message?: string;
  completed: boolean;
}

/**
 * Multi action lists can have different entity types per page
 * We use schemaKey to track this type
 */
export interface ListActionState extends ActionState {
  entityConfig?: EntityCatalogEntityConfig;
  /**
   * Does the collection size exceed the max allowed? Used in conjunction PaginationEntityState maxedMode.
   */
  maxed?: boolean;
  baseEntityConfig?: EntityCatalogEntityConfig;
}

export interface DeleteActionState extends ActionState {
  deleted: boolean;
}

export const getDefaultActionState = (): ActionState => ({
  busy: false,
  error: false,
  message: ''
});

export const defaultDeletingActionState = {
  busy: false,
  error: false,
  message: '',
  deleted: false
};

export interface UpdatingSection {
  [rootUpdatingKey]: ActionState;
  [key: string]: ActionState;
}

export interface RequestInfoState {
  fetching: boolean;
  updating: UpdatingSection;
  creating: boolean;
  deleting: DeleteActionState;
  error: boolean;
  response?: any;
  message: string;
}

const defaultRequestState = {
  fetching: false,
  updating: {
    [rootUpdatingKey]: getDefaultActionState()
  },
  creating: false,
  error: false,
  deleting: { ...defaultDeletingActionState },
  response: null as any,
  message: ''
};

export function getDefaultRequestState() {
  return { ...defaultRequestState };
}
