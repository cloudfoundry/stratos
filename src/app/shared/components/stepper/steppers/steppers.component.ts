import { AfterContentInit, Component, ContentChildren, forwardRef, Input, OnInit, QueryList } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';

import { StepComponent } from './../step/step.component';

@Component({
  selector: 'app-steppers',
  templateUrl: './steppers.component.html',
  styleUrls: ['./steppers.component.scss']
})
export class SteppersComponent implements OnInit, AfterContentInit {

  constructor() { }

  @Input()
  cancel = null;

  @ContentChildren(forwardRef(() => StepComponent), { descendants: true })
  _steps: QueryList<StepComponent>;

  steps: StepComponent[] = [];

  stepValidateSub: Subscription = null;

  currentIndex = 0;

  nextButtonText = 'Next';

  finishButtonText = 'Finish';

  ngOnInit() { }

  ngAfterContentInit() {
    this.initSteps(this._steps);
    this._steps.changes.subscribe((steps: QueryList<StepComponent>) => {
      this.initSteps(steps);
    });
    this.setActive(this.currentIndex);
  }

  initSteps(steps: QueryList<StepComponent>) {
    this.steps = steps.toArray();
    this.observeStepsValidation(this.steps);
  }

  observeStepsValidation(steps: StepComponent[]) {
    if (this.stepValidateSub) {
      this.stepValidateSub.unsubscribe();
    }
    const validatorObs: Observable<boolean>[] = steps.map(step => {
      return step.validate;
    });
    this.stepValidateSub = Observable.combineLatest(
      validatorObs
    )
      .subscribe(results => {
        results.forEach((res, i) => {
          const step = this.steps[i];
          step.valid = res;
          step.error = false;
        });
      });
  }

  goNext(index: number) {
    const step = this.steps[index];
    step.busy = true;

    step.onNext()
      .first()
      .catch(() => Observable.of({ success: false, message: 'Failed' }))
      .subscribe(({ success, message }) => {
        step.error = !success;
        step.busy = false;
        if (success) {
          this.setActive(index + 1);
        }
      });
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
    // TODO: tidy this up
    const step = this.steps[this.currentIndex];
    if (!step || step.busy) {
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
    const nextIndex = index + 1;
    if (nextIndex > this.steps.length) {
      return true;
    } else {
      return this.canGoto(nextIndex);
    }
  }

  getIconLigature(step: StepComponent, index: number): 'done' {
    return 'done';
  }

  getNextButtonText(nextIndex: number): string {
    return nextIndex < this.steps.length ?
      this.nextButtonText :
      this.finishButtonText;
  }

}
