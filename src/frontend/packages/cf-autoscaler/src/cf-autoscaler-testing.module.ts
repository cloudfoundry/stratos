import { NgModule } from '@angular/core';

import { registerCFEntities } from '../../cloud-foundry/src/cf-entity-generator';
import { registerAutoscalerEntities } from './store/autoscaler-entity-generator';

// import { registerEntitiesForTesting } from '../../core/test-framework/store-test-helper';
// import { autoscalerEntities, AutoscalerStoreModule } from './store/autoscaler.store.module';
// import { NgModule } from '@angular/core';

registerAutoscalerEntities();
registerCFEntities();

@NgModule({
  imports: [
  ]
})
export class CfAutoscalerTestingModule { }
