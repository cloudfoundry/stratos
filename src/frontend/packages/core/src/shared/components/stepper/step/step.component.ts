import { ChangeDetectionStrategy, Component, Signal, TemplateRef, input, signal, viewChild } from '@angular/core';

import { StepperRedirectPayload } from '../stepper.types';
import { ErrorPiece, extractHttpErrorPieces, piecesToText } from '@stratosui/store';


export interface StepOnNextResult {
  success: boolean;
  message?: string;
  // `message` as styled pieces (an upstream HTML error page keeps its
  // heading); the stepper shows these above its buttons when set.
  messagePieces?: readonly ErrorPiece[];
  // Should we redirect to the store previous state?
  redirect?: boolean;
  redirectPayload?: StepperRedirectPayload;
  // Ignore the result of a successful `onNext` call. Handy when sometimes you want to avoid navigation/step change
  ignoreSuccess?: boolean;
  data?: any;
}

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
   * Resolves on success; rejects with an Error for the stepper to show its
   * message above the buttons. Resolving with `{ ignoreSuccess: true }`
   * preserves the legacy `StepOnNextResult.ignoreSuccess` semantic — the
   * step reports success without auto-advancing or emitting the success
   * snackbar (used by the `manage-users` two-click apply).
   * When omitted the step auto-succeeds — useful for confirmation screens.
   */
  readonly submit?: () => Promise<void | Partial<StepOnNextResult>>;
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
  /** UI: marks a step that changes things but deletes nothing (yellow button). */
  readonly warningStep?: Signal<boolean>;
  /** UI: enables the Close button (e.g. after applyStarted flips). */
  readonly canClose?: Signal<boolean>;
  /** UI: disables the Previous button. */
  readonly disablePrevious?: Signal<boolean>;
  /** UI: removes the Previous button, for a step nothing can go back from. */
  readonly hidePrevious?: Signal<boolean>;
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
  // Set by the stepper, read by its template. Signals, so a write from a
  // timer or a submit continuation re-renders the stepper by itself.
  readonly active = signal(false);
  readonly complete = signal(false);
  readonly error = signal(false);
  // Disables Next/Apply while a submit runs, and for a moment on entering a
  // destructive or warning step.
  readonly busy = signal(false);

  // Empty when not bound: the single-step base wizards give their step no title.
  readonly title = input('');

  // The legacy inputs, bound as [hidden], [valid], ... Each has an
  // `effective...` getter, which returns the signalHandle's value when the
  // handle has that field and the input's otherwise. Read the getter, not the
  // input: a handle overrides it. The inputs, the handle and its fields are
  // all signals, and the stepper reads the getters in its template and
  // effects, so it follows a change with no change event.
  readonly hidden = input(false);
  get effectiveHidden(): boolean {
    return this.signalHandle()?.hidden?.() ?? this.hidden();
  }

  // With a signalHandle the [valid] input is ignored, whatever the handle has.
  readonly valid = input(true);
  get effectiveValid(): boolean {
    const handle = this.signalHandle();
    return handle ? handle.valid() : this.valid();
  }

  readonly canClose = input(true);
  get effectiveCanClose(): boolean {
    return this.signalHandle()?.canClose?.() ?? this.canClose();
  }

  readonly hideCloseButton = input(false);
  get effectiveHideCloseButton(): boolean {
    return this.signalHandle()?.hideCloseButton?.() ?? this.hideCloseButton();
  }

  readonly hideNextButton = input(false);

  readonly nextButtonText = input('Next');
  get effectiveNextButtonText(): string {
    return this.signalHandle()?.nextButtonText?.() ?? this.nextButtonText();
  }

  readonly finishButtonText = input('Finish');
  get effectiveFinishButtonText(): string {
    return this.signalHandle()?.finishButtonText?.() ?? this.finishButtonText();
  }

  readonly cancelButtonText = input('Cancel');
  get effectiveCancelButtonText(): string {
    return this.signalHandle()?.cancelButtonText?.() ?? this.cancelButtonText();
  }

  readonly disablePrevious = input(false);
  get effectiveDisablePrevious(): boolean {
    return this.signalHandle()?.disablePrevious?.() ?? this.disablePrevious();
  }

  get hidePrevious(): boolean {
    return this.signalHandle()?.hidePrevious?.() ?? false;
  }

  readonly blocked = input(false);
  get effectiveBlocked(): boolean {
    return this.signalHandle()?.blocked?.() ?? this.blocked();
  }

  readonly destructiveStep = input(false);
  get effectiveDestructiveStep(): boolean {
    return this.signalHandle()?.destructiveStep?.() ?? this.destructiveStep();
  }

  readonly warningStep = input(false);
  get effectiveWarningStep(): boolean {
    return this.signalHandle()?.warningStep?.() ?? this.warningStep();
  }

  readonly content = viewChild.required(TemplateRef);

  // When `signalHandle.skipIf` is set, prefer the signal read so admin-only
  // / conditional steps flip without consumers needing to wire boolean
  // bindings. Falls back to the [skip] input for non-signal steps.
  readonly skip = input(false);
  get effectiveSkip(): boolean {
    return this.signalHandle()?.skipIf?.() ?? this.skip();
  }

  readonly showBusy = input(false);
  get effectiveShowBusy(): boolean {
    return this.signalHandle()?.showBusy?.() ?? this.showBusy();
  }

  // The two callbacks are inputs holding a function. Call them through
  // pOnEnter and invokeLeave, which also honour the signalHandle.
  readonly onEnter = input<(data: any) => void>(() => { });

  readonly onLeave = input<(isNext?: boolean) => void>(() => { });

  /**
   * Effective onLeave — signal-handle overrides legacy. Returns void or a
   * Promise; SteppersComponent should await if it cares about ordering.
   */
  invokeLeave(isNext?: boolean): void | Promise<void> {
    const handleLeave = this.signalHandle()?.onLeave;
    return handleLeave ? handleLeave(isNext) : this.onLeave()(isNext);
  }

  /**
   * New (FWT-956) signal-native step contract — additive alongside the
   * legacy `valid` / `skip` / `onNext` inputs. When set, the StepComponent's
   * effective validity / skip / submission delegate to this handle. Wider
   * consumer migration to this shape tracked at FWT-957.
   */
  readonly signalHandle = input<SignalStepHandle>();

  /**
   * Runs the step's submission: the signalHandle's `submit`, or an
   * immediate success for a step without one (a confirmation screen). It
   * never rejects: a submit that throws or rejects gives
   * `{ success: false }` with the error's message.
   */
  async invokeNext(): Promise<StepOnNextResult> {
    const submit = this.signalHandle()?.submit;
    if (!submit) {
      return { success: true };
    }
    try {
      const resolved = await submit();
      // A resolved object carries flags such as redirect/redirectPayload,
      // which take the user out of the wizard on completion.
      return typeof resolved === 'object' && resolved !== null
        ? { ...resolved, success: resolved.success ?? true }
        : { success: true };
    } catch (err) {
      const messagePieces = extractHttpErrorPieces(err);
      return { success: false, message: piecesToText(messagePieces), messagePieces };
    }
  }

  constructor() {
    this.pOnEnter = (data?: any) => {
      // Signal-handle onEnter overrides legacy. Either path runs the
      // existing destructive-step busy-flag side-effect — Shape 3 wizards
      // (kube-config import, manage-users confirm) rely on this for the
      // pre-submit visual delay.
      const handleEnter = this.signalHandle()?.onEnter;
      const enter = handleEnter ?? this.onEnter();
      if (enter) {
        if (this.effectiveDestructiveStep || this.effectiveWarningStep) {
          this.busy.set(true);
          setTimeout(() => {
            this.busy.set(false);
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
