import { ApplicationData } from './../../../features/applications/application.service';
import { APIResource } from './../../types/api.types';
import { IRequestEntityTypeState } from './../../app-state';
import { IRequestArray } from '../api-request-reducer/types';
import { generateDefaultState } from '../api-request-reducer/request-helpers';
import { ISuccessRequestAction } from '../../types/request.types';
import { deepMergeState, mergeEntity } from '../../helpers/reducer.helper';
import { Action } from '@ngrx/store';
import { pathGet, pathSet } from '../../../core/utils.service';
import { EntityWithInline, EntityValidateParent, EntityWithParent } from '../../actions/action-types';

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
          const newState = deepMergeState(state, success.response.entities);
          // // Does the entity associated with the action have inline params that need to be validated?
          const entity = pathGet('apiAction.entity', success) || [];
          const entityWithInline = entity as EntityWithParent;
          const validateInlineEntities = entityWithInline.parentValidation;

          if (!validateInlineEntities || !validateInlineEntities.length) {
            return newState;
          }
          // Do we have entities in the response?
          const response = success.response;
          let entities = pathGet(`entities.${success.apiAction.entityKey}`, response) || {};
          entities = Object.values(entities);
          if (!entities) {
            return newState;
          }

          validateInlineEntities.forEach(validateParam => {
            // TODO: RC
            // Find the location of the parent in the state
            const { parentPath, childPropertyName } = validateParam.createPath(entities);
            const parentEntity = pathGet(parentPath, newState);
            const newParentEntity = {
              ...parentEntity,
              [childPropertyName]: success.response.result
            };

            mergeEntity(parentEntity, newParentEntity);
            // pathSet(parentPath, newState, newParentEntity);
          });

          return newState;
        }
        return state;
      default:
        return state;
    }
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
