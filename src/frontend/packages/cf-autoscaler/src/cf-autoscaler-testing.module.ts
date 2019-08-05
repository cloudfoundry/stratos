import { NgModule } from '@angular/core';

import { generateCFEntities } from '../../cloud-foundry/src/cf-entity-generator';
import { CATALOGUE_ENTITIES, EffectsFeatureModule } from '../../core/src/core/entity-catalogue.module';
import { entityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { generateASEntities } from './store/autoscaler-entity-generator';

@NgModule({
  imports: [{
    ngModule: EffectsFeatureModule,
    providers: [
      {
        provide: CATALOGUE_ENTITIES, useFactory: () => {
          // Ensure the catalogue is empty before providing possibly duplicate entries
          entityCatalogue.clear();
          return [
            ...generateASEntities(),
            ...generateCFEntities()
          ];
        }
      }
    ]
  }]
})
export class CfAutoscalerTestingModule { }
