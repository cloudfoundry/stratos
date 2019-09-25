import { IRequestTypeState } from '../../../../store/src/app-state';
import { entityCatalogue } from './entity-catalogue.service';

// FIXME: These should be removed/come from the entity catalogue - STRAT-151
const baseEntities = [
  'user',
  'system'
];

export function getAllEntityStoreKeys() {
  const entities = entityCatalogue.getAllEntitiesTypes();
  return [
    ...entities.map(entity => entity.entityKey),
    ...baseEntities
  ];
}

export function getDefaultStateFromEntityCatalogue<T = any>(entityKeys: string[], defaultState: T, initialState: IRequestTypeState) {
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
