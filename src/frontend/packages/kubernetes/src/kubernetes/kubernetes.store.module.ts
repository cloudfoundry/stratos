import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { AnalysisEffects } from './store/analysis.effects';
import { KubernetesEffects } from './store/kubernetes.effects';
import { KubernetesReducersModule } from './store/kubernetes.reducers';

@NgModule({
  imports: [
    EffectsModule.forFeature([
      AnalysisEffects,
      KubernetesEffects,
    ]),
    KubernetesReducersModule,
  ]
})
export class KubernetesStoreModule { }
