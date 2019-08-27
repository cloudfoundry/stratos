import { CfAutoscalerModule } from './cf-autoscaler.module';
import { registerEntitiesForTesting } from '../../core/test-framework/store-test-helper';
import { autoscalerEntities, AutoscalerStoreModule } from './store/autoscaler.store.module';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [
    AutoscalerStoreModule
  ]
})
export class CfAutoscalerTestingModule {

  constructor() {
    registerEntitiesForTesting(autoscalerEntities);
  }
}
