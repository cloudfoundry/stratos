import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { StepComponent } from './step/step.component';

@Injectable()
export class SteppersService {

  constructor() { }

  public steps = new Subject<StepComponent>();

}
