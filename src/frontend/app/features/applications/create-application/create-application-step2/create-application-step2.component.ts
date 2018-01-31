import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { SetNewAppName } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';
import { selectNewAppState } from '../../../../store/effects/create-app-effects';
import { AppNameUniqueChecking } from '../../app-name-unique.directive/app-name-unique.directive';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';

@Component({
  selector: 'app-create-application-step2',
  templateUrl: './create-application-step2.component.html',
  styleUrls: ['./create-application-step2.component.scss'],
  providers: [
    {provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher}
  ]
})
export class CreateApplicationStep2Component implements OnInit {

  constructor(private store: Store<AppState>, private fb: FormBuilder) {
  }

  @ViewChild('form')
  form: NgForm;

  validate: Observable<boolean>;

  appNameChecking: AppNameUniqueChecking = new AppNameUniqueChecking();

  name: string;

  onNext = () => {
    this.store.dispatch(new SetNewAppName(this.name));
    return Observable.of({ success: true });
  }

  ngOnInit() {
    this.validate = this.form.statusChanges
      .map(() => {
        return this.form.valid;
      });
  }

}
