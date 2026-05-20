import { ChangeDetectionStrategy, Component  } from '@angular/core';

@Component({
  selector: 'app-stepper-form',
  templateUrl: './stepper-form.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepperFormComponent { }
