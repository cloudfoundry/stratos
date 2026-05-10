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
 * Signal-native step contract — additive shape introduced in FWT-956 and
 * extended in FWT-959 to cover the full @Input surface that Shape 3 (multi-
 * step / cross-step) wizards need. When a step sets `signalHandle`, every
 * field that exists on the handle is preferred over its legacy @Input
 * equivalent. Fields that don't exist on the handle fall through to legacy
 * @Input storage so partially-migrated steps keep working. The wider Shape
 * 3 sweep that consumes the full contract is tracked at FWT-959.
 */
export interface SignalStepHandle {
  /** Step is allowed to advance when this returns true. */
  readonly valid: Signal<boolean>;
  /**
   * Optional submission action invoked when the user clicks Next/Finish.
   * Resolves on success; rejects with an Error to surface a snackbar via
   * the existing stepper plumbing. Resolving with `{ ignoreSuccess: true }`
   * preserves the legacy `StepOnNextResult.ignoreSuccess` semantic — the
   * step reports success without auto-advancing or emitting the success
   * snackbar (used by `manage-users` / `remove-user` two-click apply).
   * When omitted the step auto-succeeds — useful for confirmation screens.
   */
  readonly submit?: () => Promise<void | { ignoreSuccess?: boolean }>;
  /**
   * Optional conditional-skip predicate. When true the stepper treats the
   * step as if its legacy `skip` input were true — included in the visible
   * list but bypassed during navigation. Useful for branching wizards where
   * a step only applies given upstream state.
   */
  readonly skipIf?: Signal<boolean>;

  // FWT-959 additions — all optional. Field names match the existing
  // @Input surface so consumers don't have to learn a second vocabulary.
  /** Disables Next while truthy — loading-state gate. */
  readonly blocked?: Signal<boolean>;
  /** Hides the step entirely — distinct from `skipIf` (still visible in nav). */
  readonly hidden?: Signal<boolean>;
  /** Fired when the stepper navigates into this step. Promise awaited. */
  readonly onEnter?: (data?: unknown) => void | Promise<void>;
  /** Fired when the stepper navigates out of this step. Promise awaited. */
  readonly onLeave?: (isNext?: boolean) => void | Promise<void>;
  /** UI: marks the step as destructive (red Apply button etc.). */
  readonly destructiveStep?: Signal<boolean>;
  /** UI: enables the Close button (e.g. after applyStarted flips). */
  readonly canClose?: Signal<boolean>;
  /** UI: disables the Previous button. */
  readonly disablePrevious?: Signal<boolean>;
  /** UI: text for the Finish button. */
  readonly finishButtonText?: Signal<string>;
  /** UI: text for the Next button. */
  readonly nextButtonText?: Signal<string>;
  /** UI: text for the Cancel button. */
  readonly cancelButtonText?: Signal<string>;
  /** UI: hides the Close button. */
  readonly hideCloseButton?: Signal<boolean>;
  /** UI: shows the busy indicator. */
  readonly showBusy?: Signal<boolean>;
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

  // Signal-handle `hidden` overrides legacy storage. Signal reads inside the
  // getter are tracked by Angular CD so the parent re-evaluates when the
  // signal changes — no EventEmitter needed for the signal-handle path.
  get hidden() {
    return this.signalHandle?.hidden ? this.signalHandle.hidden() : this.pHidden;
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
  get canClose(): boolean {
    return this.signalHandle?.canClose ? this.signalHandle.canClose() : this._canClose;
  }
  @Output() onCanCloseChange = new EventEmitter<boolean>();

  private _hideCloseButton = false;
  @Input()
  set hideCloseButton(v: boolean) { this._hideCloseButton = v; }
  get hideCloseButton(): boolean {
    return this.signalHandle?.hideCloseButton ? this.signalHandle.hideCloseButton() : this._hideCloseButton;
  }

  @Input()
  hideNextButton = false;

  private _nextButtonText = 'Next';
  @Input()
  set nextButtonText(v: string) { this._nextButtonText = v; }
  get nextButtonText(): string {
    return this.signalHandle?.nextButtonText ? this.signalHandle.nextButtonText() : this._nextButtonText;
  }

  private _finishButtonText = 'Finish';
  @Input()
  set finishButtonText(v: string) { this._finishButtonText = v; }
  get finishButtonText(): string {
    return this.signalHandle?.finishButtonText ? this.signalHandle.finishButtonText() : this._finishButtonText;
  }

  private _cancelButtonText = 'Cancel';
  @Input()
  set cancelButtonText(v: string) { this._cancelButtonText = v; }
  get cancelButtonText(): string {
    return this.signalHandle?.cancelButtonText ? this.signalHandle.cancelButtonText() : this._cancelButtonText;
  }

  private _disablePrevious = false;
  @Input()
  set disablePrevious(v: boolean) {
    if (this._disablePrevious !== v) {
      this._disablePrevious = v;
      this.onDisablePreviousChange.emit(v);
    }
  }
  get disablePrevious(): boolean {
    return this.signalHandle?.disablePrevious ? this.signalHandle.disablePrevious() : this._disablePrevious;
  }
  @Output() onDisablePreviousChange = new EventEmitter<boolean>();

  private _blocked = false;
  @Input()
  set blocked(v: boolean) { this._blocked = v; }
  get blocked(): boolean {
    return this.signalHandle?.blocked ? this.signalHandle.blocked() : this._blocked;
  }

  private _destructiveStep = false;
  @Input()
  set destructiveStep(v: boolean) { this._destructiveStep = v; }
  get destructiveStep(): boolean {
    return this.signalHandle?.destructiveStep ? this.signalHandle.destructiveStep() : this._destructiveStep;
  }

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

  private _showBusy = false;
  @Input()
  set showBusy(v: boolean) { this._showBusy = v; }
  get showBusy(): boolean {
    return this.signalHandle?.showBusy ? this.signalHandle.showBusy() : this._showBusy;
  }

  @Input()
  onNext: StepOnNextFunction = () => observableOf({ success: true })

  @Input()
  onEnter: (data: any) => void = () => { }

  @Input()
  onLeave: (isNext?: boolean) => void = () => { }

  /**
   * Effective onLeave — signal-handle overrides legacy. Returns void or a
   * Promise; SteppersComponent should await if it cares about ordering.
   */
  invokeLeave(isNext?: boolean): void | Promise<void> {
    const handleLeave = this.signalHandle?.onLeave;
    return handleLeave ? handleLeave(isNext) : this.onLeave(isNext);
  }

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
          (resolved) => {
            // resolved is `void | Partial<StepOnNextResult>`; void case
            // (Promise.resolve()) isn't an object so guard before merge.
            // Without spreading the resolved object the redirect / redirectPayload
            // flags from routeToServices-style success returns are lost and the
            // stepper can't navigate the user out of the wizard on completion.
            const base = { success: true } as StepOnNextResult;
            if (typeof resolved === 'object' && resolved !== null) {
              return { ...base, ...resolved } as StepOnNextResult;
            }
            return base;
          },
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
      // Signal-handle onEnter overrides legacy. Either path runs the
      // existing destructive-step busy-flag side-effect — Shape 3 wizards
      // (kube-config import, manage-users confirm) rely on this for the
      // pre-submit visual delay.
      const handleEnter = this.signalHandle?.onEnter;
      const enter = handleEnter ?? this.onEnter;
      if (enter) {
        if (this.destructiveStep) {
          this.busy = true;
          setTimeout(() => {
            this.busy = false;
          }, 1000);
        }
        // Promise return values are fire-and-forget here — SteppersComponent
        // doesn't currently await pOnEnter. Wizards needing await semantics
        // should drive their own sequencing through `submit`.
        void enter(data);
      }
    };
  }

}
