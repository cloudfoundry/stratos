import { Action } from '@ngrx/store';

import { RECURSIVE_ENTITY_SET_DELETED, SetTreeDeleted } from '../../effects/recursive-entity-delete.effect';
import { deepMergeState } from '../../helpers/reducer.helper';
import { IFlatTree } from '../../helpers/schema-tree-traverse';
import { BaseRequestDataState } from '../../types/entity.types';
import { ISuccessRequestAction } from '../../types/request.types';
import { IRequestArray } from '../api-request-reducer/types';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { getDefaultStateFromEntityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.store-setup';


export function requestDataReducerFactory(actions: IRequestArray) {
  const successAction = actions[1];
  const defaultState = getDefaultStateFromEntityCatalogue<BaseRequestDataState>();
  return function entitiesReducer(state = defaultState, action: Action): BaseRequestDataState {
    switch (action.type) {
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

function cleanStateFromFlatTree(state: BaseRequestDataState, action: SetTreeDeleted): BaseRequestDataState {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToState(tree), { ...state });
}

function reduceTreeToState(tree: IFlatTree) {
  return (state: BaseRequestDataState, entityKey: string) => {
    const ids = tree[entityKey];
    return Array.from(ids).reduce(reduceIdsToState(entityKey), state);
  };
}

function reduceIdsToState(entityKey: string) {
  return (state: BaseRequestDataState, id: string) => {
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
  const newState = {} as BaseRequestDataState;
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
