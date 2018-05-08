import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { SetNewAppName } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';
import { AppNameUniqueChecking } from '../../app-name-unique.directive/app-name-unique.directive';

@Component({
  selector: 'app-create-application-step2',
  templateUrl: './create-application-step2.component.html',
  styleUrls: ['./create-application-step2.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class CreateApplicationStep2Component implements OnInit {

  constructor(private store: Store<AppState>, private fb: FormBuilder) {
  }

  form: FormGroup;

  validate: Observable<boolean>;

  appName = new FormControl();
  appNameChecking: AppNameUniqueChecking = new AppNameUniqueChecking();

  name: string;

  onNext = () => {
    this.store.dispatch(new SetNewAppName(this.name));
    return Observable.of({ success: true });
  }

  onEnter = () => {
    this.appName.updateValueAndValidity();
  }

  ngOnInit() {
    this.form = new FormGroup({ appName: this.appName });
    this.validate = this.form.statusChanges
      .map(() => {
        return this.form.valid;
      });
  }

}
