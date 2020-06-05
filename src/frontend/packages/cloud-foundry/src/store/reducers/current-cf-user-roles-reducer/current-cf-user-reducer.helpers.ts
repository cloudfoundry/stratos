import { APIResource } from '../../../../../store/src/types/api.types';
import { CfUserRelationTypes, GetCurrentCfUserRelationsComplete } from '../../../actions/permissions.actions';

interface IKeyedByIDObject<T> {
  [id: string]: T;
}

type roleFinalReducer<T, Y = any> = (
  state: T,
  relationType: CfUserRelationTypes,
  userHasRelation: boolean,
  data?: APIResource<Y>
) => T;

export function addNewCfRoles<T>(
  state: IKeyedByIDObject<T>,
  action: GetCurrentCfUserRelationsComplete,
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

export function removeOldCfRoles<T>(
  state: IKeyedByIDObject<T>,
  action: GetCurrentCfUserRelationsComplete,
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
