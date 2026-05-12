import { NgModule } from '@angular/core';

import { EffectsModule } from '../../../store/src/public-api';
import { HelmEffects } from './store/helm.effects';

@NgModule({
  imports: [
    EffectsModule.forFeature([
      HelmEffects
    ]),
  ]
})
export class HelmStoreModule { }
