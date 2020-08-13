import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { SetNewAppName } from '../../../../../../cloud-foundry/src/actions/create-applications-page.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppNameUniqueChecking } from '../../../../shared/directives/app-name-unique.directive/app-name-unique.directive';

@Component({
  selector: 'app-create-application-step2',
  templateUrl: './create-application-step2.component.html',
  styleUrls: ['./create-application-step2.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class CreateApplicationStep2Component implements OnInit {

  constructor(private store: Store<CFAppState>, private fb: FormBuilder) { }

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
