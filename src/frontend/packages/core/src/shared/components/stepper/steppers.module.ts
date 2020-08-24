import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { StepComponent } from './step/step.component';
import { StepperFormComponent } from './stepper-form/stepper-form.component';
import { SteppersComponent } from './steppers/steppers.component';

@NgModule({
    imports: [
        CommonModule,
        CoreModule
    ],
    declarations: [
        SteppersComponent,
        StepComponent,
        StepperFormComponent
    ],
    exports: [
        SteppersComponent,
        StepComponent,
        StepperFormComponent
    ]
})
export class SteppersModule { }
