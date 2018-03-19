import 'rxjs/add/observable/of';

import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs/Observable';

export interface IStepperStep {
  validate: Observable<boolean>;
  onNext: StepOnNextFunction;
}

export type StepOnNextFunction = () => Observable<{
  success: boolean,
  message?: string,
  // Should we redirect to the store previous state?
  redirect?: boolean
}>;

@Component({
  selector: 'app-step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class StepComponent implements OnInit {

  active = false;
  complete = false;
  error = false;
  busy = false;

  @Input()
  title: string;

  @Input('valid')
  valid = true;

  @Input('nextButtonText')
  nextButtonText = 'Next';

  @Input('finishButtonText')
  finishButtonText = 'Finish';

  @Input('cancelButtonText')
  cancelButtonText = 'Cancel';

  @Input('disablePrevious')
  disablePrevious = false;

  @ViewChild(TemplateRef)
  content: TemplateRef<any>;

  @Input()
  onNext: StepOnNextFunction = () => Observable.of({ success: true })

  constructor() {
  }

  ngOnInit() {
  }

}
