import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { catchError, first, map, switchMap } from 'rxjs/operators';

import { LoggerService } from '../../../../core/logger.service';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { getPreviousRoutingState } from '../../../../store/types/routing.type';
import { SteppersService } from '../steppers.service';
import { StepComponent } from './../step/step.component';



@Component({
  selector: 'app-steppers',
  templateUrl: './steppers.component.html',
  styleUrls: ['./steppers.component.scss'],
  providers: [SteppersService],
  encapsulation: ViewEncapsulation.None
})
export class SteppersComponent implements OnInit, AfterContentInit, OnDestroy {

  private nextSub: Subscription;
  cancel$: Observable<string>;

  @ContentChildren(StepComponent) _steps: QueryList<StepComponent>;

  @Input() cancel = null;
  @Input() nextButtonProgress = true;

  steps: StepComponent[] = [];
  allSteps: StepComponent[] = [];
  showNextButtonProgress = false;

  hiddenSubs: Subscription[] = [];

  stepValidateSub: Subscription = null;

  private enterData;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  currentIndex = 0;
  cancelQueryParams$: Observable<{
    [key: string]: string;
  }>;
  constructor(
    private steppersService: SteppersService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    private logger: LoggerService,
  ) {
    const previousRoute$ = store.select(getPreviousRoutingState).pipe(first());
    this.cancel$ = previousRoute$.pipe(
      map(previousState => {
        // If we have a previous state, and that previous state was not login (i.e. we've come from afresh), go to whatever the default
        // cancel state is
        return previousState && previousState.url !== '/login' ? previousState.url.split('?')[0] : this.cancel;
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
    this.allSteps = this._steps.toArray();
    this.setActive(0);

    this.allSteps.forEach((step => {
      this.hiddenSubs.push(step.onHidden.subscribe((hidden) => {
        this.filterSteps();
      }));
    }));
    this.filterSteps();
  }

  private filterSteps() {
    this.steps = this.allSteps.filter((step => !step.hidden));
  }

  goNext() {
    // Close previous error snackbar if there was one
    if (this.snackBarRef) {
      this.snackBar.dismiss();
    }

    this.unsubscribeNext();
    if (this.currentIndex < this.steps.length) {
      const step = this.steps[this.currentIndex];
      step.busy = true;
      const obs$ = step.onNext();
      if (!(obs$ instanceof Observable)) {
        return;
      }
      this.showNextButtonProgress = this.nextButtonProgress;
      this.nextSub = obs$.pipe(
        first(),
        catchError(err => {
          this.logger.warn('Stepper failed: ', err);
          return observableOf({ success: false, message: 'Failed', redirect: false, data: {}, ignoreSuccess: false });
        }),
        switchMap(({ success, data, message, redirect, ignoreSuccess }) => {
          this.showNextButtonProgress = false;
          step.error = !success;
          step.busy = false;
          this.enterData = data;
          if (success && !ignoreSuccess) {
            if (redirect) {
              // Must sub to this
              return this.redirect();
            } else {
              this.setActive(this.currentIndex + 1);
            }
          } else if (!success && message) {
            this.snackBarRef = this.snackBar.open(message, 'Dismiss');
          }
          return [];
        })).subscribe();
    }
  }

  redirect() {
    return combineLatest(
      this.cancel$,
      this.cancelQueryParams$
    ).pipe(
      map(([path, params]) => {
        this.store.dispatch(new RouterNav({ path: path, query: params }));
      })
    );
  }

  setActive(index: number) {
    if (!this.canGoto(index)) {
      if (index === 0) {
        if (this.allSteps && this.allSteps.length > 0) {
          // Execute `onEnter` for the first step as soon as step is unblocked
          const timer = setInterval(() => {
            if (this.allSteps[index].blocked === false) {
              this.allSteps[index].active = true;
              this.allSteps[index]._onEnter(this.enterData);
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
    this.steps.forEach((_step, i) => {
      _step.complete = i < index;
      _step.active = i === index;
    });
    this.currentIndex = index;
    this.steps[this.currentIndex]._onEnter(this.enterData);
    this.enterData = undefined;
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
    const step = this.steps[this.currentIndex];
    if (!step || step.busy || step.disablePrevious || step.skip) {
      return false;
    }
    if (index === this.currentIndex) {
      return true;
    }
    if (index < 0 || index > this.steps.length) {
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

  canGoNext(index) {
    if (
      !this.steps[index] ||
      !this.steps[index].valid ||
      this.steps[index].busy
    ) {
      return false;
    }
    return true;
  }

  canCancel(index) {
    if (
      !this.steps[index] ||
      !this.steps[index].canClose
    ) {
      return false;
    }
    return true;
  }

  getIconLigature(step: StepComponent, index: number): 'done' {
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
