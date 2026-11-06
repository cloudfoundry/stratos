import { Injector, NgModule, inject } from '@angular/core';

import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { setAutoscalerHelperInjector } from './core/autoscaler-helpers/autoscaler-available';
import { generateASEntities } from './store/autoscaler-entity-generator';

// FWT-959 Track A wave-3 (A-effects-cleanup):
// - Dropped @ngrx/effects + AutoscalerEffects.forFeature. The autoscaler
//   package no longer ships any @ngrx/effects code; all autoscaler I/O
//   now flows through the Autoscaler*DataService signal-native services.
// - The legacy fetchAutoscalerInfo / isAutoscalerEnabled helpers are
//   retained for backwards compat (consumed by card-cf-info and the
//   StratosTab.hidden callback). They reach AutoscalerInfoDataService
//   through a module-level injector reference captured here in the
//   constructor — necessary because both call sites live outside an
//   Angular injection context.
@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateASEntities),
  ],
})
export class CfAutoscalerPackageModule {
  constructor() {
    setAutoscalerHelperInjector(inject(Injector));
  }
}
