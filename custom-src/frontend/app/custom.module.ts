import { NgModule } from '@angular/core';
import { CaaspSetupModule } from '../../../src/frontend/app/custom/caasp/caasp.setup.module';
import { SuseModule } from './custom/suse.module';
@NgModule({
  imports: [
    CaaspSetupModule,
    // KubernetesModule
    SuseModule,
  ]
})
export class CustomModule { }