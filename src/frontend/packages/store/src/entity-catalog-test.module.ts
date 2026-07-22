import { NgModule, inject } from '@angular/core';

import { entityCatalog, TestEntityCatalog } from './entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { ENTITY_CATALOG_TOKEN } from './tokens/store-injection.tokens';

export const TEST_CATALOGUE_ENTITIES = '__TEST_CATALOGUE_ENTITIES__';

@NgModule({
  providers: [
    {
      provide: ENTITY_CATALOG_TOKEN,
      useValue: entityCatalog
    }
  ]
})
export class EntityCatalogTestModule {
  constructor() {
    const entityGroups = inject<StratosBaseCatalogEntity[]>(TEST_CATALOGUE_ENTITIES as any);

    baseEntityCatalogSetup(entityGroups);
  }
}

/**
 * To be used in conjunction with `createBasicStoreModule` and `createEntityStoreState`
 */
@NgModule({
  providers: [
    {
      provide: ENTITY_CATALOG_TOKEN,
      useValue: entityCatalog
    }
  ]
})
export class EntityCatalogTestModuleManualStore {
  constructor() {
    const entityGroups = inject<StratosBaseCatalogEntity[]>(TEST_CATALOGUE_ENTITIES as any);

    baseEntityCatalogSetup(entityGroups);
  }
}

function baseEntityCatalogSetup(
  entityGroups: StratosBaseCatalogEntity[]
) {
  const testEntityCatalog = entityCatalog as TestEntityCatalog;
  testEntityCatalog.clear();

  const entities = ([] as StratosBaseCatalogEntity[]).concat(...entityGroups);
  entities.forEach(entity => entityCatalog.register(entity));
}
