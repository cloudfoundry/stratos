import { NgModule } from '@angular/core';
import {
  CATALOGUE_ENTITIES,
  EntityCatalogFeatureModule,
  entityCatalog,
  TestEntityCatalog,
  generateStratosEntities,
} from '@stratosui/store';

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
