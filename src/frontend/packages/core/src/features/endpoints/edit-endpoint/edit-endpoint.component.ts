import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../shared/components/stepper/step/step.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EditEndpointStepComponent } from './edit-endpoint-step/edit-endpoint-step.component';

@Component({
  selector: 'app-edit-endpoint',
  templateUrl: './edit-endpoint.component.html',
  styleUrls: ['./edit-endpoint.component.scss'],
  providers: [],
  standalone: true,
  imports: [
    AsyncPipe,
    SteppersComponent,
    StepComponent,
    PageHeaderComponent,
    EditEndpointStepComponent
  ]
})
export class EditEndpointComponent {
  cancelUrl = '/endpoints';
}
