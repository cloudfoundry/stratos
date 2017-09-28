import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, Validator } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { IsNewAppNameFree } from '../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../store/app-state';
import { selectNewAppState } from '../../../store/effects/create-app-effects';

const APP_UNIQUE_NAME_PROVIDER = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => AppNameUniqueDirective), multi: true
};

@Directive({
  selector: '[appApplicationNameUnique][formControlName],[appApplicationNameUnique][formControl],[appApplicationNameUnique][ngModel]',
  providers: [APP_UNIQUE_NAME_PROVIDER]
})
export class AppNameUniqueDirective implements Validator {

  constructor(private store: Store<AppState>) { }

  public validate(c: AbstractControl): Observable<boolean | null> {
    console.log('here');
    if (c.value) {
      return this.store.select(selectNewAppState)
        .debounceTime(250)
        .mergeMap(createAppState => {
          if (createAppState.nameCheck.name !== c.value) {
            this.store.dispatch(new IsNewAppNameFree(c.value));
          }
          return Observable.of(createAppState);
        })
        .filter(createAppState => {
          return !createAppState.nameCheck.checking &&
            createAppState.nameCheck.name === c.value;
        })
        .mergeMap(createAppState => {
          return Observable.of(createAppState.nameCheck.available);
        }).first();
    } else {
      return Observable.of(false);
    }
  }
}
