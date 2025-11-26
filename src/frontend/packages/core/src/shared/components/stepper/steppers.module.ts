import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { StepComponent } from './step/step.component';
import { StepperFormComponent } from './stepper-form/stepper-form.component';
import { SteppersComponent } from './steppers/steppers.component';

// This module is deprecated - use the standalone components directly instead
// Kept for backward compatibility with test files only
@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        SteppersComponent,
        StepComponent,
        StepperFormComponent
    ],
    declarations: [],
    exports: [
        SteppersComponent,
        StepComponent,
        StepperFormComponent
    ]
})
export class SteppersModule { }
