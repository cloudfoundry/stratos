import { Action, ActionReducer } from '@ngrx/store';

import { RECURSIVE_ENTITY_SET_DELETED, SetTreeDeleted } from '../../effects/recursive-entity-delete.effect';
import { InitCatalogEntitiesAction } from '../../entity-catalog.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { getDefaultStateFromEntityCatalog } from '../../entity-catalog/entity-catalog.store-setup';
import { deepMergeState } from '../../helpers/reducer.helper';
import { IFlatTree } from '../../helpers/schema-tree-traverse';
import { ISuccessRequestAction } from '../../types/request.types';
import { IRequestArray } from '../api-request-reducer/types';


export function requestDataReducerFactory(actions: IRequestArray): ActionReducer<Record<string, any>> {
  const successAction = actions[1];
  return function entitiesReducer(state = {}, action: Action): Record<string, any> {
    switch (action.type) {
      case InitCatalogEntitiesAction.ACTION_TYPE:
        return getDefaultStateFromEntityCatalog((action as InitCatalogEntitiesAction).entityKeys, {}, state);
      case successAction:
        const success = action as ISuccessRequestAction;
        if (!success.apiAction.updatingKey && success.requestType === 'delete') {
          const entityKey = entityCatalog.getEntity(success.apiAction).entityKey;
          return deleteEntity(state, entityKey, success.apiAction.guid);
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

function cleanStateFromFlatTree(state: Record<string, any>, action: SetTreeDeleted): Record<string, any> {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToState(tree), { ...state });
}

function reduceTreeToState(tree: IFlatTree) {
  return (state: Record<string, any>, entityKey: string) => {
    const ids = tree[entityKey].ids;
    return Array.from(ids).reduce(reduceIdsToState(entityKey), state);
  };
}

function reduceIdsToState(entityKey: string) {
  return (state: Record<string, any>, id: string) => {
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
  const newState = {} as Record<string, any>;
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
