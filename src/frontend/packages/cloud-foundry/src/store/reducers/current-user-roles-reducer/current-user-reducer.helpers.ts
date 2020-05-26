import { APIResource } from '../../../../../store/src/types/api.types';
import { GetCurrentUserRelationsComplete, UserRelationTypes } from '../../../actions/permissions.actions';

export interface IKeyedByIDObject<T> {
  [id: string]: T;
}

export type roleFinalReducer<T, Y = any> = (
  state: T,
  relationType: UserRelationTypes,
  userHasRelation: boolean,
  data?: APIResource<Y>
) => T;

export function addNewRoles<T>(
  state: IKeyedByIDObject<T>,
  action: GetCurrentUserRelationsComplete,
  reducer: roleFinalReducer<T>
) {
  return action.data.reduce((config, data) => {
    const currentState = config.newState;
    return {
      newState: {
        ...currentState,
        [data.metadata.guid]: reducer(currentState[data.metadata.guid], action.relationType, true, data)
      },
      addedIds: config.addedIds.concat([data.metadata.guid])
    };
  }, { newState: { ...state }, addedIds: [] });
}

export function removeOldRoles<T>(
  state: IKeyedByIDObject<T>,
  action: GetCurrentUserRelationsComplete,
  newIds: string[],
  reducer: roleFinalReducer<T>
) {
  return Object.keys(state).reduce((currentState, id) => {
    if (newIds.includes(id)) {
      return state;
    }
    return {
      ...currentState,
      [id]: reducer(currentState[id], action.relationType, false)
    };
  }, { ...state });
}
