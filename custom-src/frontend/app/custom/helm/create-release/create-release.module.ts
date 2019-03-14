
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { CreateReleaseComponent } from './create-release.component';
import { CreateApplicationStepDestinationComponent } from './create-release-step-dest/create-release-step-dest.component';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ],
  declarations: [
    CreateReleaseComponent,
    CreateApplicationStepDestinationComponent,
  ],
  exports: [
    CreateApplicationStepDestinationComponent
  ]
})
export class CreateReleaseModule { }
