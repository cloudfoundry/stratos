import { ChangeDetectionStrategy, AfterContentInit, Component, ElementRef, Injector, OnDestroy, OnInit, TemplateRef, ViewEncapsulation, afterNextRender, computed, effect, inject, signal, untracked, input, viewChild, contentChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ErrorPiece, RoutingHistoryService } from '@stratosui/store';

import { BASE_REDIRECT_QUERY, StepperRedirectPayload } from '../stepper.types';
import { StepComponent, StepOnNextResult } from './../step/step.component';
import { DotContentComponent } from '../../../../core/dot-content/dot-content.component';
import { ErrorTextComponent } from '../../error-text/error-text.component';
import { AppBusyComponent } from '../../busy-indicator/busy-indicator.component';

@Component({
  selector: 'app-steppers',
  templateUrl: './steppers.component.html',
  styleUrls: ['./steppers.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    AppBusyComponent,
    CommonModule,
    RouterModule,
    DotContentComponent,
    ErrorTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The internal `.steppers-wrapper` uses `flex: 1; min-height: 0` to fill
  // the host and let `.steppers-contents` overflow-y:auto scroll while the
  // navigation row stays pinned. Establishing a flex column on the host
  // gives that wrapper a constrained parent to expand into.
  host: { class: 'flex flex-1 flex-col min-h-0' },
})
export class SteppersComponent implements OnInit, AfterContentInit, OnDestroy {
  private router = inject(Router);
  private routingHistory = inject(RoutingHistoryService);
  private route = inject(ActivatedRoute);
  private injector = inject(Injector);

  // Counts goNext tries; only the latest one's result is used.
  private nextAttempt = 0;

  readonly stepComponents = contentChildren(StepComponent);

  readonly cancel = input<string>();
  // When true the Cancel button does a full-page load to `cancel` instead of a
  // router navigation. Needed by first-run setup, which has no in-app
  // destination and wants Cancel to hard-refresh back to the flow's start.
  readonly cancelReload = input(false);
  // When set, Cancel calls this instead of navigating to `cancel`: for a
  // stepper whose host is not a route, such as the Register Endpoint dialog.
  readonly cancelAction = input<() => void>();
  readonly nextButtonProgress = input(true);
  // Step to open on, with the steps before it complete. For a stepper that
  // resumes mid-flow, e.g. one opened to review work done earlier.
  readonly startIndex = input(0);
  // Delivered as the onEnter data of the step at startIndex.
  readonly startData = input<unknown>(undefined);
  readonly basePreviousRedirect = input<StepperRedirectPayload | null>(this.route.snapshot.queryParams[BASE_REDIRECT_QUERY] ? {
    path: this.route.snapshot.queryParams[BASE_REDIRECT_QUERY]
} : null);
  // Optional context summary rendered above the step headers. Hosts pass
  // a TemplateRef that surfaces the user's in-progress selections (CF /
  // Org / Space / offering / plan / name) so the wizard always shows
  // "what am I creating?" as later steps navigate away from the picker.
  readonly contextSummary = input<TemplateRef<unknown>>();

  steps: StepComponent[] = [];
  allSteps: StepComponent[] = [];
  readonly showNextButtonProgress = signal(false);

  private enterData: any;
  // Why the current step's last try failed. It sits above the buttons: a toast,
  // at the bottom of the page, covered a dialog's Cancel and Next.
  readonly stepError = signal<readonly ErrorPiece[] | null>(null);
  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('nextButton');

  // Mirrors `steps`, for the template and firstStepEntry: both follow a
  // re-filter by reading it.
  protected readonly visibleSteps = signal<StepComponent[]>([]);
  // The projected steps, set once in ngAfterContentInit.
  private readonly contentSteps = signal<StepComponent[]>([]);
  // The active step while every step is hidden, so filterSteps can return
  // to it (or move on from it) once steps are shown again.
  private parkedStep?: StepComponent;

  // Reading `effectiveHidden` here tracks each step's [hidden] input and
  // its handle's hidden signal, so the step list re-filters when either flips.
  private readonly signalHiddenSync = effect(() => {
    const visible = this.contentSteps().filter(step => !step.effectiveHidden);
    untracked(() => {
      if (visible.length !== this.steps.length || visible.some((step, i) => step !== this.steps[i])) {
        this.filterSteps();
      }
    });
  });

  // Delivers the first visible step's onEnter once that step exists and is
  // unblocked. setActive(0) cannot do it: no step is visible until
  // filterSteps runs, and a blocked step (e.g. the CF picker while no CF is
  // connected) can unblock at any later time. `blocked` reads the step's
  // signals, so this re-runs only when it can change, and it destroys itself
  // after the one delivery. It replaces a 5 ms setInterval that kept polling
  // for as long as the first step stayed blocked.
  private readonly firstStepEntry = effect(() => {
    const index = this.startIndex();
    const step = this.visibleSteps()[index];
    if (!step || step.effectiveBlocked) {
      return;
    }
    untracked(() => {
      this.firstStepEntry.destroy();
      // A transition through setActive has already delivered its own onEnter.
      if (this.currentIndex() !== 0) {
        return;
      }
      if (index > 0) {
        this.enterData = this.startData();
        this.enterStep(index);
        return;
      }
      // The signal write schedules the render that afterNextRender waits on.
      step.active.set(true);
      // Route through pOnEnter so signal-handle consumers receive the enter
      // callback, after the render that shows the step (see setActive).
      afterNextRender(() => {
        if (step.active()) {
          step.pOnEnter(this.enterData ?? this.startData());
        }
      }, { injector: this.injector });
    });
  });

  // Signal (read directly in the template as currentIndex()) so the action
  // buttons' [disabled]/text bindings re-render under zoneless CD when the
  // step changes. The step transition completes inside an async submit
  // continuation (a Promise resolved by signal-handle.submit); a plain
  // property + markForCheck there did not flush, leaving the finish/Apply
  // button stale on the final step. A signal write reliably triggers
  // zoneless CD, and a direct template read establishes the dependency
  // (a getter-wrapped read does not track for signal-driven CD).
  readonly currentIndex = signal(0);

  // The page before the wizard, read once: at the first render of the Cancel
  // link (by then the navigation here is recorded), or at a redirect.
  // Untracked, so later navigations do not move it.
  private readonly previousRoute = computed(() => untracked(this.routingHistory.previousState));

  // Cancel goes to the cancel input, else back to the page before the wizard
  // (unless that was login, i.e. we've come afresh), else home.
  readonly cancelLink = computed(() => {
    const previousState = this.previousRoute();
    return this.cancel() || (previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home');
  });

  readonly cancelQueryParams = computed(() => {
    const previousState = this.previousRoute();
    return previousState && previousState.url !== '/login' ? previousState.state.queryParams : {};
  });

  ngOnInit() { }

  ngOnDestroy() {
    // Drops the result of a submit still running.
    this.nextAttempt++;
  }

  ngAfterContentInit() {
    this.allSteps = [...this.stepComponents()];
    this.contentSteps.set(this.allSteps);
    this.filterSteps();
  }

  private filterSteps() {
    const parked = this.parkedStep;
    const current = parked ?? this.steps[this.currentIndex()];
    this.parkedStep = undefined;
    this.steps = this.allSteps.filter((step => !step.effectiveHidden));
    // Showing or hiding a step before the current one moves it in the
    // list. Follow it, so the index keeps pointing at the step the user is
    // on (the one marked active) instead of at its neighbour or past the end.
    if (current?.active()) {
      const index = this.steps.indexOf(current);
      if (index >= 0) {
        this.currentIndex.set(index);
      } else if (!this.steps.length) {
        // Every step is hidden: nothing to show or follow until one returns.
        this.parkedStep = current;
      } else {
        // The current step itself was hidden: enter the step now shown in
        // its place (clamped to the end of the list). After every step was
        // hidden the old position means nothing, so start from the first.
        current.active.set(false);
        this.enterStep(parked ? 0 : Math.min(this.currentIndex(), this.steps.length - 1));
      }
    }
    // The template reads the list from here, so a step shown later (e.g.
    // Routes once its fetch resolves) appears in the stepper bar.
    this.visibleSteps.set(this.steps);
  }

  goNext(): void {
    this.stepError.set(null);
    const step = this.steps[this.currentIndex()];
    if (!step) {
      return;
    }
    // A later goNext, or the stepper's destruction, supersedes this try:
    // its result is then dropped, as an unsubscribe used to drop it.
    const attempt = ++this.nextAttempt;
    step.busy.set(true);
    this.showNextButtonProgress.set(this.nextButtonProgress());
    step.invokeNext()
      .catch((err: unknown): StepOnNextResult => {
        console.error('Stepper next failed:', err);
        return { success: false, message: `An error occurred: ${(err as Error)?.message || err || 'Unknown error'}` };
      })
      .then(result => {
        if (attempt === this.nextAttempt) {
          this.finishNext(step, result);
        }
      });
  }

  private finishNext(step: StepComponent, { success, data, message, messagePieces, redirect, redirectPayload, ignoreSuccess }: StepOnNextResult): void {
    this.showNextButtonProgress.set(false);
    step.error.set(!success);
    step.busy.set(false);
    this.enterData = data;
    if (success && !ignoreSuccess) {
      if (redirect) {
        this.redirect(redirectPayload);
      } else {
        this.setActive(this.currentIndex() + 1);
      }
    } else {
      if (!success && (messagePieces?.length || message)) {
        this.stepError.set(messagePieces?.length ? messagePieces : [{ text: message ?? '', style: 'text' }]);
      }
      this.restoreNextFocus();
    }
  }

  // Busy disables Next, and the browser then moves its focus to the page. A
  // step that stays gives it back, unless the user has since gone elsewhere.
  private restoreNextFocus(): void {
    afterNextRender(() => {
      if (document.activeElement === document.body) {
        this.nextButton()?.nativeElement.focus();
      }
    }, { injector: this.injector });
  }

  // Next, only when the Next button is shown and enabled. For Enter in a
  // step's form, which must not do what the disabled button would not.
  goNextIfAllowed(): void {
    const index = this.currentIndex();
    const step = this.steps[index];
    if (step && !step.hideNextButton() && !step.busy() && !step.effectiveBlocked && this.canGoNext(index)) {
      this.goNext();
    }
  }

  redirect(redirectPayload?: StepperRedirectPayload): void {
    this.navigate(redirectPayload ?? { path: this.cancelLink(), query: this.cancelQueryParams() });
  }

  // Direct Angular Router navigation, replacing the ngrx RouterNav dispatch +
  // RouterEffect (which did exactly this). String paths are split into route
  // segments and query params are merged into NavigationExtras.
  private navigate(redirectPayload: StepperRedirectPayload): void {
    const { path, query: queryParams, extras = {} } = redirectPayload;
    const commands = typeof path === 'string' ? path.split('/') : path;
    this.router.navigate(commands, { ...extras, queryParams });
  }

  // Previous button.
  goPrevious(): void {
    this.setActive(this.currentIndex() - 1);
  }

  // Moves to a completed step (or any step canGoto allows), e.g. from its header.
  goTo(index: number): void {
    this.setActive(index);
  }

  setActive(index: number): void {
    const basePreviousRedirect = this.basePreviousRedirect();
    if (basePreviousRedirect && index < 0) {
      this.navigate(basePreviousRedirect);
    }
    // The first step's initial onEnter is delivered by firstStepEntry.
    if (!this.canGoto(index)) {
      return;
    }
    this.stepError.set(null);

    // 1) Leave the previous step (with an indication if this is a Next or Previous transition)
    const current = this.currentIndex();
    const isNextDirection = index > current;
    this.steps[current].invokeLeave(isNextDirection);
    // Going back over several steps leaves each one passed too, nearest
    // first, so every leave hook can undo what its step started.
    for (let i = current - 1; !isNextDirection && i > index; i--) {
      this.steps[i].invokeLeave(false);
    }

    // 2) Determine if the required step is ok (and if not find the next/previous valid step)
    index = this.findValidStep(index, isNextDirection);
    if (index === -1) {
      return;
    }

    // 3) Set stepper state WRT required step
    this.enterStep(index);
  }

  private enterStep(index: number): void {
    this.steps.forEach((s, i) => {
      s.complete.set(i < index);
      s.active.set(i === index);
    });
    this.currentIndex.set(index);
    // Route through pOnEnter so signal-handle consumers (FWT-959 Shape 3
    // wizards) receive the enter callback — the legacy onEnter @Input
    // defaults to a no-op, so a raw step.onEnter call swallows
    // signalHandle.onEnter.
    //
    // Delivery is deferred to after the NEXT render. Note: projected step
    // content is NOT lazily instantiated — Ivy constructs <ng-content> inside
    // an <ng-template> on first render regardless of the active step, so a
    // step's directives/@Inputs (and their ngOnChanges) run up-front. The
    // deferral is instead about ordering relative to THIS transition: the
    // entering step is already marked active just above, but change detection
    // has not yet re-rendered the content outlet for the new currentIndex, so
    // a synchronous pOnEnter would run against a view that is still showing
    // the outgoing step and onEnter side effects (e.g. building a list keyed
    // off the now-active step) could see stale state. afterNextRender
    // guarantees the enter callback fires once the step is rendered (#5600:
    // specify-details-step never received onEnter, so its formMode was never
    // set and the step rendered empty).
    const enteringStep = this.steps[index];
    const enterData = this.enterData;
    this.enterData = undefined;
    afterNextRender(() => {
      // A further transition can land before this render callback fires —
      // only deliver if the step is still the active one.
      if (enteringStep.active()) {
        enteringStep.pOnEnter(enterData);
      }
    }, { injector: this.injector });
  }

  private findValidStep(index: number, isNextDirection: boolean) {
    // Ensure the required step can be activated (not skipped), if not continue in the correct direction until we've found one that can be

    // Candidate step index
    index = Math.min(index, this.steps.length - 1);
    // Create list of all not skipped stepped. Any candidate step to go to should exist in here
    const nonSkipSteps = this.steps.filter(step => !step.effectiveSkip);
    // Iterate through steps until we find a valid one
    while (true) {
      // Can this step be activated (exists in nonSkippedSteps)?
      const found = nonSkipSteps.findIndex(step => step === this.steps[index]) >= 0;
      if (found) {
        // Yes, step is valid
        return index;
      }
      // No? Try again with the next or previous step
      index = isNextDirection ? ++index : --index;
      if (index < 0 || this.steps.length <= index) {
        break;
      }
    }
    return -1;
  }

  canGoto(index: number): boolean {
    if (index < 0 && this.basePreviousRedirect()) {
      return true;
    }
    const step = this.steps[this.currentIndex()];
    if (!step || step.busy() || step.effectiveDisablePrevious || step.effectiveSkip) {
      return false;
    }
    if (index === this.currentIndex()) {
      return true;
    }
    if (index < 0 || index >= this.steps.length) {
      return false;
    }
    if (index < this.currentIndex()) {
      return true;
    } else if (step.error()) {
      return false;
    }
    if (step.effectiveValid) {
      return true;
    } else {
      return false;
    }
  }

  canGoNext(index: number) {
    if (
      !this.steps[index] ||
      !this.steps[index].effectiveValid ||
      this.steps[index].busy()
    ) {
      return false;
    }
    return true;
  }

  canCancel(index: number) {
    if (
      !this.steps[index] ||
      !this.steps[index].effectiveCanClose
    ) {
      return false;
    }
    return true;
  }

  getIconLigature(): string {
    return 'done';
  }

  getNextButtonText(currentIndex: number): string {
    return currentIndex + 1 < this.steps.length ?
      this.steps[currentIndex].effectiveNextButtonText :
      this.steps[currentIndex].effectiveFinishButtonText;
  }

  getCancelButtonText(currentIndex: number): string {
    return this.steps[currentIndex].effectiveCancelButtonText;
  }

  onCancel(index: number) {
    // invokeLeave, not onLeave: a step driven by a signal handle has its
    // leave hook there.
    void this.steps[index].invokeLeave(false);
    const cancelAction = this.cancelAction();
    if (cancelAction) {
      cancelAction();
      return;
    }
    const cancel = this.cancel();
    if (this.cancelReload() && cancel) {
      // Full page load restarts the wizard from a clean state; the template
      // drops routerLink when cancelReload so this is the only navigation.
      window.location.assign(cancel);
    }
  }
}
