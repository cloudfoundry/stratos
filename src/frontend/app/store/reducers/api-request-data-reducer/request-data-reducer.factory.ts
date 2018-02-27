import { ApplicationData } from './../../../features/applications/application.service';
import { APIResource } from './../../types/api.types';
import { IRequestEntityTypeState } from './../../app-state';
import { IRequestArray } from '../api-request-reducer/types';
import { generateDefaultState } from '../api-request-reducer/request-helpers';
import { ISuccessRequestAction } from '../../types/request.types';
import { deepMergeState, mergeEntity } from '../../helpers/reducer.helper';
import { Action } from '@ngrx/store';
import { pathGet, pathSet } from '../../../core/utils.service';
import { FetchRelationAction } from '../../actions/relation.actions';

export function requestDataReducerFactory(entityList = [], actions: IRequestArray) {
  const [startAction, successAction, failedAction] = actions;
  const defaultState = generateDefaultState(entityList);
  return function entitiesReducer(state = defaultState, action: Action) {
    switch (action.type) {
      case successAction:
        const success = action as ISuccessRequestAction;
        if (!success.apiAction.updatingKey && success.requestType === 'delete') {
          return deleteEntity(state, success.apiAction.entityKey, success.apiAction.guid);
        } else if (success.response) {
          // TODO: RC
          // Does the entity associated with the action have a parent property that requires the result to be stored with it?
          // For example we have fetched a list of spaces that need to be stored in an organisation's entity?
          const entities = populateParentEntity(state, success) || success.response.entities;
          return deepMergeState(state, entities);
        }
        return state;
      default:
        return state;
    }
  };
}

function deleteEntity(state, entityKey, guid) {
  const newState = {};
  for (const entityTypeKey in state) {
    if (entityTypeKey === entityKey) {
      newState[entityTypeKey] = {};
      for (const entityGuid in state[entityTypeKey]) {
        if (entityGuid !== guid) {
          newState[entityTypeKey][entityGuid] = state[entityTypeKey][entityGuid];
        }
      }
    } else {
      newState[entityTypeKey] = state[entityTypeKey];
    }
  }
  return newState;
}

function populateParentEntity(state, successAction) {
  const fetchRelationAction: FetchRelationAction = FetchRelationAction.is(successAction.apiAction);
  if (!fetchRelationAction) {
    return;
  }
  // TODO: RC comments
  // Do we actually have any entities to store in a parent?
  const response = successAction.response;
  let entities = pathGet(`entities.${successAction.apiAction.entityKey}`, response) || {};
  entities = Object.values(entities);
  if (!entities) {
    return;
  }
  const { parentGuid, parentEntityKey, entityKeyInParent } = fetchRelationAction;

  // Create a new entity with the inline result. For instance an new organisation containing a list of spaces

  let newParentEntity = pathGet(`${parentEntityKey}.${parentGuid}`, state) || { metadata: {} };
  newParentEntity = {
    ...newParentEntity,
    entity: {
      ...newParentEntity.entity,
      [entityKeyInParent]: successAction.response.result
    }
  };

  // Apply the new entity to the response which will me merged into the store's state
  successAction.response.entities[parentEntityKey] = {
    ...successAction.response.entities[parentEntityKey],
    [parentGuid]: newParentEntity
  };

  return successAction.response.entities;
}
