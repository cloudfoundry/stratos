import { HttpClient, HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Directive, forwardRef, Input, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, throwError as observableThrowError, timer as observableTimer } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';

import { CFAppState } from '../../../cf-app-state';
import { environment } from './../../../../../core/src/environments/environment.prod';
import { selectNewAppState } from './../../../store/effects/create-app-effects';

/* tslint:disable:no-use-before-declare  */
const APP_UNIQUE_NAME_PROVIDER = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => AppNameUniqueDirective), multi: true
};
/* tslint:enable */

// See: https://medium.com/@kahlil/asynchronous-validation-with-angular-reactive-forms-1a392971c062

const { proxyAPIVersion, cfAPIVersion } = environment;
export type NameTaken<T = any> = (response: HttpResponse<T>) => boolean;
export type UniqueValidatorRequestBuilder<T = any> = (name: string) => HttpRequest<T>;
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
  @Input() appApplicationNameUniqueRequest: UniqueValidatorRequestBuilder;
  @Input() appApplicationNameUniqueValidator: NameTaken = (res: HttpResponse<any>) => res.body.total_results > 0;

  constructor(
    private store: Store<CFAppState>,
    private http: HttpClient,
  ) {
    if (!this.appApplicationNameUnique) {
      this.appApplicationNameUnique = new AppNameUniqueChecking();
    }
  }

  ngOnInit() {
    if (!this.appApplicationNameUnique) {
      this.appApplicationNameUnique = new AppNameUniqueChecking();
    }
    this.appApplicationNameUnique.set(false);
  }

  public validate(control: AbstractControl): Observable<{ appNameTaken: boolean } | null> {
    if (!control.dirty) {
      return observableOf(null);
    }
    this.appApplicationNameUnique.set(true);
    return observableTimer(500).pipe(
      switchMap(() => this.getCheck(control.value)),
      map(appNameTaken => {
        this.appApplicationNameUnique.set(false, appNameTaken);
        return appNameTaken ? { appNameTaken } : null;
      }),
      catchError(err => {
        this.appApplicationNameUnique.set(false);
        return observableThrowError(err);
      }));
  }

  private getCheck(name: string): Observable<boolean> {
    if (this.appApplicationNameUniqueRequest) {
      return this.nameTaken(
        this.appApplicationNameUniqueRequest(name),
        this.appApplicationNameUniqueValidator
      );
    }
    return this.getDefaultRequestData(name);
  }

  private getDefaultRequest(cfGuid: string, spaceGuid: string, name: string) {
    const params = new HttpParams()
      .set('q', 'name:' + name)
      .append('q', 'space_guid:' + spaceGuid);
    const headers = new HttpHeaders({
      'x-cap-cnsi-list': cfGuid,
      'x-cap-passthrough': 'true'
    });
    return new HttpRequest(
      'GET',
      `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/apps`,
      {
        headers,
        params
      },
    );
  }

  private getDefaultRequestData(name: string) {
    return this.store.select(selectNewAppState).pipe(
      take(1),
      switchMap(
        newAppState => {
          const cfGuid = newAppState.cloudFoundryDetails.cloudFoundry;
          const spaceGuid = newAppState.cloudFoundryDetails.space;
          const request = this.getDefaultRequest(cfGuid, spaceGuid, name);
          return this.nameTaken(
            request,
            this.appApplicationNameUniqueValidator
          );
        }
      )
    );
  }

  private nameTaken(requestData: HttpRequest<any>, taken: NameTaken) {
    return this.http.request(requestData).pipe(
      filter((event) => event instanceof HttpResponse),
      map(taken)
    );
  }
}
