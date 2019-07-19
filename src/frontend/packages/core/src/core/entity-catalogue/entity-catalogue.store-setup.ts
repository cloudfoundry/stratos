import { entityCatalogue } from './entity-catalogue.service';

// TODO: NJ Move these into the entity catalogue
// TODO: !!!!!!!!!! RC Are these used? I've removed userProfile as covered by stratosUserProfile
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
