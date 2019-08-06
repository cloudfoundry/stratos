import { NgModule } from '@angular/core';

import { baseStratosTypeFactory } from '../../core/src/base-entity-types';
import { CATALOGUE_ENTITIES, EffectsFeatureModule } from '../../core/src/core/entity-catalogue.module';
import { entityCatalogue, TestEntityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { generateCFEntities } from './cf-entity-generator';

@NgModule({
  imports: [{
    ngModule: EffectsFeatureModule,
    providers: [
      {
        provide: CATALOGUE_ENTITIES, useFactory: () => {
          const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
          testEntityCatalogue.clear();
          return [
            ...generateCFEntities(),
            ...baseStratosTypeFactory()
          ];
        }
      }
    ]
  }]
})
export class CloudFoundryTestingModule { }
