import { NgModule } from '@angular/core';
import { CATALOGUE_ENTITIES, entityCatalog, EntityCatalogFeatureModule, TestEntityCatalog, ENTITY_CATALOG_TOKEN } from '@stratosui/store';

@NgModule({
  imports: [
    {
      ngModule: EntityCatalogFeatureModule,
      providers: [
        {
          provide: CATALOGUE_ENTITIES, useFactory: () => {
            const testEntityCatalog = entityCatalog as TestEntityCatalog;
            testEntityCatalog.clear();
            return [];
          }
        },
        // Provide the entity catalog token for DI
        {
          provide: ENTITY_CATALOG_TOKEN,
          useValue: entityCatalog
        }
      ]
    },
  ]
})
export class StoreTestingModule { }
