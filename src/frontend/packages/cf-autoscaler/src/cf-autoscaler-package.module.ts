import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { CfAutoscalerModule } from './cf-autoscaler.module';
import { generateASEntities } from './store/autoscaler-entity-generator';
import { AutoscalerEffects } from './store/autoscaler.effects';

@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateASEntities),
    EffectsModule.forFeature([
      AutoscalerEffects
    ]),
    CfAutoscalerModule
    // ExtensionService.declare([
    //   AutoscalerTabExtensionComponent,
    // ])
  ],
  declarations: [
    // AutoscalerTabExtensionComponent
  ]
})
export class CfAutoscalerPackageModule { }

