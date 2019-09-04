import { NgModule } from '@angular/core';

import { generateCFEntities } from '../../cloud-foundry/src/cf-entity-generator';
import { entityCatalogue, TestEntityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { generateASEntities } from './store/autoscaler-entity-generator';
import { EffectsFeatureModule } from '@ngrx/effects/src/effects_feature_module';
import { CATALOGUE_ENTITIES } from '../../core/src/core/entity-catalogue.module';

@NgModule({
  imports: [{
    ngModule: EffectsFeatureModule,
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
