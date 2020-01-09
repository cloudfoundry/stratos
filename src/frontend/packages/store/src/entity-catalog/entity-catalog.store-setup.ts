import { IRequestTypeState } from '../app-state';
import { entityCatalog } from './entity-catalog.service';

// FIXME: These should be removed/come from the entity catalog - STRAT-151
const baseEntities = [
  'user',
  'system'
];

export function getAllEntityStoreKeys() {
  const entities = entityCatalog.getAllEntitiesTypes();
  return [
    ...entities.map(entity => entity.entityKey),
    ...baseEntities
  ];
}

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
