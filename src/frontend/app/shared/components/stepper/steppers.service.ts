import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx';

import { StepComponent } from './step/step.component';

@Injectable()
export class SteppersService {

  constructor() { }

  public steps = new Subject<StepComponent>();

}
