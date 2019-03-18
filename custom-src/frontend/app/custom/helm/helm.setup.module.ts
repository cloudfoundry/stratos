import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { EffectsModule } from '@ngrx/effects';
import { HelmStoreModule } from './helm.store.module';
import { HelmEffects } from './store/helm.effects';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    HelmStoreModule,
    EffectsModule.forFeature([
      HelmEffects
    ])
  ],
  declarations: [
  ],
  entryComponents: [
  ]
})
export class HelmSetupModule { }


