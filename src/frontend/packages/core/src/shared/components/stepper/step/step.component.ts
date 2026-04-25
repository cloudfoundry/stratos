import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, Signal, TemplateRef, ViewChild } from '@angular/core';
import { IRouterNavPayload } from '@stratosui/store';
import { from, Observable, of as observableOf } from 'rxjs';

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

/**
 * Signal-native step contract — additive shape introduced in FWT-956 so new
 * stepper consumers can express validity / submission / skip behavior as
 * signals + Promises instead of the legacy `valid: boolean` + `onNext:
 * StepOnNextFunction` Observable pattern. When a step sets `signalHandle`,
 * the legacy `valid` / `skip` / `onNext` inputs are bypassed and the
 * StepComponent prefers the signal-handle reads. See FWT-957 for the wider
 * consumer-migration sweep that ultimately retires the legacy shape.
 */
export interface SignalStepHandle {
  /** Step is allowed to advance when this returns true. */
  readonly valid: Signal<boolean>;
  /**
   * Optional submission action invoked when the user clicks Next/Finish.
   * Resolves on success; rejects with an Error to surface a snackbar via
   * the existing stepper plumbing. When omitted the step auto-succeeds —
   * useful for confirmation screens that don't have side-effects to run.
   */
  readonly submit?: () => Promise<void>;
  /**
   * Optional conditional-skip predicate. When true the stepper treats the
   * step as if its legacy `skip` input were true — included in the visible
   * list but bypassed during navigation. Useful for branching wizards where
   * a step only applies given upstream state.
   */
  readonly skipIf?: Signal<boolean>;
}

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
  // When `signalHandle` is set, the stepper reads validity from
  // `signalHandle.valid()` — the legacy `_valid` storage is ignored.
  // Signal reads are tracked by Angular's CD so this is reactive without
  // the manual `onValidChange` emitter pattern.
  get valid(): boolean {
    return this.signalHandle ? this.signalHandle.valid() : this._valid;
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
  set skip(v: boolean) {
    this._skip = v;
  }
  // When `signalHandle.skipIf` is set, prefer the signal read so admin-only
  // / conditional steps flip without consumers needing to wire boolean
  // bindings. Falls back to legacy `_skip` storage for non-signal steps.
  get skip(): boolean {
    return this.signalHandle?.skipIf ? this.signalHandle.skipIf() : this._skip;
  }
  private _skip = false;

  @Input()
  showBusy = false;

  @Input()
  onNext: StepOnNextFunction = () => observableOf({ success: true })

  @Input()
  onEnter: (data: any) => void = () => { }

  @Input()
  onLeave: (isNext?: boolean) => void = () => { }

  /**
   * New (FWT-956) signal-native step contract — additive alongside the
   * legacy `valid` / `skip` / `onNext` inputs. When set, the StepComponent's
   * effective validity / skip / submission delegate to this handle. Wider
   * consumer migration to this shape tracked at FWT-957.
   */
  @Input()
  signalHandle?: SignalStepHandle;

  /**
   * Dispatch the step's submission. Signal-handle path wraps `submit()` as
   * an Observable<StepOnNextResult> so SteppersComponent.goNext can consume
   * both shapes uniformly. When `signalHandle` is set without `submit`, the
   * step auto-succeeds (confirmation-screen pattern). Legacy path delegates
   * to the existing `onNext(index, this)` contract.
   */
  invokeNext(index: number): Observable<StepOnNextResult> {
    const submit = this.signalHandle?.submit;
    if (submit) {
      return from(
        submit().then(
          () => ({ success: true } as StepOnNextResult),
          (err: unknown) => ({
            success: false,
            message: err instanceof Error ? err.message : String(err),
          } as StepOnNextResult),
        ),
      );
    }
    if (this.signalHandle) {
      return observableOf({ success: true } as StepOnNextResult);
    }
    return this.onNext(index, this);
  }

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
