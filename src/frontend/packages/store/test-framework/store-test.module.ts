import { NgModule } from '@angular/core';

import { CATALOGUE_ENTITIES, EntityCatalogueFeatureModule } from '../../store/src/entity-catalogue.module';
import { entityCatalogue, TestEntityCatalogue } from '../../store/src/entity-catalog/entity-catalogue.service';

@NgModule({
  imports: [
    {
      ngModule: EntityCatalogueFeatureModule,
      providers: [
        {
          provide: CATALOGUE_ENTITIES, useFactory: () => {
            const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
            testEntityCatalogue.clear();
            return [];
          }
        },
      ]
    },
  ]
})
export class StoreTestingModule { }
