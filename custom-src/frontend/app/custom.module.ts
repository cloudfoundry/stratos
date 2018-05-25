import { NgModule } from '@angular/core';

import { CaaspSetupModule } from '../../../src/frontend/app/custom/caasp/caasp.setup.module';

@NgModule({
  imports: [
    CaaspSetupModule,
    // KubernetesModule
  ]
})
export class CustomModule { }

