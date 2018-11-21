import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { delay, filter, map, skipWhile, take } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { VerifySession } from '../../../store/actions/auth.actions';
import { SetUAAScope, SetupUAA } from '../../../store/actions/setup.actions';
import { AppState } from '../../../store/app-state';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { UAASetupState } from '../../../store/types/uaa-setup.types';

@Component({
  selector: 'app-console-uaa-wizard',
  templateUrl: './console-uaa-wizard.component.html',
  styleUrls: ['./console-uaa-wizard.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConsoleUaaWizardComponent implements OnInit {

  private clientRedirectURI: string;

  constructor(private store: Store<AppState>, private router: Router) {
    // Client Redirect URI for SSO
    this.clientRedirectURI = window.location.protocol + '//' + window.location.hostname +
    (window.location.port ? ':' + window.location.port : '') + '/pp/v1/auth/sso_login_callback';
  }

  uaaForm: FormGroup;
  validateUAAForm: Observable<boolean>;
  uaaScopes = [];
  selectedScope = '';
  applyingSetup$ = new BehaviorSubject<boolean>(false);

  uaaFormNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetupUAA({
      uaa_endpoint: this.uaaForm.get('apiUrl').value,
      console_client: this.uaaForm.get('clientId').value,
      password: this.uaaForm.get('adminPassword').value,
      skip_ssl_validation: this.uaaForm.get('skipSll').value,
      username: this.uaaForm.get('adminUsername').value,
      console_client_secret: this.uaaForm.get('clientSecret').value,
      use_sso: this.uaaForm.get('useSSO').value,
    }));
    return this.store.select('uaaSetup').pipe(
      skipWhile((state: UAASetupState) => {
        return state.settingUp;
      }),
      map((state: UAASetupState) => {
        const success = !state.error;
        if (success) {
          this.uaaScopes = state.payload.scope;
          if (this.uaaScopes.find(scope => scope === 'stratos.admin')) {
            this.selectedScope = 'stratos.admin';
          } else if (this.uaaScopes.find(scope => scope === 'cloud_controller.admin')) {
            this.selectedScope = 'cloud_controller.admin';
          }
        }
        return {
          success,
          message: state.message
        };
      }), );
  }

  uaaScopeNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetUAAScope(this.selectedScope));
    this.applyingSetup$.next(true);
    return this.store.select(s => [s.uaaSetup, s.auth]).pipe(
      filter(([uaa, auth]: [UAASetupState, AuthState]) => {
        return !(uaa.settingUp || auth.verifying);
      }),
      delay(3000),
      take(10),
      filter(([uaa, auth]: [UAASetupState, AuthState]) => {
        const validUAASessionData = auth.sessionData && !auth.sessionData.uaaError;
        if (!validUAASessionData) {
          this.store.dispatch(new VerifySession());
        }
        return validUAASessionData;
      }),
      map((state: [UAASetupState, AuthState]) => {
        if (!state[0].error) {
          // Do a hard reload of the app
          const loc = window.location;
          const reload = loc.protocol + '//' + loc.host;
          window.location.assign(reload);
        } else {
          this.applyingSetup$.next(false);
        }
        return {
          success: !state[0].error,
          message: state[0].message
        };
      }), );
  }
  ngOnInit() {
    this.uaaForm = new FormGroup({
      apiUrl: new FormControl('', [<any>Validators.required]),
      skipSll: new FormControl(false),
      clientId: new FormControl('', [<any>Validators.required]),
      clientSecret: new FormControl(''),
      adminUsername: new FormControl('', [<any>Validators.required]),
      adminPassword: new FormControl('', [<any>Validators.required]),
      useSSO: new FormControl(false),
    });

    let observer;
    this.validateUAAForm = Observable.create((_observer) => {
      observer = _observer;
      observer.next(false);
    });

    this.uaaForm.valueChanges.subscribe(() => {
      observer.next(this.uaaForm.valid);
    });

  }

}
