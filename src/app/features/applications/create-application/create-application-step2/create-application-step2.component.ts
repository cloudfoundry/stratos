import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { NewAppCFDetails } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';
import { selectNewAppState } from '../../../../store/effects/create-app-effects';

@Component({
  selector: 'app-create-application-step2',
  templateUrl: './create-application-step2.component.html',
  styleUrls: ['./create-application-step2.component.scss']
})
export class CreateApplicationStep2Component implements OnInit {

  constructor(private store: Store<AppState>, private fb: FormBuilder) {
  }

  nameValid$: Observable<boolean>;

  @ViewChild('form')
  form: NgForm;

  validate: Observable<boolean>;

  checkingName$: Observable<boolean>;

  cfDetails: NewAppCFDetails;

  ngOnInit() {
    this.validate = this.form.statusChanges.mergeMap(() => {
      return Observable.of(this.form.valid);
    }).startWith(this.form.valid);
    this.checkingName$ = this.store.select(selectNewAppState).map(state => state.nameCheck.checking);
  }

}
