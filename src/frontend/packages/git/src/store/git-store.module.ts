import { NgModule } from '@angular/core';
import { EffectsModule } from '@stratosui/store';

import { GitEffects } from './git.effects';


@NgModule({
  imports: [
    EffectsModule.forFeature([
      GitEffects
    ]),
  ]
})
export class GitStoreModule { }
