import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { AnalysisEffects } from './store/analysis.effects';
import { KubernetesEffects } from './store/kubernetes.effects';

@NgModule({
  imports: [
    EffectsModule.forFeature([
      AnalysisEffects,
      KubernetesEffects,
    ])
  ]
})
export class KubernetesStoreModule { }
