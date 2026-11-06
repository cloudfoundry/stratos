import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { StepComponent } from './step/step.component';

@Injectable({
  providedIn: 'root'
})
export class SteppersService {

  constructor() { }

  public steps = new Subject<StepComponent>();

}
