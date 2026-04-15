import { ChangeDetectionStrategy, ChangeDetectorRef, AfterContentInit, Component, ContentChildren, Input, OnDestroy, OnInit, QueryList, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TailwindSnackBarService, TailwindSnackBarRef } from '../../../services/tailwind-snackbar.service';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { getPreviousRoutingState, IRouterNavPayload, RouterNav, AppState } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { take, catchError, defaultIfEmpty, finalize, map, switchMap } from 'rxjs/operators';

import { BASE_REDIRECT_QUERY } from '../stepper.types';
import { SteppersService } from '../steppers.service';
import { StepComponent, StepOnNextResult } from './../step/step.component';
import { DotContentComponent } from '../../../../core/dot-content/dot-content.component';

@Component({
  selector: 'app-steppers',
  templateUrl: './steppers.component.html',
  styleUrls: ['./steppers.component.scss'],
  providers: [SteppersService],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DotContentComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SteppersComponent implements OnInit, AfterContentInit, OnDestroy {
  private steppersService = inject(SteppersService);
  private store = inject<Store<AppState>>(Store);
  private snackBar = inject(TailwindSnackBarService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);


  private nextSub!: Subscription;
  cancel$: Observable<string>;

  @ContentChildren(StepComponent) stepComponents!: QueryList<StepComponent>;

  @Input() cancel: string = null;
  @Input() nextButtonProgress = true;
  @Input() basePreviousRedirect: IRouterNavPayload = this.route.snapshot.queryParams[BASE_REDIRECT_QUERY] ? {
    path: this.route.snapshot.queryParams[BASE_REDIRECT_QUERY]
  } : null;

  steps: StepComponent[] = [];
  allSteps: StepComponent[] = [];
  showNextButtonProgress = false;

  hiddenSubs: Subscription[] = [];

  stepValidateSub: Subscription = null;

  private enterData: any;
  private snackBarRef!: TailwindSnackBarRef<any>;

  currentIndex = 0;
  cancelQueryParams$: Observable<{
    [key: string]: string;
  }>;
  constructor() {
    const store = this.store;

    const previousRoute$ = store.select(getPreviousRoutingState).pipe(take(1));
    this.cancel$ = previousRoute$.pipe(
      map(previousState => {
        // If we have a previous state, and that previous state was not login (i.e. we've come from afresh), go to whatever the default
        // cancel state is
        if (this.cancel) {
          return this.cancel;
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
    if (this.snackBarRef) {
      this.snackBar.dismiss();
    }
  }

  ngAfterContentInit() {
    this.allSteps = this.stepComponents.toArray();
    this.setActive(0);

    this.allSteps.forEach((step => {
      this.hiddenSubs.push(step.onHidden.subscribe((_hidden) => {
        this.filterSteps();
      }));
      // Listen for validation/canClose/disablePrevious changes to trigger
      // change detection. Under OnPush + zoneless CD, setting an @Input on
      // a child step (e.g. via an async pipe in the grandparent template)
      // only marks that child dirty — it does not re-run the stepper's own
      // template bindings that read from `this.steps[i].canClose` etc.
      // Without these markForCheck calls the Previous/Close button
      // disabled state stays frozen at the initial bind state.
      this.hiddenSubs.push(step.onValidChange.subscribe(() => {
        this.cdr.markForCheck();
      }));
      this.hiddenSubs.push(step.onCanCloseChange.subscribe(() => {
        this.cdr.markForCheck();
      }));
      this.hiddenSubs.push(step.onDisablePreviousChange.subscribe(() => {
        this.cdr.markForCheck();
      }));
    }));
    this.filterSteps();
  }

  private filterSteps() {
    this.steps = this.allSteps.filter((step => !step.hidden));
  }

  goNext(): void {
    // Close previous error snackbar if there was one
    if (this.snackBarRef) {
      this.snackBar.dismiss();
    }
    this.unsubscribeNext();
    if (this.currentIndex < this.steps.length) {
      const step = this.steps[this.currentIndex];
      step.busy = true;

      // Defensive: step.onNext may throw synchronously (runtime error before
      // it returns an observable). Without a try/catch, the throw escapes
      // goNext, step.busy stays true, and the Next/Finish button is stuck
      // as a spinner forever. Catch, surface via snackbar, reset busy.
      let obs$: Observable<StepOnNextResult> | unknown;
      try {
        obs$ = step.onNext(this.currentIndex, step);
      } catch (err) {
        console.error('Stepper onNext threw synchronously:', err);
        step.busy = false;
        this.showNextButtonProgress = false;
        this.snackBarRef = this.snackBar.open(
          `An error occurred: ${(err as Error)?.message || err || 'Unknown error'}`,
          'Dismiss',
          // duration: 0 means "stay open until user clicks Dismiss" (no
          // auto-dismiss). Matches reference console481 behavior; the
          // default 4s auto-dismiss hid errors before users could read them.
          { panelClass: 'stepper-snack-bar', duration: 0 }
        );
        return;
      }

      // Defensive: if onNext returns a non-Observable (legacy synchronous
      // success pattern, or a Promise which we don't handle), reset busy
      // before the early return. Previously this path left step.busy stuck
      // at true even though navigation was effectively complete/no-op.
      if (!(obs$ instanceof Observable)) {
        step.busy = false;
        return;
      }

      this.showNextButtonProgress = this.nextButtonProgress;
      this.nextSub = obs$.pipe(
        take(1),
        defaultIfEmpty({ success: false, message: 'No response from step', data: {}, redirect: false, redirectPayload: null, ignoreSuccess: false } as StepOnNextResult),
        catchError(err => {
          console.warn('Stepper failed: ', err);
          return observableOf({
            success: false,
            message: err || 'Failed',
            redirectPayload: null,
            redirect: false,
            data: {},
            ignoreSuccess: false
          } as StepOnNextResult);
        }),
        switchMap(({ success, data, message, redirect, redirectPayload, ignoreSuccess }) => {
          this.showNextButtonProgress = false;
          step.error = !success;
          step.busy = false;
          this.enterData = data;
          if (success && !ignoreSuccess) {
            if (redirect) {
              // Must sub to this
              return this.redirect(redirectPayload);
            } else {
              this.setActive(this.currentIndex + 1);
            }
          } else if (!success && message) {
            this.snackBarRef = this.snackBar.open(
              message,
              'Dismiss',
              // duration: 0 — stay open until user clicks Dismiss.
              { panelClass: 'stepper-snack-bar', duration: 0 }
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
        })
      ).subscribe();
    }
  }

  redirect(redirectPayload?: IRouterNavPayload): Observable<void> {
    if (redirectPayload) {
      return observableOf(this.dispatchRedirect(redirectPayload));
    }
    return combineLatest([
      this.cancel$,
      this.cancelQueryParams$
    ]).pipe(
      map(([path, params]) => {
        this.dispatchRedirect({ path, query: params });
      })
    );
  }

  private dispatchRedirect(redirectPayload: IRouterNavPayload): void {
    this.store.dispatch(new RouterNav(redirectPayload));
  }

  setActive(index: number): void {
    if (this.basePreviousRedirect && index < 0) {
      this.dispatchRedirect(this.basePreviousRedirect);
    }
    if (!this.canGoto(index)) {
      if (index === 0) {
        if (this.allSteps && this.allSteps.length > 0) {
          // Execute `onEnter` for the first step as soon as step is unblocked
          const timer = setInterval(() => {
            if (this.allSteps[index].blocked === false) {
              this.allSteps[index].active = true;
              if (this.allSteps[index].onEnter) {
                this.allSteps[index].onEnter(this.enterData);
              }
              clearInterval(timer);
            }
          }, 5);
        }
      }
      return;
    }

    // 1) Leave the previous step (with an indication if this is a Next or Previous transition)
    const isNextDirection = index > this.currentIndex;
    this.steps[this.currentIndex].onLeave(isNextDirection);

    // 2) Determine if the required step is ok (and if not find the next/previous valid step)
    index = this.findValidStep(index, isNextDirection);
    if (index === -1) {
      return;
    }

    // 3) Set stepper state WRT required step
    this.steps.forEach((s, i) => {
      s.complete = i < index;
      s.active = i === index;
    });
    this.currentIndex = index;
    if (this.steps[this.currentIndex].onEnter) {
      this.steps[this.currentIndex].onEnter(this.enterData);
    }
    this.enterData = undefined;

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
    if (index < 0 && this.basePreviousRedirect) {
      return true;
    }
    const step = this.steps[this.currentIndex];
    if (!step || step.busy || step.disablePrevious || step.skip) {
      return false;
    }
    if (index === this.currentIndex) {
      return true;
    }
    if (index < 0 || index >= this.steps.length) {
      return false;
    }
    if (index < this.currentIndex) {
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

  getIconLigature(_step: StepComponent, _index: number): string {
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
  private unsubscribeNext() {
    if (this.nextSub) {
      this.nextSub.unsubscribe();
    }
  }
}
