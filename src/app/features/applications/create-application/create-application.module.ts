import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { AppNameUniqueDirective } from '../app-name-unique.directive/app-name-unique.directive';
import { CreateApplicationStep1Component } from './create-application-step1/create-application-step1.component';
import { CreateApplicationStep2Component } from './create-application-step2/create-application-step2.component';
import { CreateApplicationStep3Component } from './create-application-step3/create-application-step3.component';
import { CreateApplicationComponent } from './create-application.component';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ],
  declarations: [
    CreateApplicationComponent,
    CreateApplicationStep1Component,
    CreateApplicationStep2Component,
    CreateApplicationStep3Component,
    AppNameUniqueDirective
  ],
  exports: [
    CreateApplicationComponent
  ]
})
export class CreateApplicationModule { }
