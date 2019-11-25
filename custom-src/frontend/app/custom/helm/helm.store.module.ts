import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { HelmEffects } from './store/helm.effects';
import { StoreModule } from '@ngrx/store';
import { helmReleaseReducer } from './store/helm.reducers';

@NgModule({
  imports: [
    EffectsModule.forFeature([
      HelmEffects
    ]),
    StoreModule.forFeature('helmRelease', helmReleaseReducer),
  ]
})
export class HelmStoreModule { }
