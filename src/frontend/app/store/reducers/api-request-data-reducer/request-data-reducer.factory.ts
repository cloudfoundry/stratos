import { Action } from '@ngrx/store';

import { pathGet } from '../../../core/utils.service';
import { fetchEntityTree } from '../../helpers/entity-relations.tree';
import {
  createEntityRelationKey,
  EntityInlineChildAction,
  isEntityInlineChildAction,
} from '../../helpers/entity-relations.types';
import { deepMergeState } from '../../helpers/reducer.helper';
import { ISuccessRequestAction } from '../../types/request.types';
import { generateDefaultState } from '../api-request-reducer/request-helpers';
import { IRequestArray } from '../api-request-reducer/types';
import { RECURSIVE_ENTITY_SET_DELETED, SetTreeDeleted } from '../../effects/recursive-entity-delete.effect';
import { IRequestDataState } from '../../types/entity.types';
import { IFlatTree } from '../../helpers/schema-tree-traverse';

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
          // For example we have fetched a list of spaces that need to be stored in an organization's entity?
          const entities = populateParentEntity(state, success) || success.response.entities;
          return deepMergeState(state, entities);
        }
        return state;
      case RECURSIVE_ENTITY_SET_DELETED:
        return cleanStateFromFlatTree(state, action as SetTreeDeleted);
      default:
        return state;
    }
  };
}

function cleanStateFromFlatTree(state: IRequestDataState, action: SetTreeDeleted): IRequestDataState {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToState(tree), { ...state });
}

function reduceTreeToState(tree: IFlatTree) {
  return (state: IRequestDataState, entityKey: string) => {
    const ids = tree[entityKey];
    return Array.from(ids).reduce(reduceIdsToState(entityKey), state);
  };
}

function reduceIdsToState(entityKey: string) {
  return (state: IRequestDataState, id: string) => {
    const {
      [id]: omit,
      ...newState
    } = state[entityKey];

    return {
      ...state,
      [entityKey]: newState
    };
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
  if (!isEntityInlineChildAction(successAction.apiAction)) {
    return;
  }

  const action: EntityInlineChildAction = successAction.apiAction as EntityInlineChildAction;
  const response = successAction.response;
  const entityKey = successAction.apiAction.entityKey;
  const entity = successAction.apiAction.entity;
  const entities = pathGet(`entities.${entityKey}`, response) || {};
  if (!Object.values(entities)) {
    return;
  }

  // Create a new entity with the inline result. For instance an new organization containing a list of spaces
  // First create the required consts
  const parentGuid = action.parentGuid;
  const parentEntityKey = action.parentEntitySchema.key;
  // We need to find out the entity param name. For instance an org with spaces in will store them in a `spaces` property
  const parentEntityTree = fetchEntityTree({
    type: '',
    entity: action.parentEntitySchema,
    entityKey: parentEntityKey,
    includeRelations: [createEntityRelationKey(parentEntityKey, entityKey)],
    populateMissing: null,
  });
  const relationKey = entity.length ? entity[0].relationKey : entity.relationKey;
  const childRelation = parentEntityTree.rootRelation.childRelations.find(rel =>
    relationKey ? rel.paramName === relationKey : rel.entityKey === entityKey);
  const entityParamName = childRelation.paramName;

  let newParentEntity = pathGet(`${parentEntityKey}.${parentGuid}`, state);
  if (!newParentEntity) {
    // We haven't yet fetched the parent entity so create one to store this list in. This can be used to fetch the child list in the future.
    // NOTE - This should not contain the metadata property as the lack thereof forces the entity to fail validation and to be fetched
    // properly with all it's properties
    newParentEntity = {
      entity: {
        guid: parentGuid,
      }
    };
  }
  newParentEntity = {
    ...newParentEntity,
    entity: {
      ...newParentEntity.entity,
      [entityParamName]: childRelation.isArray ? successAction.response.result : successAction.response.result[0]
    }
  };

  // Apply the new entity to the response which will me merged into the store's state
  successAction.response.entities[parentEntityKey] = {
    ...successAction.response.entities[parentEntityKey],
    [parentGuid]: newParentEntity
  };

  return successAction.response.entities;
}
