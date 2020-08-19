import { NgModule } from '@angular/core';

import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '@stratosui/store';
import { entityCatalog, TestEntityCatalog } from '@stratosui/store';
import { generateStratosEntities } from '@stratosui/store';

@NgModule({
  imports: [
    {
      ngModule: EntityCatalogFeatureModule,
      providers: [
        {
          provide: CATALOGUE_ENTITIES, useFactory: () => {
            const testEntityCatalog = entityCatalog as TestEntityCatalog;
            testEntityCatalog.clear();
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
