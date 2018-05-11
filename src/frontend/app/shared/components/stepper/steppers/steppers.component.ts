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
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { first, map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs/Rx';

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

  @Input('cancel') cancel = null;

  steps: StepComponent[] = [];

  stepValidateSub: Subscription = null;

  currentIndex = 0;
  cancelQueryParams$: Observable<{
    [key: string]: string;
  }>;
  constructor(
    private steppersService: SteppersService,
    private store: Store<AppState>
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

  ngOnInit() {
  }

  ngAfterContentInit() {
    this.steps = this._steps.toArray();
    this.setActive(0);
  }

  goNext() {
    this.unsubscribeNext();
    if (this.currentIndex < this.steps.length) {
      const step = this.steps[this.currentIndex];
      step.busy = true;
      const obs$ = step.onNext();
      if (!(obs$ instanceof Observable)) {
        return;
      }
      this.nextSub = obs$
        .first()
        .catch(() => Observable.of({ success: false, message: 'Failed', redirect: false, ignoreSuccess: false }))
        .switchMap(({ success, message, redirect, ignoreSuccess }) => {
          step.error = !success;
          step.busy = false;
          if (success && !ignoreSuccess) {
            if (redirect) {
              // Must sub to this
              return this.redirect();
            } else {
              this.setActive(this.currentIndex + 1);
            }
          }
          return [];
        })
        .subscribe();
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
      return;
    }
    // We do allow next beyond the last step to
    // allow the last step to finish up
    // This shouldn't effect the state of the stepper though.
    index = Math.min(index, this.steps.length - 1);
    this.steps.forEach((_step, i) => {
      if (i < index) {
        _step.complete = true;
      } else {
        _step.complete = false;
      }
      _step.active = i === index ? true : false;
    });
    this.steps[this.currentIndex].onLeave();
    index = this.steps[index].skip ? ++index : index;
    this.currentIndex = index;
    this.steps[this.currentIndex]._onEnter();
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
  ngOnDestroy() {
    this.unsubscribeNext();
  }

}
