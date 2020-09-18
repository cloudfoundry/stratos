import { NgModule } from '@angular/core';

import { generateCFEntities } from '../../cloud-foundry/src/cf-entity-generator';
import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule } from '../../store/src/entity-catalog.module';
import { entityCatalog, TestEntityCatalog } from '../../store/src/entity-catalog/entity-catalog';
import { generateASEntities } from './store/autoscaler-entity-generator';

@NgModule({
  imports: [{
    ngModule: EntityCatalogFeatureModule,
    providers: [
      {
        provide: CATALOGUE_ENTITIES, useFactory: () => {
          const testEntityCatalog = entityCatalog as TestEntityCatalog;
          testEntityCatalog.clear();
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
