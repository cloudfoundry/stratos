import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { KubernetesCertsAuthFormComponent } from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import { KubernetesConfigAuthFormComponent } from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { EffectsModule } from '@ngrx/effects';
import { KubernetesEffects } from './store/kubernetes.effects';
import { KubernetesStoreModule } from './kubernetes.store.module';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesStoreModule,
    EffectsModule.forFeature([
      KubernetesEffects
    ])
  ],
  declarations: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
  ],
  entryComponents: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
  ]
})
export class KubernetesSetupModule { }
