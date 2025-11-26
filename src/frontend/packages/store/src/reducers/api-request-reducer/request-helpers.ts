import type { Store } from '@ngrx/store';

import type { APIResponse } from '../../actions/request.actions';
import type { BaseRequestState, GeneralAppState } from '../../app-state';
import type { BaseEntityRequestAction } from '../../entity-catalog/action-orchestrator/action-orchestrator';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import type { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { mergeState } from '../../helpers/reducer.helper';
import type { NormalizedResponse } from '../../types/api.types';
import type { PaginatedAction } from '../../types/pagination.types';
import {
  APISuccessOrFailedAction,
  type EntityRequestAction,
  type ICFAction,
  type InternalEndpointError,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../types/request.types';
import { defaultDeletingActionState, getDefaultRequestState, type RequestInfoState, rootUpdatingKey } from './types';

export function getEntityRequestState(
  state: BaseRequestState,
  actionOrKey: BaseEntityRequestAction | string,
  guid: string = (actionOrKey as BaseEntityRequestAction).guid
): RequestInfoState {
  const entityKey = getKeyFromActionOrKey(actionOrKey);
  const requestState = { ...state[entityKey][guid] };
  if (requestState && typeof requestState === 'object' && Object.keys(requestState).length) {
    return requestState;
  }
  return getDefaultRequestState();
}

export function setEntityRequestState(
  state: BaseRequestState,
  requestState: RequestInfoState,
  actionOrKey: BaseEntityRequestAction | string,
  guid: string = (actionOrKey as BaseEntityRequestAction).guid
) {
  const entityKey = getKeyFromActionOrKey(actionOrKey);
  const newState = {
    [entityKey]: {
      [guid]: {
        ...requestState
      }
    }
  };
  return mergeState(state, newState);
}

function getKeyFromActionOrKey(actionOrKey: BaseEntityRequestAction | string) {
  if (typeof actionOrKey === 'string') {
    return actionOrKey;
  }
  return entityCatalog.getEntityKey(actionOrKey) || actionOrKey.entityType;
}

export function createRequestStateFromResponse(
  response: NormalizedResponse,
  state: BaseRequestState
) {
  if (!response || !response.entities) {
    return state;
  }
  const { entities } = response;
  let newState = { ...state };
  Object.keys(entities).forEach((entityKey: string) => {
    Object.keys(entities[entityKey]).forEach((guid: string) => {
      const entState = getEntityRequestState(state, entityKey, guid);
      entState.fetching = entState.fetching || false;
      entState.error = entState.error || false;
      const busy = entState.deleting ? entState.deleting.busy : false;
      entState.deleting = { ...defaultDeletingActionState, busy };
      newState = setEntityRequestState(newState, entState, entityKey, guid);
    });
  });
  return newState;
}

export type ApiRequestTypes = 'fetch' | 'update' | 'create' | 'delete';

export function getRequestTypeFromMethod(action: EntityRequestAction): ApiRequestTypes {
  let method = action.options ? action.options.method : undefined;
  if (typeof method === 'string') {
    method = method.toString().toLowerCase();
    if (method === 'post') {
      return 'create';
    }
    if (method === 'put') {
      return 'update';
    }
    if (method === 'delete') {
      return 'delete';
    }
  }
  return 'fetch';
}

export function modifyRequestWithRequestType(requestState: RequestInfoState, type: ApiRequestTypes) {
  if (type === 'fetch') {
    requestState.fetching = true;
  } else if (type === 'create') {
    requestState.creating = true;
  } else if (type === 'delete') {
    requestState.deleting = { ...defaultDeletingActionState, busy: true };
  }

  return requestState;
}

/**
 * Merge the content of a new object into another object
 */
export function mergeObject<T extends Record<string, unknown>>(coreObject: T, newObject: Partial<T>): T {
  return {
    ...coreObject,
    ...newObject
  };
}

/**
 * Merge the content of a new object into a property of another's
 */
export function mergeInnerObject<T extends Record<string, unknown>>(key: string, state: T, newObject: Record<string, unknown>): T {
  return {
    ...state,
    [key]: mergeObject(state[key] as Record<string, unknown>, newObject)
  } as T;
}

export function mergeUpdatingState(
  apiAction: BaseEntityRequestAction,
  updatingState: import('./types').UpdatingSection,
  newUpdatingState: Partial<import('./types').ActionState>
): import('./types').UpdatingSection {
  const updateKey = apiAction.updatingKey || rootUpdatingKey;
  return mergeInnerObject(updateKey, updatingState as Record<string, unknown>, newUpdatingState as Record<string, unknown>) as import('./types').UpdatingSection;
}

export function generateDefaultState(keys: Array<string>, initialSections?: {
  [key: string]: string[];
}) {
  const defaultState = {} as BaseRequestState;

  keys.forEach((key: string) => {
    defaultState[key] = {};
    if (initialSections?.[key]?.length) {
      initialSections[key].forEach((sectionKey: string) => {
        defaultState[key][sectionKey] = getDefaultRequestState();
      });
    }
  });
  return defaultState;
}


export function startApiRequest<T extends GeneralAppState = GeneralAppState>(
  store: Store<T>,
  apiAction: ICFAction | PaginatedAction,
  requestType: ApiRequestTypes = 'fetch'
) {
  store.dispatch(new StartRequestAction(apiAction, requestType));
  store.dispatch(getActionFromString(apiAction.actions[0]));
}

export function completeApiRequest<T extends GeneralAppState = GeneralAppState>(
  store: Store<T>,
  apiAction: ICFAction | PaginatedAction,
  apiResponse: APIResponse,
  requestType: ApiRequestTypes = 'fetch',
) {
  store.dispatch(new APISuccessOrFailedAction(apiAction.actions[1], apiAction, apiResponse.response));
  store.dispatch(new WrapperRequestActionSuccess(
    apiResponse.response,
    apiAction,
    requestType,
    apiResponse.totalResults,
    apiResponse.totalPages
  ));
}

export function failApiRequest<T extends GeneralAppState = GeneralAppState>(
  store: Store<T>,
  apiAction: EntityRequestAction,
  error: Error & { message: string },
  catalogEntity: StratosBaseCatalogEntity,
  requestType: ApiRequestTypes = 'fetch',
  internalEndpointError?: InternalEndpointError
) {
  const actions = getFailApiRequestActions(
    apiAction,
    error,
    requestType,
    catalogEntity,
    internalEndpointError
  );
  store.dispatch(actions[0]);
  store.dispatch(actions[1]);
}

export function getFailApiRequestActions(
  apiAction: EntityRequestAction,
  error: Error & { message: string },
  requestType: ApiRequestTypes = 'fetch',
  catalogEntity: StratosBaseCatalogEntity,
  internalEndpointError?: InternalEndpointError,
) {
  return [
    new APISuccessOrFailedAction(catalogEntity.getRequestType('failure', apiAction), apiAction, error.message),
    new WrapperRequestActionFailed(
      error.message,
      apiAction,
      requestType,
      internalEndpointError
    )
  ];
}

export function getActionFromString(type: string) {
  return { type };
}
