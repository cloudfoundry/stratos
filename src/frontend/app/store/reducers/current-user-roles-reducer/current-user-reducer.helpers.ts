import { ISpacesRoleState, IOrgRoleState } from '../../types/current-user-roles.types';
import { GetUserRelationsComplete, UserRelationTypes } from '../../actions/permissions.actions';

export interface IKeyedByIDObject<T> {
  [id: string]: T;
}

export type roleFinalReducer<T> = (
  state: T,
  relationType: UserRelationTypes,
  userHasRelation: boolean) => T;

export function addNewRoles<T>(
  state: IKeyedByIDObject<T>,
  action: GetUserRelationsComplete,
  reducer: roleFinalReducer<T>
) {
  console.log('state', state);
  return action.data.reduce((config, data) => {
    const currentState = config.newState;
    return {
      newState: {
        ...currentState,
        [data.metadata.guid]: reducer(currentState[data.metadata.guid], action.relationType, true)
      },
      addedIds: config.addedIds.concat([data.metadata.guid])
    };
  }, { newState: { ...state }, addedIds: [] });
}

export function removeOldRoles<T>(
  state: IKeyedByIDObject<T>,
  action: GetUserRelationsComplete,
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
