import { NgModule } from '@angular/core';
import { CATALOGUE_ENTITIES, entityCatalog, EntityCatalogFeatureModule, TestEntityCatalog } from '@stratosui/store';

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
      ]
    },
  ]
})
export class StoreTestingModule { }
