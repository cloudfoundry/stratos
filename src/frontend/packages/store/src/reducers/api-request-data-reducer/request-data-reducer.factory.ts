import { Action, ActionReducer } from '@ngrx/store';

import { InitCatalogueEntitiesAction } from '../../../../core/src/core/entity-catalogue.actions';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { getDefaultStateFromEntityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.store-setup';
import { RECURSIVE_ENTITY_SET_DELETED, SetTreeDeleted } from '../../effects/recursive-entity-delete.effect';
import { deepMergeState } from '../../helpers/reducer.helper';
import { IFlatTree } from '../../helpers/schema-tree-traverse';
import { ISuccessRequestAction } from '../../types/request.types';
import { IRequestArray } from '../api-request-reducer/types';


export function requestDataReducerFactory(actions: IRequestArray): ActionReducer<Record<string, any>> {
  const successAction = actions[1];
  return function entitiesReducer(state = {}, action: Action): Record<string, any> {
    switch (action.type) {
      case InitCatalogueEntitiesAction.ACTION_TYPE:
        return getDefaultStateFromEntityCatalogue((action as InitCatalogueEntitiesAction).entityKeys, {});
      case successAction:
        const success = action as ISuccessRequestAction;
        if (!success.apiAction.updatingKey && success.requestType === 'delete') {
          const entityKey = entityCatalogue.getEntity(success.apiAction.endpointType, success.apiAction.entityType).entityKey;
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
    const ids = tree[entityKey];
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
