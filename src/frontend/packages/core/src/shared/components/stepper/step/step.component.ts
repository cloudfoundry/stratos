import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { IRouterNavPayload } from '@stratosui/store';
import { Observable, of as observableOf } from 'rxjs';

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

export type StepOnNextFunction = (index: number, step: StepComponent) => Observable<StepOnNextResult>;

@Component({
  selector: 'app-step',
  templateUrl: './step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class StepComponent {

  public pOnEnter: (data?: any) => void;
  active = false;
  complete = false;
  error = false;
  busy = false;

  pHidden = false;

  @Input()
  title!: string;

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
  set valid(value: boolean) {
    if (this._valid !== value) {
      this._valid = value;
      // Emit event to notify parent stepper of validation change
      this.onValidChange.emit(value);
    }
  }
  get valid(): boolean {
    return this._valid;
  }
  private _valid = true;

  @Output() onValidChange = new EventEmitter<boolean>();

  // Setter-backed inputs that emit change events so the parent stepper
  // component can re-run change detection. Under OnPush + zoneless change
  // detection, setting an @Input() on a child component only marks that
  // child dirty — it does NOT propagate to a grandparent view that reads
  // the input value via a content-child query (as the stepper does in
  // its own template via `this.steps[i].canClose` and `disablePrevious`).
  // Without the emitters the stepper's own template bindings never get
  // re-evaluated and the Previous/Close buttons stay stuck in the state
  // they were in at the initial view bind.
  private _canClose = true;
  @Input()
  set canClose(v: boolean) {
    if (this._canClose !== v) {
      this._canClose = v;
      this.onCanCloseChange.emit(v);
    }
  }
  get canClose(): boolean { return this._canClose; }
  @Output() onCanCloseChange = new EventEmitter<boolean>();

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

  private _disablePrevious = false;
  @Input()
  set disablePrevious(v: boolean) {
    if (this._disablePrevious !== v) {
      this._disablePrevious = v;
      this.onDisablePreviousChange.emit(v);
    }
  }
  get disablePrevious(): boolean { return this._disablePrevious; }
  @Output() onDisablePreviousChange = new EventEmitter<boolean>();

  @Input()
  blocked = false;

  @Input()
  public destructiveStep = false;

  @ViewChild(TemplateRef, { static: true })
  content!: TemplateRef<any>;

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
