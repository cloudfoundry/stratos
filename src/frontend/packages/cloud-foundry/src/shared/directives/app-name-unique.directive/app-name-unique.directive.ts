import { HttpClient, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Directive, forwardRef, Input, OnInit, inject } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS } from '@angular/forms';
import { Observable, of as observableOf, timer as observableTimer } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';

import { environment } from '@stratosui/core';
import { StratosStatus } from '@stratosui/store';
import { CreateAppStateService } from '../../data-services/create-app-state.service';

const APP_UNIQUE_NAME_PROVIDER = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => AppNameUniqueDirective), multi: true
};

// See: https://medium.com/@kahlil/asynchronous-validation-with-angular-reactive-forms-1a392971c062

const { proxyAPIVersion } = environment;
export type NameTaken<T = any> = (response: HttpResponse<T>) => boolean;
export type UniqueValidatorRequestBuilder<T = any> = (name: string) => HttpRequest<T>;
export class AppNameUniqueChecking {
  busy!: boolean;
  taken: boolean | undefined;
  // Consumed by <app-stateful-icon [state]> so it carries StratosStatus
  // values (NONE renders nothing, OK renders the 'done' icon).
  status: StratosStatus = StratosStatus.NONE;

  set(busy: boolean, taken?: boolean) {
    this.busy = busy;
    this.taken = taken;

    if (this.busy) {
      this.status = StratosStatus.BUSY;
    } else if (this.taken === undefined) {
      this.status = StratosStatus.NONE;
    } else {
      this.status = this.taken ? StratosStatus.ERROR : StratosStatus.OK;
    }
  }
}

@Directive({
selector: '[appApplicationNameUnique][formControlName],[appApplicationNameUnique][formControl],[appApplicationNameUnique][ngModel]',
  providers: [APP_UNIQUE_NAME_PROVIDER],
standalone: true
})
export class AppNameUniqueDirective implements AsyncValidator, OnInit {
  private createAppState = inject(CreateAppStateService);
  private http = inject(HttpClient);


  @Input() appApplicationNameUnique!: AppNameUniqueChecking;
  @Input() appApplicationNameUniqueRequest!: UniqueValidatorRequestBuilder;
  @Input() appApplicationNameUniqueValidator: NameTaken = (res: HttpResponse<any>) => res.body.totalResults > 0;

  constructor() {
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

  public validate(control: AbstractControl): Observable<{ appNameTaken: boolean, } | null> {
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
      catchError(() => {
        // Fail open: CC enforces name uniqueness at create time, so a
        // failed convenience check must not wedge the form (an erroring
        // async validator leaves the control PENDING forever).
        this.appApplicationNameUnique.set(false);
        return observableOf(null);
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
      .set('return', 'counts')
      .set('names', name)
      .set('space_guids', spaceGuid);
    return new HttpRequest(
      'GET',
      `/pp/${proxyAPIVersion}/cf/apps/${cfGuid}`,
      { params },
    );
  }

  private getDefaultRequestData(name: string) {
    return this.createAppState.cloudFoundryDetails$.pipe(
      take(1),
      switchMap(
        cloudFoundryDetails => {
          const cfGuid = cloudFoundryDetails!.cloudFoundry;
          const spaceGuid = cloudFoundryDetails!.space;
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
