import { Action } from '@ngrx/store';

import { pathGet } from '../../../core/utils.service';
import { fetchEntityTree } from '../../helpers/entity-relations/entity-relations.tree';
import {
  createEntityRelationKey,
  EntityInlineChildAction,
  isEntityInlineChildAction,
} from '../../helpers/entity-relations/entity-relations.types';
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
          return deepMergeState(state, success.response.entities);
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
