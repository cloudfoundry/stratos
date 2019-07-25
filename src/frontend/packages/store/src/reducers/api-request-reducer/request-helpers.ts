import { RequestMethod } from '@angular/http';
import { Store } from '@ngrx/store';

import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { pathGet } from '../../../../core/src/core/utils.service';
import { APIResponse } from '../../actions/request.actions';
import { BaseRequestState, GeneralAppState } from '../../app-state';
import { mergeState } from '../../helpers/reducer.helper';
import { NormalizedResponse } from '../../types/api.types';
import { PaginatedAction } from '../../types/pagination.types';
import {
  APISuccessOrFailedAction,
  ICFAction,
  InternalEndpointError,
  SingleEntityAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
  EntityRequestAction,
} from '../../types/request.types';
import { defaultDeletingActionState, getDefaultRequestState, RequestInfoState, rootUpdatingKey } from './types';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';

export function getEntityRequestState(
  state: BaseRequestState,
  actionOrKey: SingleEntityAction | string,
  guid: string = (actionOrKey as SingleEntityAction).guid
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
  requestState,
  actionOrKey: SingleEntityAction | string,
  guid: string = (actionOrKey as SingleEntityAction).guid
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

function getKeyFromActionOrKey(actionOrKey: SingleEntityAction | string) {
  if (typeof actionOrKey === 'string') {
    return actionOrKey;
  }
  return entityCatalogue.getEntityKey(actionOrKey) || actionOrKey.entityType;
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
  Object.keys(entities).forEach(entityKey => {
    Object.keys(entities[entityKey]).forEach(guid => {
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
  let method = pathGet('options.method', action);
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
  } else if (typeof method === 'number') {
    if (method === RequestMethod.Post) {
      return 'create';
    }
    if (method === RequestMethod.Put) {
      return 'update';
    }
    if (method === RequestMethod.Delete) {
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
export function mergeObject(coreObject, newObject) {
  return {
    ...coreObject,
    ...newObject
  };
}

/**
 * Merge the content of a new object into a property of another's
 */
export function mergeInnerObject(key, state, newObject) {
  return {
    ...state,
    [key]: mergeObject(state[key], newObject)
  };
}

export function mergeUpdatingState(apiAction, updatingState, newUpdatingState) {
  const updateKey = apiAction.updatingKey || rootUpdatingKey;
  return mergeInnerObject(updateKey, updatingState, newUpdatingState);
}

export function generateDefaultState(keys: Array<string>, initialSections?: {
  [key: string]: string[];
}) {
  const defaultState = {} as BaseRequestState;

  keys.forEach(key => {
    defaultState[key] = {};
    if (initialSections && initialSections[key] && initialSections[key].length) {
      initialSections[key].forEach(sectionKey => {
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
  error,
  requestType: ApiRequestTypes = 'fetch',
  catalogueEntity: StratosBaseCatalogueEntity,
  internalEndpointError?: InternalEndpointError
) {
  const actions = getFailApiRequestActions(
    apiAction,
    error,
    requestType,
    catalogueEntity,
    internalEndpointError
  );
  store.dispatch(actions[0]);
  store.dispatch(actions[1]);
}

export function getFailApiRequestActions(
  apiAction: EntityRequestAction,
  error,
  requestType: ApiRequestTypes = 'fetch',
  catalogueEntity: StratosBaseCatalogueEntity,
  internalEndpointError?: InternalEndpointError,
) {
  return [
    new APISuccessOrFailedAction(catalogueEntity.getRequestAction('failure', requestType).type, apiAction, error.message),
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
