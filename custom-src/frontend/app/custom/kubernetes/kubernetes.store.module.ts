import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { KubernetesEffects } from './store/kubernetes.effects';

@NgModule({
  imports: [
    EffectsModule.forFeature([
      KubernetesEffects
    ])
  ]
})
export class KubernetesStoreModule { }
