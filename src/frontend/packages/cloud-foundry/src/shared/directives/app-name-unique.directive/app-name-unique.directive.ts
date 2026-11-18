import { HttpClient, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Directive, forwardRef, input, OnInit, inject } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { defer, Observable, of as observableOf, timer as observableTimer } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

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

  readonly appApplicationNameUnique = input<AppNameUniqueChecking>();
  readonly appApplicationNameUniqueRequest = input<UniqueValidatorRequestBuilder>();
  readonly appApplicationNameUniqueValidator = input<NameTaken>((res: HttpResponse<any>) => res.body.totalResults > 0);
  // Text app-form-field shows for a taken name. Without it the error is
  // { appNameTaken: true } and the field shows its stock "Invalid value".
  readonly appApplicationNameUniqueMessage = input<string>();

  // The state this validator reports to: the bound one, or the directive's
  // own when none is bound (a directive built in code, as the edit
  // application form does).
  private readonly ownChecking = new AppNameUniqueChecking();
  get checking(): AppNameUniqueChecking {
    return this.appApplicationNameUnique() || this.ownChecking;
  }

  ngOnInit() {
    this.checking.set(false);
  }

  public validate(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.dirty) {
      return observableOf(null);
    }
    this.checking.set(true);
    return observableTimer(500).pipe(
      switchMap(() => this.getCheck(control.value)),
      map(appNameTaken => {
        this.checking.set(false, appNameTaken);
        if (!appNameTaken) {
          return null;
        }
        const message = this.appApplicationNameUniqueMessage();
        return { appNameTaken: message ? { message } : true };
      }),
      catchError(() => {
        // Fail open: CC enforces name uniqueness at create time, so a
        // failed convenience check must not wedge the form (an erroring
        // async validator leaves the control PENDING forever).
        this.checking.set(false);
        return observableOf(null);
      }));
  }

  private getCheck(name: string): Observable<boolean> {
    const buildRequest = this.appApplicationNameUniqueRequest();
    if (buildRequest) {
      return this.nameTaken(
        buildRequest(name),
        this.appApplicationNameUniqueValidator()
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
    // defer: read the selection when the check runs, and keep a missing
    // selection an error of the returned stream
    return defer(() => {
      const cloudFoundryDetails = this.createAppState.cloudFoundryDetails();
      const cfGuid = cloudFoundryDetails!.cloudFoundry;
      const spaceGuid = cloudFoundryDetails!.space;
      const request = this.getDefaultRequest(cfGuid, spaceGuid, name);
      return this.nameTaken(
        request,
        this.appApplicationNameUniqueValidator()
      );
    });
  }

  private nameTaken(requestData: HttpRequest<any>, taken: NameTaken) {
    return this.http.request(requestData).pipe(
      filter((event) => event instanceof HttpResponse),
      map(taken)
    );
  }
}
