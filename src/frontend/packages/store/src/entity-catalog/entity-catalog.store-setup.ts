import { IRequestTypeState } from '../app-state';

export function getDefaultStateFromEntityCatalog<T = any>(entityKeys: string[], defaultState: T, initialState: IRequestTypeState) {
  return entityKeys.reduce((currentState, entityKey) => {
    if (currentState[entityKey]) {
      return currentState;
    }
    return {
      ...currentState,
      [entityKey]: defaultState
    };
  }, initialState) as T;
}
