import { NgModule } from '@angular/core';

import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '../../src/entity-catalog.module';
import { entityCatalog, TestEntityCatalog } from '../../src/entity-catalog/entity-catalog';

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
