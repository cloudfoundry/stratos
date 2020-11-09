import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { GitEffects } from './git.effects';


@NgModule({
  imports: [
    EffectsModule.forFeature([
      GitEffects
    ]),
  ]
})
export class GitStoreModule { }