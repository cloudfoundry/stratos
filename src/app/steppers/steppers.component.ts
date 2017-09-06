import { Observable, Observer, Subscription } from 'rxjs/Rx';
import { StepComponent, ValidatorFunction } from './../step/step.component';
import { Component, ContentChildren, forwardRef, OnInit, QueryList, AfterContentInit } from '@angular/core';

@Component({
  selector: 'app-steppers',
  templateUrl: './steppers.component.html',
  styleUrls: ['./steppers.component.scss']
})
export class SteppersComponent implements OnInit, AfterContentInit {

  constructor() { }

  @ContentChildren(forwardRef(() => StepComponent), { descendants: true })
  _steps: QueryList<StepComponent>;

  steps: StepComponent[] = [];

  stepValidateSub: Subscription = null;

  currentIndex = 0;

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
    const validationFunctions: Observable<boolean>[] = steps.map(step => {
      return step.validate();
    });
    this.stepValidateSub = Observable.forkJoin(
      validationFunctions
    ).subscribe(results => {
      console.log(results);
      results.forEach((res, i) => {
        this.steps[i].valid = res;
      });
    });
  }

  setActive(index: number) {
    if (this.canGoto(index)) {
      this.steps.forEach((_step, i) => {
        _step.active = i === index ? true : false;
      });
      this.currentIndex = index;
    }
  }

  canGoto(index: number) {
    if (index < 0 || index > this.steps.length) {
      return false;
    }
    if (index <= this.currentIndex) {
      return true;
    }
    const step = this.steps[this.currentIndex];
    if (step.valid) {
      return true;
    }
    return false;
  }

  getIconLigature(step: StepComponent, index: number): 'done' {
    return 'done';
  }

}
