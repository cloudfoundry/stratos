import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { generateASEntities } from './store/autoscaler-entity-generator';
import { AutoscalerEffects } from './store/autoscaler.effects';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateASEntities),
    EffectsModule.forFeature([
      AutoscalerEffects
    ]),
  ],
})
export class CfAutoscalerPackageModule { }

