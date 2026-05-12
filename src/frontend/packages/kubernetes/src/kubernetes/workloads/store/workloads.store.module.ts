import { NgModule } from '@angular/core';

import { EffectsModule, StoreModule } from '../../../../../store/src/public-api';
import { WorkloadsEffects } from './workloads.effects';
import { helmReleaseReducer } from './workloads.reducers';

@NgModule({
  imports: [
    EffectsModule.forFeature([
      WorkloadsEffects
    ]),
    StoreModule.forFeature('helmRelease', helmReleaseReducer),
  ]
})
export class WorkloadsStoreModule { }
