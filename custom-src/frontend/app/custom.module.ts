import { NgModule } from '@angular/core';
import { KubernetesModule } from '../../../src/frontend/app/custom/kubernetes/kubernetes.module';
import { SuseModule } from './custom/suse.module';
import { KubernetesSetupModule } from './custom/kubernetes/kubernetes.setup.module';
@NgModule({
  imports: [
    KubernetesSetupModule,
    KubernetesModule,
    SuseModule,
  ]
})
export class CustomModule { }
