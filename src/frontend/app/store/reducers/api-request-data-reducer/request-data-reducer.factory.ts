import { Action } from '@ngrx/store';

import { pathGet } from '../../../core/utils.service';
import { FetchRelationAction } from '../../actions/relation.actions';
import { deepMergeState } from '../../helpers/reducer.helper';
import { ISuccessRequestAction } from '../../types/request.types';
import { generateDefaultState } from '../api-request-reducer/request-helpers';
import { IRequestArray } from '../api-request-reducer/types';

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
  // Do we actually have any entities to store in a parent?
  const response = successAction.response;
  let entities = pathGet(`entities.${successAction.apiAction.entityKey}`, response) || {};
  entities = Object.values(entities);
  if (!entities) {
    return;
  }
  const parentGuid = fetchRelationAction.parentGuid;
  const parentEntityKey = fetchRelationAction.parent.entityKey;
  const entityParamName = fetchRelationAction.child.paramName;

  // Create a new entity with the inline result. For instance an new organisation containing a list of spaces

  let newParentEntity = pathGet(`${parentEntityKey}.${parentGuid}`, state) || { metadata: {} };
  newParentEntity = {
    ...newParentEntity,
    entity: {
      ...newParentEntity.entity,
      [entityParamName]: fetchRelationAction.child.isArray ? successAction.response.result : successAction.response.result[0]
    }
  };

  // Apply the new entity to the response which will me merged into the store's state
  successAction.response.entities[parentEntityKey] = {
    ...successAction.response.entities[parentEntityKey],
    [parentGuid]: newParentEntity
  };

  return successAction.response.entities;
}
