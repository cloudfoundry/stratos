import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

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
