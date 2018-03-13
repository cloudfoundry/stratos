import { AfterContentInit, Component, ContentChildren, Input, OnInit, QueryList, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';

import { SteppersService } from '../steppers.service';
import { StepComponent } from './../step/step.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { EntityService } from '../../../../core/entity-service';
import { selectEntity } from '../../../../store/selectors/api.selectors';
import { getPreviousEvent } from '../../../../store/types/routing.type';
import { tap, filter, map } from 'rxjs/operators';
import { RoutesRecognized } from '@angular/router';

@Component({
  selector: 'app-steppers',
  templateUrl: './steppers.component.html',
  styleUrls: ['./steppers.component.scss'],
  providers: [SteppersService],
  encapsulation: ViewEncapsulation.None
})
export class SteppersComponent implements OnInit, AfterContentInit {

  cancel$: Observable<string>;

  @ContentChildren(StepComponent) _steps: QueryList<StepComponent>;

  @Input()
  cancel = null;

  steps: StepComponent[] = [];

  stepValidateSub: Subscription = null;

  currentIndex = 0;

  constructor(
    private steppersService: SteppersService,
    private store: Store<AppState>
  ) {

    this.cancel$ = store.select(getPreviousEvent).pipe(
      map(e => !e ? this.cancel : e.url));
  }

  ngOnInit() {
  }

  ngAfterContentInit() {
    this.steps = this._steps.toArray();
    this.setActive(0);
  }

  goNext() {
    if (this.currentIndex < this.steps.length) {
      const step = this.steps[this.currentIndex];
      step.busy = true;
      step.onNext()
        .first()
        .catch(() => Observable.of({ success: false, message: 'Failed' }))
        .subscribe(({ success, message }) => {
          step.error = !success;
          step.busy = false;
          if (success) {
            this.setActive(this.currentIndex + 1);
          }
        });
    }
  }

  setActive(index: number) {
    if (this.canGoto(index)) {
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
      this.currentIndex = index;
    }
  }

  canGoto(index: number) {
    const step = this.steps[this.currentIndex];
    if (!step || step.busy || step.disablePrevious) {
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

}
