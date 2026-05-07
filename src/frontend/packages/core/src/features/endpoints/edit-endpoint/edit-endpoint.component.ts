import { ChangeDetectionStrategy, Component  } from '@angular/core';

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
    SteppersComponent,
    StepComponent,
    PageHeaderComponent,
    EditEndpointStepComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditEndpointComponent {
  cancelUrl = '/endpoints';
}
