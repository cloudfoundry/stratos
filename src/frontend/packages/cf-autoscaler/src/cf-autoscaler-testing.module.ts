import { NgModule } from '@angular/core';

import { generateCFEntities } from '../../cloud-foundry/src/cf-entity-generator';
import { CATALOGUE_ENTITIES, EntityCatalogueModule } from '../../core/src/core/entity-catalogue.module';
import { entityCatalogue, TestEntityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { generateASEntities } from './store/autoscaler-entity-generator';

@NgModule({
  imports: [{
    ngModule: EntityCatalogueModule,
    providers: [
      {
        provide: CATALOGUE_ENTITIES, useFactory: () => {
          const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
          testEntityCatalogue.clear();
          return [
            ...generateASEntities(),
            ...generateCFEntities()// depends on cf app type a lot
          ];
        }
      }
    ]
  }]
})
export class CfAutoscalerTestingModule { }
