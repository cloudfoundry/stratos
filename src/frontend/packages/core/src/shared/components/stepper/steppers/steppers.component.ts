import { ChangeDetectionStrategy, ChangeDetectorRef, AfterContentInit, Component, ContentChildren, Injector, Input, OnDestroy, OnInit, QueryList, TemplateRef, ViewEncapsulation, afterNextRender, effect, inject, signal, untracked, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoutingHistoryService } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf, Subscription, Unsubscribable } from 'rxjs';
import { take, catchError, defaultIfEmpty, finalize, map, switchMap } from 'rxjs/operators';

import { TailwindSnackBarService, TailwindSnackBarRef } from '../../../services/tailwind-snackbar.service';
import { BASE_REDIRECT_QUERY, StepperRedirectPayload } from '../stepper.types';
import { SteppersService } from '../steppers.service';
import { StepComponent, StepOnNextResult } from './../step/step.component';
import { DotContentComponent } from '../../../../core/dot-content/dot-content.component';
import { AppBusyComponent } from '../../busy-indicator/busy-indicator.component';

@Component({
  selector: 'app-steppers',
  templateUrl: './steppers.component.html',
  styleUrls: ['./steppers.component.scss'],
  providers: [SteppersService],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    AppBusyComponent,
    CommonModule,
    RouterModule,
    DotContentComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The internal `.steppers-wrapper` uses `flex: 1; min-height: 0` to fill
  // the host and let `.steppers-contents` overflow-y:auto scroll while the
  // navigation row stays pinned. Establishing a flex column on the host
  // gives that wrapper a constrained parent to expand into.
  host: { class: 'flex flex-1 flex-col min-h-0' },
})
export class SteppersComponent implements OnInit, AfterContentInit, OnDestroy {
  private steppersService = inject(SteppersService);
  private router = inject(Router);
  private routingHistory = inject(RoutingHistoryService);
  private snackBar = inject(TailwindSnackBarService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);


  private nextSub!: Subscription;
  cancel$: Observable<string>;

  @ContentChildren(StepComponent) stepComponents!: QueryList<StepComponent>;

  readonly cancel = input<string>();
  // When true the Cancel button does a full-page load to `cancel` instead of a
  // router navigation. Needed by first-run setup, which has no in-app
  // destination and wants Cancel to hard-refresh back to the flow's start.
  readonly cancelReload = input(false);
  readonly nextButtonProgress = input(true);
  readonly basePreviousRedirect = input<StepperRedirectPayload | null>(this.route.snapshot.queryParams[BASE_REDIRECT_QUERY] ? {
    path: this.route.snapshot.queryParams[BASE_REDIRECT_QUERY]
} : null);
  // Optional context summary rendered above the step headers. Hosts pass
  // a TemplateRef that surfaces the user's in-progress selections (CF /
  // Org / Space / offering / plan / name) so the wizard always shows
  // "what am I creating?" as later steps navigate away from the picker.
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() contextSummary?: TemplateRef<unknown>;

  steps: StepComponent[] = [];
  allSteps: StepComponent[] = [];
  showNextButtonProgress = false;

  hiddenSubs: Unsubscribable[] = [];

  stepValidateSub: Subscription | null = null;

  private enterData: any;
  private snackBarRef!: TailwindSnackBarRef<any>;

  // Mirrors `steps` so firstStepEntry re-runs whenever the steps re-filter.
  private readonly visibleSteps = signal<StepComponent[]>([]);
  // The projected steps, set once in ngAfterContentInit.
  private readonly contentSteps = signal<StepComponent[]>([]);
  // The active step while every step is hidden, so filterSteps can return
  // to it (or move on from it) once steps are shown again.
  private parkedStep?: StepComponent;

  // A legacy [hidden] change re-filters through hiddenChange, but a
  // signalHandle.hidden change emits nothing. Reading `hidden` here tracks
  // each handle's signal, so the step list re-filters when one flips.
  private readonly signalHiddenSync = effect(() => {
    const visible = this.contentSteps().filter(step => !step.hidden);
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
    const step = this.visibleSteps()[0];
    if (!step || step.blocked) {
      return;
    }
    untracked(() => {
      this.firstStepEntry.destroy();
      // A transition through setActive has already delivered its own onEnter.
      if (this.currentIndex() !== 0) {
        return;
      }
      step.active = true;
      // Route through pOnEnter so signal-handle consumers receive the enter
      // callback, after the render that shows the step (see setActive).
      // markForCheck guarantees the render that afterNextRender waits on.
      this.cdr.markForCheck();
      afterNextRender(() => {
        if (step.active) {
          step.pOnEnter(this.enterData);
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
  cancelQueryParams$: Observable<{
    [key: string]: string;
  }>;
  constructor() {
    const previousRoute$ = this.routingHistory.previousState$.pipe(take(1));
    this.cancel$ = previousRoute$.pipe(
      map(previousState => {
        // If we have a previous state, and that previous state was not login (i.e. we've come from afresh), go to whatever the default
        // cancel state is
        const cancel = this.cancel();
        if (cancel) {
          return cancel;
        }
        return previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : '/home';
      })
    );
    this.cancelQueryParams$ = previousRoute$.pipe(
      map(previousState => previousState && previousState.url !== '/login' ? previousState.state.queryParams : {})
    );
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.hiddenSubs.forEach(sub => sub.unsubscribe());
    this.unsubscribeNext();
    // Only the stepper's own error; other open messages stay.
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
  }

  ngAfterContentInit() {
    this.allSteps = this.stepComponents.toArray();
    this.contentSteps.set(this.allSteps);

    this.allSteps.forEach((step => {
      this.hiddenSubs.push(step.hiddenChange.subscribe((_hidden) => {
        this.filterSteps();
      }));
      // Listen for validation/canClose/disablePrevious changes to trigger
      // change detection. Under OnPush + zoneless CD, setting an @Input on
      // a child step (e.g. via an async pipe in the grandparent template)
      // only marks that child dirty — it does not re-run the stepper's own
      // template bindings that read from `this.steps[i].canClose` etc.
      // Without these markForCheck calls the Previous/Close button
      // disabled state stays frozen at the initial bind state.
      this.hiddenSubs.push(step.validChange.subscribe(() => {
        this.cdr.markForCheck();
      }));
      // busy gates the Next/Apply [disabled] binding; its mutations (e.g.
      // the destructive-entry delay timer in StepComponent.pOnEnter) happen
      // outside this component's CD scope. See StepComponent.busy.
      this.hiddenSubs.push(step.busyChange.subscribe(() => {
        this.cdr.markForCheck();
      }));
      this.hiddenSubs.push(step.canCloseChange.subscribe(() => {
        this.cdr.markForCheck();
      }));
      this.hiddenSubs.push(step.disablePreviousChange.subscribe(() => {
        this.cdr.markForCheck();
      }));
    }));
    this.filterSteps();
  }

  private filterSteps() {
    const parked = this.parkedStep;
    const current = parked ?? this.steps[this.currentIndex()];
    this.parkedStep = undefined;
    this.steps = this.allSteps.filter((step => !step.hidden));
    // Showing or hiding a step before the current one moves it in the
    // list. Follow it, so the index keeps pointing at the step the user is
    // on (the one marked active) instead of at its neighbour or past the end.
    if (current?.active) {
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
        current.active = false;
        this.enterStep(parked ? 0 : Math.min(this.currentIndex(), this.steps.length - 1));
      }
    }
    this.visibleSteps.set(this.steps);
    // Under zoneless CD, reassigning this.steps doesn't mark the view
    // dirty. Without markForCheck the template keeps rendering the step
    // list as it was at ngAfterContentInit, so steps whose [hidden]
    // later flips to false (e.g. Routes once fetch resolves) never
    // appear in the stepper bar.
    this.cdr.markForCheck();
  }

  goNext(): void {
    // Close the stepper's previous error, if there was one, through its
    // ref; other messages open beside it as tabs are not the stepper's.
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    this.unsubscribeNext();
    if (this.currentIndex() < this.steps.length) {
      const step = this.steps[this.currentIndex()];
      step.busy = true;

      // Defensive: step.invokeNext may throw synchronously (runtime error
      // before it returns an observable, or signal-handle.submit() throwing
      // sync). Without a try/catch, the throw escapes goNext, step.busy
      // stays true, and the Next/Finish button is stuck as a spinner
      // forever. Catch, surface via snackbar, reset busy.
      let obs$: Observable<StepOnNextResult> | unknown;
      try {
        obs$ = step.invokeNext(this.currentIndex());
      } catch (err) {
        console.error('Stepper onNext threw synchronously:', err);
        step.busy = false;
        this.showNextButtonProgress = false;
        this.cdr.markForCheck();
        this.snackBarRef = this.snackBar.error(
          `An error occurred: ${(err as Error)?.message || err || 'Unknown error'}`,
          'Dismiss',
          { panelClass: 'stepper-snack-bar' },
        );
        return;
      }

      // Defensive: if onNext returns a non-Observable (legacy synchronous
      // success pattern, or a Promise which we don't handle), reset busy
      // before the early return. Previously this path left step.busy stuck
      // at true even though navigation was effectively complete/no-op.
      if (!(obs$ instanceof Observable)) {
        step.busy = false;
        this.cdr.markForCheck();
        return;
      }

      this.showNextButtonProgress = this.nextButtonProgress();
      this.nextSub = obs$.pipe(
        take(1),
        defaultIfEmpty({ success: false, message: 'No response from step', data: {}, redirect: false, redirectPayload: undefined, ignoreSuccess: false } as StepOnNextResult),
        catchError(err => {
          console.warn('Stepper failed: ', err);
          return observableOf({
            success: false,
            message: err || 'Failed',
            redirectPayload: undefined,
            redirect: false,
            data: {},
            ignoreSuccess: false
          } as StepOnNextResult);
        }),
        switchMap(({ success, data, message, messagePieces, redirect, redirectPayload, ignoreSuccess }) => {
          this.showNextButtonProgress = false;
          step.error = !success;
          step.busy = false;
          // OnPush + zoneless: bare assignments don't mark the stepper view
          // dirty, so the Connect/Next button stays in its spinner state and
          // remains disabled after a failed submit. Without this the user
          // can't retry — bad creds path leaves the dialog frozen.
          this.cdr.markForCheck();
          this.enterData = data;
          if (success && !ignoreSuccess) {
            if (redirect) {
              // Must sub to this
              return this.redirect(redirectPayload);
            } else {
              this.setActive(this.currentIndex() + 1);
            }
          } else if (!success && (messagePieces?.length || message)) {
            this.snackBarRef = this.snackBar.error(
              messagePieces?.length ? messagePieces : message ?? '',
              'Dismiss',
              { panelClass: 'stepper-snack-bar' },
            );
          }
          return observableOf(undefined);
        }),
        // Defensive: guarantee busy state is cleared on ANY teardown path —
        // completion, error escaping catchError, or unsubscribe (e.g. if
        // the user clicks Cancel or navigates away mid-flight while the
        // observable is in flight). Without finalize, the spinner could
        // remain visible after the user abandoned the step.
        finalize(() => {
          step.busy = false;
          this.showNextButtonProgress = false;
          this.cdr.markForCheck();
        })
      ).subscribe();
    }
  }

  redirect(redirectPayload?: StepperRedirectPayload): Observable<void> {
    if (redirectPayload) {
      return observableOf(this.navigate(redirectPayload));
    }
    return combineLatest([
      this.cancel$,
      this.cancelQueryParams$
    ]).pipe(
      map(([path, params]) => {
        this.navigate({ path, query: params });
      })
    );
  }

  // Direct Angular Router navigation, replacing the ngrx RouterNav dispatch +
  // RouterEffect (which did exactly this). String paths are split into route
  // segments and query params are merged into NavigationExtras.
  private navigate(redirectPayload: StepperRedirectPayload): void {
    const { path, query: queryParams, extras = {} } = redirectPayload;
    const commands = typeof path === 'string' ? path.split('/') : path;
    this.router.navigate(commands, { ...extras, queryParams });
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

    // 1) Leave the previous step (with an indication if this is a Next or Previous transition)
    const isNextDirection = index > this.currentIndex();
    this.steps[this.currentIndex()].invokeLeave(isNextDirection);

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
      s.complete = i < index;
      s.active = i === index;
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
      if (enteringStep.active) {
        enteringStep.pOnEnter(enterData);
      }
    }, { injector: this.injector });

    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  private findValidStep(index: number, isNextDirection: boolean) {
    // Ensure the required step can be activated (not skipped), if not continue in the correct direction until we've found one that can be

    // Candidate step index
    index = Math.min(index, this.steps.length - 1);
    // Create list of all not skipped stepped. Any candidate step to go to should exist in here
    const nonSkipSteps = this.steps.filter(step => !step.skip);
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
    if (!step || step.busy || step.disablePrevious || step.skip) {
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
    } else if (step.error) {
      return false;
    }
    if (step.valid) {
      return true;
    } else {
      return false;
    }
  }

  canGoNext(index: number) {
    if (
      !this.steps[index] ||
      !this.steps[index].valid ||
      this.steps[index].busy
    ) {
      return false;
    }
    return true;
  }

  canCancel(index: number) {
    if (
      !this.steps[index] ||
      !this.steps[index].canClose
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
      this.steps[currentIndex].nextButtonText :
      this.steps[currentIndex].finishButtonText;
  }

  getCancelButtonText(currentIndex: number): string {
    return this.steps[currentIndex].cancelButtonText;
  }

  onCancel(index: number) {
    this.steps[index].onLeave(false);
    const cancel = this.cancel();
    if (this.cancelReload() && cancel) {
      // Full page load restarts the wizard from a clean state; the template
      // drops routerLink when cancelReload so this is the only navigation.
      window.location.assign(cancel);
    }
  }
  private unsubscribeNext() {
    if (this.nextSub) {
      this.nextSub.unsubscribe();
    }
  }
}
