import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  VerifySession,
  SetupConsoleGetScopes,
  SetupSaveConfig,
  AuthState,
  UAASetupState,
  InternalAppState,
} from '@stratosui/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { delay, filter, map, skipWhile, take } from 'rxjs/operators';

import { APP_TITLE } from '../../../core/core.types';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { getSSOClientRedirectURI } from '../../endpoints/endpoint-helpers';

@Component({
  selector: 'app-console-uaa-wizard',
  templateUrl: './console-uaa-wizard.component.html',
  styleUrls: ['./console-uaa-wizard.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConsoleUaaWizardComponent implements OnInit {

  private clientRedirectURI: string;

  constructor(
    private store: Store<Pick<InternalAppState, 'uaaSetup' | 'auth'>>, @Inject(APP_TITLE) public title: string) {
    // Client Redirect URI for SSO
    this.clientRedirectURI = getSSOClientRedirectURI();
  }

  uaaForm: FormGroup;
  validateUAAForm: Observable<boolean>;
  uaaScopes = [];
  selectedScope = '';
  applyingSetup$ = new BehaviorSubject<boolean>(false);

  public show = false;
  public showPassword = false;

  uaaFormNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetupConsoleGetScopes({
      uaa_endpoint: this.uaaForm.get('apiUrl').value,
      console_client: this.uaaForm.get('clientId').value,
      password: this.uaaForm.get('adminPassword').value,
      skip_ssl_validation: this.uaaForm.get('skipSll').value,
      username: this.uaaForm.get('adminUsername').value,
      console_client_secret: this.uaaForm.get('clientSecret').value,
      use_sso: this.uaaForm.get('useSSO').value,
      console_admin_scope: ''
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
      }));
  }

  uaaScopeNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetupSaveConfig({
      uaa_endpoint: this.uaaForm.get('apiUrl').value,
      console_client: this.uaaForm.get('clientId').value,
      password: this.uaaForm.get('adminPassword').value,
      skip_ssl_validation: this.uaaForm.get('skipSll').value,
      username: this.uaaForm.get('adminUsername').value,
      console_client_secret: this.uaaForm.get('clientSecret').value,
      use_sso: this.uaaForm.get('useSSO').value,
      console_admin_scope: this.selectedScope
    }));

    this.applyingSetup$.next(true);
    return this.store.select(s => [s.uaaSetup, s.auth]).pipe(
      filter(([uaa, auth]: [UAASetupState, AuthState]) => {
        return !(uaa.settingUp || auth.verifying);
      }),
      delay(2000),
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
      }));
  }
  ngOnInit() {
    this.uaaForm = new FormGroup({
      apiUrl: new FormControl('', [Validators.required as any]),
      skipSll: new FormControl(false),
      clientId: new FormControl('', [Validators.required as any]),
      clientSecret: new FormControl(''),
      adminUsername: new FormControl('', [Validators.required as any]),
      adminPassword: new FormControl('', [Validators.required as any]),
      useSSO: new FormControl(false),
    });

    let observer;
    this.validateUAAForm = new Observable(o => {
      observer = o;
      observer.next(false);
    });

    this.uaaForm.valueChanges.subscribe(() => {
      observer.next(this.uaaForm.valid);
    });

  }

}
