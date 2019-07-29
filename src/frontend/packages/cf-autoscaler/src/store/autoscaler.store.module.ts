import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/src/core/core.module';
import { registerAutoscalerEntities } from './autoscaler-entity-generator';

registerAutoscalerEntities();

@NgModule({
  imports: [
    CoreModule
  ]
})
export class AutoscalerStoreModule { }
