import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';

import { IRouterNavPayload } from '../../../../../../store/src/actions/router.actions';

export interface IStepperStep {
  validate: Observable<boolean>;
  valid?: boolean;
  onNext: StepOnNextFunction;
  onEnter?: (data?: any) => void;
}

export interface StepOnNextResult {
  success: boolean;
  message?: string;
  // Should we redirect to the store previous state?
  redirect?: boolean;
  redirectPayload?: IRouterNavPayload;
  // Ignore the result of a successful `onNext` call. Handy when sometimes you want to avoid navigation/step change
  ignoreSuccess?: boolean;
  data?: any;
}

export type StepOnNextFunction = () => Observable<StepOnNextResult>;

@Component({
  selector: 'app-step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepComponent {

  public pOnEnter: (data?: any) => void;
  active = false;
  complete = false;
  error = false;
  busy = false;

  pHidden = false;

  @Input()
  title: string;

  @Output() onHidden = new EventEmitter<boolean>();

  @Input()
  set hidden(hidden: boolean) {
    this.pHidden = hidden;
    this.onHidden.emit(this.pHidden);
  }

  get hidden() {
    return this.pHidden;
  }

  @Input()
  valid = true;

  @Input()
  canClose = true;

  @Input()
  hideCloseButton = false;

  @Input()
  hideNextButton = false;

  @Input()
  nextButtonText = 'Next';

  @Input()
  finishButtonText = 'Finish';

  @Input()
  cancelButtonText = 'Cancel';

  @Input()
  disablePrevious = false;

  @Input()
  blocked = false;

  @Input()
  public destructiveStep = false;

  @ViewChild(TemplateRef, { static: true })
  content: TemplateRef<any>;

  @Input()
  skip = false;

  @Input()
  showBusy = false;

  @Input()
  onNext: StepOnNextFunction = () => observableOf({ success: true })

  @Input()
  onEnter: (data: any) => void = () => { }

  @Input()
  onLeave: (isNext?: boolean) => void = () => { }

  constructor() {
    this.pOnEnter = (data?: any) => {
      if (this.onEnter) {
        if (this.destructiveStep) {
          this.busy = true;
          setTimeout(() => {
            this.busy = false;
          }, 1000);
        }
        this.onEnter(data);
      }
    };
  }

}
