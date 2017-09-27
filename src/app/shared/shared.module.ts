import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../core/core.module';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { StepComponent } from './components/stepper/step/step.component';
import { SteppersComponent } from './components/stepper/steppers/steppers.component';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';


@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    PageHeaderModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    SteppersComponent,
    StepComponent,
    LoadingPageComponent,
    DisplayValueComponent,
    EditableDisplayValueComponent,
    MbToHumanSizePipe
  ],
  exports: [
    SteppersComponent,
    StepComponent,
    FormsModule,
    ReactiveFormsModule,
    LoadingPageComponent,
    PageHeaderModule,
    DisplayValueComponent,
    EditableDisplayValueComponent,
    MbToHumanSizePipe
  ]
})
export class SharedModule { }
