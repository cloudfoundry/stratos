
import { of as observableOf, Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { SetNewAppName } from '../../../../../../store/src/actions/create-applications-page.actions';
import { AppNameUniqueChecking } from '../../../../shared/app-name-unique.directive/app-name-unique.directive';

@Component({
  selector: 'app-create-application-step2',
  templateUrl: './create-application-step2.component.html',
  styleUrls: ['./create-application-step2.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class CreateApplicationStep2Component implements OnInit {

  constructor(private store: Store<AppState>, private fb: FormBuilder) { }

  form: FormGroup;

  validate: Observable<boolean>;

  appName = new FormControl();
  appNameChecking: AppNameUniqueChecking = new AppNameUniqueChecking();

  name: string;

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetNewAppName(this.name));
    return observableOf({ success: true });
  }

  onEnter = () => {
    this.appName.updateValueAndValidity();
  }

  ngOnInit() {
    this.form = new FormGroup({ appName: this.appName });
    this.validate = this.form.statusChanges.pipe(
      map(() => {
        return this.form.valid;
      }));
  }

}
