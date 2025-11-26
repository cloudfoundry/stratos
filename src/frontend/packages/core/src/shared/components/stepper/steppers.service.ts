import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import type { StepComponent } from './step/step.component';

@Injectable({
  providedIn: 'root'
})
export class SteppersService {

  public steps = new Subject<StepComponent>();

}
