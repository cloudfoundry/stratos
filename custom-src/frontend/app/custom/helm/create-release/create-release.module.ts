import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { CreateReleaseComponent } from './create-release.component';


@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ],
  declarations: [
    CreateReleaseComponent,
  ]
})
export class CreateReleaseModule { }
