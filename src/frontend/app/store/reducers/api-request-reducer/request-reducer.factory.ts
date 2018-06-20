import { failRequest } from './fail-request';
import { generateDefaultState } from './request-helpers';
import { startRequest } from './start-request';
import { succeedRequest } from './succeed-request';
import { IRequestArray } from './types';
import { updateRequest } from './update-request';
import { RECURSIVE_ENTITY_SET_DELETING } from '../../effects/recusive-entity-delete.effect';
import { setChildEntitiesAsDeleted } from './deleting-child-entities';

export function requestReducerFactory(entityList = [], actions: IRequestArray) {
  const [startAction, successAction, failedAction, updateAction] = actions;
  const defaultState = generateDefaultState(entityList);
  return function apiRequestReducer(state = defaultState, action) {
    switch (action.type) {
      case startAction:
        return startRequest(state, action);
      case successAction:
        return succeedRequest(state, action);
      case failedAction:
        return failRequest(state, action);
      case updateAction:
        return updateRequest(state, action);
      case RECURSIVE_ENTITY_SET_DELETING:
        return setChildEntitiesAsDeleted(state, action);
      default:
        return state;
    }
  };
}
