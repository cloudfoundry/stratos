import { Component } from '@angular/core';

import { PageHeaderComponent } from '../../../../../../core/src/shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AddRoutesComponent } from '../add-routes/add-routes.component';

@Component({
selector: 'app-add-route-stepper',
  templateUrl: './add-route-stepper.component.html',
  styleUrls: ['./add-route-stepper.component.scss'],
  standalone: true,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    AddRoutesComponent
]
})
export class AddRouteStepperComponent { }
