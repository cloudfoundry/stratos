import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  InternalAppState,
  UAASetupState,
  LocalAdminSetupData,
  AuthState,
  VerifySession,
  SetupSaveConfig,
} from '@stratosui/store';
import { Observable } from 'rxjs';
import { delay, filter, map, take, tap } from 'rxjs/operators';

import { APP_TITLE } from '../../../core/core.types';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ShowPageHeaderComponent } from '../../../shared/components/page-header/show-page-header/show-page-header.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../shared/components/stepper/step/step.component';
import { LoadingPageComponent } from '../../../shared/components/loading-page/loading-page.component';
import { ProductNameComponent } from '../../../shared/components/product-name.ccomponent';
import { ShowHideButtonComponent } from '../../../core/show-hide-button/show-hide-button.component';

// Typed form interface for local account password form
interface LocalAccountForm {
  adminPassword: FormControl<string>;
  adminPasswordConfirm: FormControl<string>;
}

@Component({
selector: 'app-local-account-wizard',
  templateUrl: './local-account-wizard.component.html',
  styleUrls: ['./local-account-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    ShowPageHeaderComponent,
    SteppersComponent,
    StepComponent,
    LoadingPageComponent,
    ProductNameComponent,
    ShowHideButtonComponent
  ]
})
export class LocalAccountWizardComponent implements OnInit {

  private store = inject(Store<Pick<InternalAppState, 'uaaSetup' | 'auth'>>);
  public title = inject(APP_TITLE);

  passwordForm: FormGroup;
  validateLocalAuthForm: Observable<boolean>;
  applyingSetup = signal<boolean>(false);

  showPassword: boolean[] = [];

  ngOnInit() {
    this.passwordForm = new FormGroup<LocalAccountForm>({
      adminPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      adminPasswordConfirm: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    }, { validators: this.passwordMatchValidator() });

    this.validateLocalAuthForm = this.passwordForm.statusChanges.pipe(
      map(() => this.passwordForm.valid)
    );
  }

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const password = control.get('adminPassword');
      const confirmPassword = control.get('adminPasswordConfirm');

      if (!password || !confirmPassword) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        return { passwordMismatch: true };
      }

      return null;
    };
  }

  next: StepOnNextFunction = () => {
    const data: LocalAdminSetupData = {
      local_admin_password: this.passwordForm.get('adminPassword').value,
    };

    this.applyingSetup.set(true);
    this.store.dispatch(new SetupSaveConfig(data));
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
          this.applyingSetup.set(false);
        }
        return {
          success: !state[0].error,
          message: state[0].message
        };
      }));
  };

}
