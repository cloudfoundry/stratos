
import { throwError as observableThrowError, timer as observableTimer, of as observableOf, Observable } from 'rxjs';

import { take, combineLatest, switchMap, map, catchError } from 'rxjs/operators';
import { Directive, forwardRef, Input, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS } from '@angular/forms';
import { Headers, Http, Request, RequestOptions, URLSearchParams } from '@angular/http';
import { Store } from '@ngrx/store';

import { environment } from '../../../../environments/environment';
import { AppState } from '../../../store/app-state';
import { selectNewAppState } from '../../../store/effects/create-app-effects';

/* tslint:disable:no-use-before-declare  */
const APP_UNIQUE_NAME_PROVIDER = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => AppNameUniqueDirective), multi: true
};
/* tslint:enable */

// See: https://medium.com/@kahlil/asynchronous-validation-with-angular-reactive-forms-1a392971c062

const { proxyAPIVersion, cfAPIVersion } = environment;

export class AppNameUniqueChecking {
  busy: boolean;
  taken: boolean;
  status: string;

  set(busy: boolean, taken?: boolean) {
    this.busy = busy;
    this.taken = taken;

    if (this.busy) {
      this.status = 'busy';
    } else if (this.taken === undefined) {
      this.status = '';
    } else {
      this.status = this.taken ? 'error' : 'done';
    }
  }
}

@Directive({
  selector: '[appApplicationNameUnique][formControlName],[appApplicationNameUnique][formControl],[appApplicationNameUnique][ngModel]',
  providers: [APP_UNIQUE_NAME_PROVIDER]
})
export class AppNameUniqueDirective implements AsyncValidator, OnInit {

  @Input() appApplicationNameUnique: AppNameUniqueChecking;

  constructor(
    private store: Store<AppState>,
    private http: Http,
  ) {
    if (!this.appApplicationNameUnique) {
      this.appApplicationNameUnique = new AppNameUniqueChecking();
    }
  }

  ngOnInit(): void {
    this.appApplicationNameUnique.set(false);
  }

  public validate(control: AbstractControl): Observable<{ appNameTaken: boolean } | null> {
    if (!control.dirty) {
      return observableOf(null);
    }
    this.appApplicationNameUnique.set(true);
    return observableTimer(500).pipe(take(1),
      combineLatest(this.store.select(selectNewAppState).pipe(take(1))),
      switchMap(newAppState => {
        const cfGuid = newAppState[1].cloudFoundryDetails.cloudFoundry;
        const spaceGuid = newAppState[1].cloudFoundryDetails.space;
        const currentName = newAppState[1].name;
        return this.appNameTaken(cfGuid, spaceGuid, currentName, control.value);
      }),
      map(appNameTaken => {
        this.appApplicationNameUnique.set(false, appNameTaken);
        return appNameTaken ? { appNameTaken } : null;
      }),
      catchError(err => {
        this.appApplicationNameUnique.set(false);
        return observableThrowError(err);
      }), );
  }

  private appNameTaken(cfGuid, spaceGuid, currentName, name): Observable<any> {
    if (name.length === 0) {
      return observableOf(undefined);
    }
    const options = new RequestOptions();
    options.url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/apps`;
    options.params = new URLSearchParams('');
    options.params.set('q', 'name:' + name);
    options.params.append('q', 'space_guid:' + spaceGuid);
    options.method = 'get';
    options.headers = new Headers();
    options.headers.set('x-cap-cnsi-list', cfGuid);
    options.headers.set('x-cap-passthrough', 'true');
    return this.http.request(new Request(options)).pipe(
      map(response => {
        let resData;
        try {
          resData = response.json();
        } catch (e) {
          resData = {};
        }
        return resData.total_results > 0;
      }));
  }
}
