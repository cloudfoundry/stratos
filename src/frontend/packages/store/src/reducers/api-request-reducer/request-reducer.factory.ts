import {
  RECURSIVE_ENTITY_RESET,
  RECURSIVE_ENTITY_SET_DELETED,
  RECURSIVE_ENTITY_SET_DELETING,
} from '../../effects/recursive-entity-delete.effect';
import { StartRequestAction } from '../../types/request.types';
import { resetChildEntities, setChildEntitiesAsDeleted, setChildEntitiesAsDeleting } from './deleting-child-entities';
import { failRequest } from './fail-request';
import { startRequest } from './start-request';
import { succeedRequest } from './succeed-request';
import { IRequestArray } from './types';
import { updateRequest } from './update-request';
import { getDefaultStateFromEntityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.store-setup';
import { BaseRequestDataState } from '../../types/entity.types';

export function requestReducerFactory(actions: IRequestArray) {
  const [startAction, successAction, failedAction, updateAction] = actions;
  const defaultState = getDefaultStateFromEntityCatalogue<BaseRequestDataState>();
  return function apiRequestReducer(state = defaultState, action) {
    switch (action.type) {
      case startAction:
        return startRequest(state, action as StartRequestAction);
      case successAction:
        return succeedRequest(state, action);
      case failedAction:
        return failRequest(state, action);
      case updateAction:
        return updateRequest(state, action);
      case RECURSIVE_ENTITY_SET_DELETING:
        return setChildEntitiesAsDeleting(state, action);
      case RECURSIVE_ENTITY_RESET:
        return resetChildEntities(state, action);
      case RECURSIVE_ENTITY_SET_DELETED:
        return setChildEntitiesAsDeleted(state, action);
      default:
        return state;
    }
  };
}
