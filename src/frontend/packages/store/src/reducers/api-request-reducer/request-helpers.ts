import { RequestMethod } from '@angular/http';
import { AppState } from '../../app-state';
import { mergeState } from '../../helpers/reducer.helper';
import { NormalizedResponse } from '../../types/api.types';
import { IRequestDataState } from '../../types/entity.types';
import { PaginatedAction } from '../../types/pagination.types';
import {
  ICFAction,
  IRequestAction,
  SingleEntityAction,
  StartRequestAction,
  APISuccessOrFailedAction,
  WrapperRequestActionSuccess,
  WrapperRequestActionFailed,
  InternalEndpointError
} from '../../types/request.types';
import { defaultDeletingActionState, getDefaultActionState, getDefaultRequestState, RequestInfoState, rootUpdatingKey } from './types';
import { APIResponse } from '../../actions/request.actions';
import { pathGet } from '../../../../core/src/core/utils.service';
import { Store } from '@ngrx/store';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';

function getEntityKey(entityType: string, endpointType: string) {
  const catalogueEntity = entityCatalogue.getEntity(endpointType, entityType);
  // TODO: we need to fall back to entityType here for the none catalogue, internal entities (i.e userFavorites)
  // We should add internal entities into the catalogue to remove the need for this.
  return catalogueEntity ? catalogueEntity.entityKey : entityType;
}

export function getEntityRequestState(state: IRequestDataState, action: SingleEntityAction): RequestInfoState {
  const { entityType, endpointType, guid } = action;
  const entityKey = getEntityKey(entityType, endpointType);
  const requestState = { ...state[entityKey][guid] };
  if (requestState && typeof requestState === 'object' && Object.keys(requestState).length) {
    return requestState;
  }
  return getDefaultRequestState();
}

export function setEntityRequestState(state: IRequestDataState, requestState, { entityType, endpointType, guid }: IRequestAction) {
  const entityKey = getEntityKey(entityType, endpointType);
  const newState = {
    [entityKey]: {
      [guid]: {
        ...requestState
      }
    }
  };
  return mergeState(state, newState);
}


export function createRequestStateFromResponse(response: NormalizedResponse, state: IRequestDataState, endpointType: string) {
  if (!response || !response.entities) {
    return state;
  }
  const { entities } = response;
  let newState = { ...state };
  Object.keys(entities).forEach(entityType => {
    Object.keys(entities[entityType]).forEach(guid => {
      const entState = getEntityRequestState(state, { entityType, guid, endpointType } as SingleEntityAction);
      entState.fetching = entState.fetching || false;
      entState.error = entState.error || false;
      const busy = entState.deleting ? entState.deleting.busy : false;
      entState.deleting = { ...defaultDeletingActionState, busy };
      newState = setEntityRequestState(newState, entState, { entityType, guid, endpointType } as IRequestAction);
    });
  });
  return newState;
}

export type ApiRequestTypes = 'fetch' | 'update' | 'create' | 'delete';

export function getRequestTypeFromMethod(action): ApiRequestTypes {
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
  const defaultState = {} as IRequestDataState;

  keys.forEach(key => {
    defaultState[key] = {};
    if (initialSections && initialSections[key] && initialSections[key].length) {
      initialSections[key].forEach(sectionKey => {
        defaultState[key][sectionKey] = getDefaultActionState();
      });
    }
  });
  return defaultState;
}


export function startApiRequest(
  store: Store<AppState>,
  apiAction: ICFAction | PaginatedAction,
  requestType: ApiRequestTypes = 'fetch'
) {
  store.dispatch(new StartRequestAction(apiAction, requestType));
  store.dispatch(getActionFromString(apiAction.actions[0]));
}

export function completeApiRequest(
  store: Store<AppState>,
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

export function failApiRequest(
  store: Store<AppState>,
  apiAction: ICFAction | PaginatedAction,
  error,
  requestType: ApiRequestTypes = 'fetch',
  internalEndpointError?: InternalEndpointError
) {
  const actions = getFailApiRequestActions(
    apiAction,
    error,
    requestType,
    internalEndpointError
  );
  store.dispatch(actions[0]);
  store.dispatch(actions[1]);
}

export function getFailApiRequestActions(
  apiAction: ICFAction | PaginatedAction,
  error,
  requestType: ApiRequestTypes = 'fetch',
  internalEndpointError?: InternalEndpointError
) {
  return [
    new APISuccessOrFailedAction(apiAction.actions[2], apiAction, error.message),
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
