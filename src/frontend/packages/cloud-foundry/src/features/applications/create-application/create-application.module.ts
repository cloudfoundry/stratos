import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '@stratosui/core';
import { SharedModule } from '@stratosui/core';
import { CloudFoundrySharedModule } from '../../../shared/cf-shared.module';
import { CreateApplicationStep2Component } from './create-application-step2/create-application-step2.component';
import { CreateApplicationStep3Component } from './create-application-step3/create-application-step3.component';
import { CreateApplicationComponent } from './create-application.component';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    CloudFoundrySharedModule
  ],
  declarations: [
    CreateApplicationComponent,
    CreateApplicationStep2Component,
    CreateApplicationStep3Component
  ],
  exports: [
    CreateApplicationComponent,
  ]
})
export class CreateApplicationModule { }
