import { ApplicationData } from './../../../features/applications/application.service';
import { APIResource } from './../../types/api.types';
import { IRequestEntityTypeState } from './../../app-state';
import { IRequestArray } from '../api-request-reducer/types';
import { generateDefaultState } from '../api-request-reducer/request-helpers';
import { ISuccessRequestAction } from '../../types/request.types';
import { deepMergeState, mergeEntity } from '../../helpers/reducer.helper';
import { Action } from '@ngrx/store';
import { pathGet, pathSet } from '../../../core/utils.service';
import { EntityRelation, EntityInlineChild } from '../../helpers/entity-relations.helpers';

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
          const parentParams = canPopulateParentEntity(success);
          if (parentParams) {
            // We have the required parameters to populate a parent's property with this response
            return populateParentEntity(state, success, parentParams);
          }
          return deepMergeState(state, success.response.entities);
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

function canPopulateParentEntity(successAction): {
  parentEntityGuid: string;
  parentRelations: EntityRelation[]
} {
  // Is there a parent guid. If this is missing there is no consistent way to assign these entities to their parent (empty lists)
  const parentEntityGuid = successAction && successAction.apiAction ? successAction.apiAction['parentGuid'] : null;
  if (!parentEntityGuid) {
    return;
  }

  // Check for relations
  const entity = pathGet('apiAction.entity', successAction) || [];
  const entityWithInline = entity as EntityInlineChild;
  const parentRelations = entityWithInline.parentRelations;
  if (!parentRelations || !parentRelations.length) {
    return;
  }

  // Do we actually have any entities to store in a parent?
  const response = successAction.response;
  let entities = pathGet(`entities.${successAction.apiAction.entityKey}`, response) || {};
  entities = Object.values(entities);
  if (!entities) {
    return;
  }

  return {
    parentEntityGuid,
    parentRelations
  };
}

function populateParentEntity(state, successAction, params: {
  parentEntityGuid: string;
  parentRelations: EntityRelation[]
}) {
  const { parentEntityGuid, parentRelations } = params;

  // For each parent-child relationship
  parentRelations.forEach(relation => {
    // Create a new entity with the inline result. For instance an new organisation containing a list of spaces
    const newParentEntity = relation.createParentWithChildren(state, parentEntityGuid, successAction.response);
    if (!newParentEntity) {
      return;
    }
    // Apply the new entity to the response which will me merged into the store's state
    successAction.response.entities[relation.parentEntityKey] = {
      ...successAction.response.entities[relation.parentEntityKey],
      [parentEntityGuid]: newParentEntity
    };
  });
  return deepMergeState(state, successAction.response.entities);
}
