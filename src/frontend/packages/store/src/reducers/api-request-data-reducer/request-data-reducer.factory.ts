import type { Action, ActionReducer } from '@ngrx/store';

import { RECURSIVE_ENTITY_SET_DELETED, type SetTreeDeleted } from '../../effects/recursive-entity-delete.effect';
import { InitCatalogEntitiesAction } from '../../entity-catalog.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { getDefaultStateFromEntityCatalog } from '../../entity-catalog/entity-catalog.store-setup';
import { deepMergeState } from '../../helpers/reducer.helper';
import type { IFlatTree } from '../../helpers/schema-tree-traverse';
import type { ISuccessRequestAction } from '../../types/request.types';
import type { IRequestArray } from '../api-request-reducer/types';


export function requestDataReducerFactory(actions: IRequestArray): ActionReducer<Record<string, unknown>> {
  const successAction = actions[1];
  return function entitiesReducer(state = {}, action: Action): Record<string, unknown> {
    switch (action.type) {
      case InitCatalogEntitiesAction.ACTION_TYPE:
        return getDefaultStateFromEntityCatalog((action as InitCatalogEntitiesAction).entityKeys, {}, state);
      case successAction: {
        const success = action as ISuccessRequestAction;
        if (!success.apiAction.updatingKey && success.requestType === 'delete') {
          const entityKey = entityCatalog.getEntity(success.apiAction).entityKey;
          return deleteEntity(state, entityKey, success.apiAction.guid);
        } else if (success.response) {
          return deepMergeState(state, success.response.entities);
        }
        return state;
      }
      case RECURSIVE_ENTITY_SET_DELETED:
        return cleanStateFromFlatTree(state, action as SetTreeDeleted);
      default:
        return state;
    }
  };
}

function cleanStateFromFlatTree(state: Record<string, unknown>, action: SetTreeDeleted): Record<string, unknown> {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToState(tree), { ...state });
}

function reduceTreeToState(tree: IFlatTree) {
  return (state: Record<string, unknown>, entityKey: string) => {
    const ids = tree[entityKey].ids;
    return Array.from(ids).reduce(reduceIdsToState(entityKey), state);
  };
}

function reduceIdsToState(entityKey: string) {
  return (state: Record<string, unknown>, id: string) => {
    const entityState = state[entityKey] as Record<string, unknown> | undefined;
    if (!entityState) {
      return state;
    }

    const {
      [id]: omit,
      ...newState
    } = entityState;

    return {
      ...state,
      [entityKey]: newState
    };
  };
}

function deleteEntity(state: Record<string, unknown>, entityKey: string, guid: string): Record<string, unknown> {
  const newState = {} as Record<string, unknown>;
  for (const entityTypeKey in state) {
    if (entityTypeKey === entityKey) {
      newState[entityTypeKey] = {};
      const entityTypeState = state[entityTypeKey] as Record<string, unknown>;
      for (const entityGuid in entityTypeState) {
        if (entityGuid !== guid) {
          (newState[entityTypeKey] as Record<string, unknown>)[entityGuid] = entityTypeState[entityGuid];
        }
      }
    } else {
      newState[entityTypeKey] = state[entityTypeKey];
    }
  }
  return newState;
}
