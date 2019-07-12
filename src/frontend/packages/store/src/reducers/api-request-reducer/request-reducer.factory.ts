import {
  RECURSIVE_ENTITY_RESET,
  RECURSIVE_ENTITY_SET_DELETED,
  RECURSIVE_ENTITY_SET_DELETING,
  SetTreeDeleting,
} from '../../effects/recursive-entity-delete.effect';
import { StartRequestAction, ISuccessRequestAction, IFailedRequestAction, IUpdateRequestAction } from '../../types/request.types';
import { resetChildEntities, setChildEntitiesAsDeleted, setChildEntitiesAsDeleting } from './deleting-child-entities';
import { failRequest } from './fail-request';
import { startRequest } from './start-request';
import { succeedRequest } from './succeed-request';
import { IRequestArray } from './types';
import { updateRequest } from './update-request';
import { getDefaultStateFromEntityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.store-setup';
import { Action } from '@ngrx/store';
import { BaseRequestState } from '../../app-state';

export function requestReducerFactory(actions: IRequestArray) {
  const [startAction, successAction, failedAction, updateAction] = actions;
  const defaultState = getDefaultStateFromEntityCatalogue<BaseRequestState>();
  return function apiRequestReducer(state = defaultState, action: Action) {
    switch (action.type) {
      case startAction:
        return startRequest(state, action as StartRequestAction);
      case successAction:
        return succeedRequest(state, action as ISuccessRequestAction);
      case failedAction:
        return failRequest(state, action as IFailedRequestAction);
      case updateAction:
        return updateRequest(state, action as IUpdateRequestAction);
      case RECURSIVE_ENTITY_SET_DELETING:
        return setChildEntitiesAsDeleting(state, action as SetTreeDeleting);
      case RECURSIVE_ENTITY_RESET:
        return resetChildEntities(state, action as SetTreeDeleting);
      case RECURSIVE_ENTITY_SET_DELETED:
        return setChildEntitiesAsDeleted(state, action as SetTreeDeleting);
      default:
        return state;
    }
  };
}
