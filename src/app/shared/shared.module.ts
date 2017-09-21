import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';

import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { SideNavComponent } from './components/side-nav/side-nav.component';
import { SteppersComponent } from './components/stepper/steppers/steppers.component';
import { StepComponent } from './components/stepper/step/step.component';


@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    ToolbarComponent,
    SideNavComponent,
    SteppersComponent,
    StepComponent,
  ],
  exports: [
    ToolbarComponent,
    SideNavComponent,
    SteppersComponent,
    StepComponent,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }
