import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { HelmEffects } from './store/helm.effects';

@NgModule({
  imports: [
    EffectsModule.forFeature([
      HelmEffects
    ]),
  ]
})
export class HelmStoreModule { }
