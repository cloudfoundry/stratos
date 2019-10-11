import { NgModule } from '@angular/core';

import { generateStratosEntities } from '../../core/src/base-entity-types';
import { CATALOGUE_ENTITIES, EntityCatalogueFeatureModule } from '../../core/src/core/entity-catalogue.module';
import { entityCatalogue, TestEntityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';

@NgModule({
  imports: [
    {
      ngModule: EntityCatalogueFeatureModule,
      providers: [
        {
          provide: CATALOGUE_ENTITIES, useFactory: () => {
            const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
            testEntityCatalogue.clear();
            return [
              ...generateStratosEntities()
            ];
          }
        },
      ]
    },
  ]
})
export class CoreTestingModule { }
