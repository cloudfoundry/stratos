import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, Validator } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { IsNewAppNameFree } from '../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../store/app-state';
import { selectNewAppState } from '../../../store/effects/create-app-effects';

/* tslint:disable:no-use-before-declare  */
const APP_UNIQUE_NAME_PROVIDER = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => AppNameUniqueDirective), multi: true
};
/* tslint:enable */

@Directive({
  selector: '[appApplicationNameUnique][formControlName],[appApplicationNameUnique][formControl],[appApplicationNameUnique][ngModel]',
  providers: [APP_UNIQUE_NAME_PROVIDER]
})
export class AppNameUniqueDirective implements Validator {

  constructor(private store: Store<AppState>) { }

  public validate(c: AbstractControl): Observable<{ appNameTaken: boolean } | null> {
    if (c.value) {
      return this.store.select(selectNewAppState)
        .debounceTime(250)
        .do(createAppState => {
          if (createAppState.nameCheck.name !== c.value) {
            this.store.dispatch(new IsNewAppNameFree(c.value));
          }
        })
        .filter(createAppState => {
          return !createAppState.nameCheck.checking &&
            createAppState.nameCheck.name === c.value;
        })
        .map(createAppState => {
          return createAppState.nameCheck.available ? null : {
            appNameTaken: !createAppState.nameCheck.available
          };
        }).first();
    } else {
      return Observable.of(null).first();
    }
  }
}
