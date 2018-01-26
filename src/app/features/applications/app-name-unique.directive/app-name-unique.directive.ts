import { Directive, forwardRef, Input, OnInit } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, Validator, AsyncValidatorFn, AsyncValidator } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { IsNewAppNameFree } from '../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../store/app-state';
import { selectNewAppState } from '../../../store/effects/create-app-effects';
import { Headers, Http, Request, RequestOptions, QueryEncoder, URLSearchParams } from '@angular/http';
import { ApplicationService } from '../application.service';
import { selectEntity } from '../../../store/selectors/api.selectors';

/* tslint:disable:no-use-before-declare  */
const APP_UNIQUE_NAME_PROVIDER = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => AppNameUniqueDirective), multi: true
};
/* tslint:enable */

// See: https://medium.com/@kahlil/asynchronous-validation-with-angular-reactive-forms-1a392971c062

export class AppNameUniqueChecking {
  busy: boolean;
  taken: boolean;
  status: string;

  set(busy : boolean, taken? : boolean) {
    this.busy = busy;
    this.taken = taken;

    if (this.busy) {
      this.status = 'busy';
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

  @Input('appApplicationNameUnique') appApplicationNameUnique: AppNameUniqueChecking;

  constructor(
    private store: Store<AppState>,
    private http: Http,
  ) {
    if (!this.appApplicationNameUnique) {
      this.appApplicationNameUnique = new AppNameUniqueChecking();
    }
  }

  ngOnInit(): void {
    this.appApplicationNameUnique.set(false, false);
  }

  public validate(control: AbstractControl): Observable<{ appNameTaken: boolean } | null> {
    if (!control.dirty) {
      return Observable.of(null);
    }
    this.appApplicationNameUnique.set(true);
    return Observable.timer(500).take(1)
    //.combineLatest(this.store.select(selectNewAppState)this.store.select(selectEntity('application', appGuid)).take(1))
    .combineLatest(this.store.select(selectNewAppState).take(1))
    .switchMap((v) =>
    {
      const cfGuid = v[1].cloudFoundryDetails.cloudFoundry;
      const spaceGuid = v[1].cloudFoundryDetails.space;
      const currentName = v[1].name;
      return this.checkAppName(cfGuid, spaceGuid, currentName, control.value);
      //return Observable.of(null);
    })
    .map(v => {
      this.appApplicationNameUnique.set(false, !v);
      return v ? null : {appNameTaken: true};
    });
  }

  private checkAppName(cfGuid, spaceGuid, currentName, name): Observable<any> {
    if (name === currentName || name.length === 0) {
      return Observable.of(true);
    }
    const options = new RequestOptions();
    options.url = '/pp/v1/proxy/v2/apps';
    options.params = new URLSearchParams('');
    options.params.set('q', 'name:' + name);
    options.params.append('q', 'space_guid:' + spaceGuid);
    options.method = 'get';
    options.headers = new Headers();
    options.headers.set('x-cap-cnsi-list', cfGuid);
    options.headers.set('x-cap-passthrough', 'true');
    return this.http.request(new Request(options)).map(response => {
      let resData;
      try {
        resData = response.json();
      } catch (e) {
        resData = {};
      }
      return resData.total_results === 0;
    });
  }
}
