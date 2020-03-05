import { Action } from '@ngrx/store';

import { InitCatalogEntitiesAction } from '../../entity-catalog.actions';
import { getDefaultStateFromEntityCatalog } from '../../entity-catalog/entity-catalog.store-setup';
import {
  RECURSIVE_ENTITY_RESET,
  RECURSIVE_ENTITY_SET_DELETED,
  RECURSIVE_ENTITY_SET_DELETING,
  SetTreeDeleting,
} from '../../effects/recursive-entity-delete.effect';
import {
  IFailedRequestAction,
  ISuccessRequestAction,
  IUpdateRequestAction,
  StartRequestAction,
} from '../../types/request.types';
import { resetChildEntities, setChildEntitiesAsDeleted, setChildEntitiesAsDeleting } from './deleting-child-entities';
import { failRequest } from './fail-request';
import { startRequest } from './start-request';
import { succeedRequest } from './succeed-request';
import { IRequestArray } from './types';
import { updateRequest } from './update-request';

export function requestReducerFactory(actions: IRequestArray) {
  const [startAction, successAction, failedAction, updateAction] = actions;
  return function apiRequestReducer(state = {}, action: Action) {
    switch (action.type) {
      case InitCatalogEntitiesAction.ACTION_TYPE:
        return getDefaultStateFromEntityCatalog((action as InitCatalogEntitiesAction).entityKeys, {}, state);
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
