import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToolbarComponent } from '../components/toolbar/toolbar.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import { StepComponent } from './stepper/step/step.component';
import { SteppersComponent } from './stepper/steppers/steppers.component';
import { MDAppModule } from '../md/md.module';
import { RouterModule } from '@angular/router';
import { ConsoleUaaWizardComponent } from './console-uaa-wizard/console-uaa-wizard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';//TODO:

@NgModule({
  imports: [
    CommonModule,
    MDAppModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    ToolbarComponent,
    SideNavComponent,
    SteppersComponent,
    StepComponent,
    ConsoleUaaWizardComponent,
  ],
  exports: [
    ToolbarComponent,
    SideNavComponent,
    SteppersComponent,
    StepComponent,
    ConsoleUaaWizardComponent,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ComponentsModule { }
