import { ModuleWithProviders, NgModule } from '@angular/core';
import { CATALOGUE_ENTITIES, entityCatalog, EntityCatalogFeatureModule, TestEntityCatalog, ENTITY_CATALOG_TOKEN } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '../../src/testing/store-test-providers';

@NgModule({
  imports: [
    EntityCatalogFeatureModule
  ],
  providers: [
    ...STORE_TEST_PROVIDERS,
    {
      provide: CATALOGUE_ENTITIES,
      useFactory: () => {
        const testEntityCatalog = entityCatalog as TestEntityCatalog;
        testEntityCatalog.clear();
        return [];
      },
      multi: true
    },
    {
      provide: ENTITY_CATALOG_TOKEN,
      useValue: entityCatalog
    }
  ]
})
export class StoreTestingModule { }

/**
 * Use this to get a properly configured ModuleWithProviders for testing
 */
export function getStoreTestingModule(): ModuleWithProviders<StoreTestingModule> {
  return {
    ngModule: StoreTestingModule,
    providers: [
      ...STORE_TEST_PROVIDERS,
      {
        provide: CATALOGUE_ENTITIES,
        useFactory: () => {
          const testEntityCatalog = entityCatalog as TestEntityCatalog;
          testEntityCatalog.clear();
          return [];
        },
        multi: true
      },
      {
        provide: ENTITY_CATALOG_TOKEN,
        useValue: entityCatalog
      }
    ]
  };
}
