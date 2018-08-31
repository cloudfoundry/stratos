import { NgModule } from '@angular/core';
import { SuseModule } from './custom/suse.module';
import { KubernetesSetupModule } from './custom/kubernetes/kubernetes.setup.module';
@NgModule({
  imports: [
    // CaaspSetupModule,
    KubernetesSetupModule,
    SuseModule,
  ]
})
export class CustomModule { }
