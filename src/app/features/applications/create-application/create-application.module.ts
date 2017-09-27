import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { CreateApplicationStep1Component } from './create-application-step1/create-application-step1.component';
import { CreateApplicationComponent } from './create-application.component';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ],
  declarations: [
    CreateApplicationComponent,
    CreateApplicationStep1Component
  ]
})
export class CreateApplicationModule { }
