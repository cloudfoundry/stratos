import { ISpacesRoleState, IOrgRoleState } from '../../types/current-user-roles.types';
import { GetCurrentUserRelationsComplete, UserRelationTypes } from '../../actions/permissions.actions';

export interface IKeyedByIDObject<T> {
  [id: string]: T;
}

export type roleFinalReducer<T> = (
  state: T,
  relationType: UserRelationTypes,
  userHasRelation: boolean) => T;

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
        [data.metadata.guid]: reducer(currentState[data.metadata.guid], action.relationType, true)
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

export function isOrgRelation(relationType: UserRelationTypes) {
  return relationType === UserRelationTypes.AUDITED_ORGANIZATIONS ||
    relationType === UserRelationTypes.BILLING_MANAGED_ORGANIZATION ||
    relationType === UserRelationTypes.MANAGED_ORGANIZATION ||
    relationType === UserRelationTypes.ORGANIZATIONS;
}

export function isSpaceRelation(relationType: UserRelationTypes) {
  return relationType === UserRelationTypes.AUDITED_SPACES ||
    relationType === UserRelationTypes.MANAGED_SPACES ||
    relationType === UserRelationTypes.SPACES;
}
