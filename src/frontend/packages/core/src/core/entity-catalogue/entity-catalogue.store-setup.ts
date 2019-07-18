import { entityCatalogue } from './entity-catalogue.service';

// TODO !!!!!!!!!! RC NJ Move these into the entity catalogue
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

export function getDefaultStateFromEntityCatalogue<
  T extends Record<string | number | symbol, any> = Record<string | number | symbol, any>
>(): T {
  return getAllEntityStoreKeys().reduce((currentState, entityKey) => {
    if (currentState[entityKey]) {
      return currentState;
    }
    return {
      ...currentState,
      [entityKey]: {}
    };
  }, {}) as T;
}
