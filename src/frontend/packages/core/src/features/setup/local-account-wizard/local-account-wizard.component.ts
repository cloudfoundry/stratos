import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject, Injector, runInInjectionContext, ChangeDetectionStrategy } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormControl, FormGroup } from '@angular/forms';
import {
  AuthState,
  InternalAppState,
  LocalAdminSetupData,
  SetupSaveConfig,
  Store,
  UAASetupState,
  VerifySession,
} from '@stratosui/store';
import { combineLatest, Observable, firstValueFrom } from 'rxjs';
import { delay, filter, map, take } from 'rxjs/operators';

import { APP_TITLE } from '../../../core/core.types';
import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { UaaSetupSignalService } from '../../../core/signals/uaa-setup-signal.service';
import { SignalStepHandle } from '../../../shared/components/stepper/step/step.component';
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
  private injector = inject(Injector);
  private authSignals = inject(AuthSignalService);
  private uaaSetupSignals = inject(UaaSetupSignalService);
  public title = inject(APP_TITLE);

  // Bridge signals → observables in injection context for use in `next` handler.
  private uaaSetup$ = toObservable(this.uaaSetupSignals.uaaSetup);
  private auth$ = toObservable(this.authSignals.auth);

  passwordForm!: FormGroup;
  validateLocalAuthForm!: Observable<boolean>;
  applyingSetup = signal<boolean>(false);
  signalHandle!: SignalStepHandle;

  showPassword: boolean[] = [];

  ngOnInit() {
    this.passwordForm = new FormGroup<LocalAccountForm>({
      adminPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      adminPasswordConfirm: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    }, { validators: this.passwordMatchValidator() });

    this.validateLocalAuthForm = this.passwordForm.statusChanges.pipe(
      map(() => this.passwordForm.valid)
    );

    // toSignal requires an injection context; ngOnInit runs outside one,
    // so wrap with runInInjectionContext using the injected Injector.
    const validSignal = runInInjectionContext(this.injector, () =>
      toSignal(this.validateLocalAuthForm, { initialValue: this.passwordForm.valid })
    );
    this.signalHandle = {
      valid: validSignal,
      submit: async () => {
        const result = await firstValueFrom(this.next() as Observable<{ success: boolean; message?: string }>);
        if (!result.success) {
          throw new Error(result.message || 'Failed to apply local account setup');
        }
        // Success path triggers a hard window reload inside `next()`; no
        // router navigation needed here.
      },
    };
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

  next = () => {
    const data: LocalAdminSetupData = {
      local_admin_password: this.passwordForm.get('adminPassword').value,
    };

    this.applyingSetup.set(true);
    this.store.dispatch(new SetupSaveConfig(data));
    return combineLatest([this.uaaSetup$, this.auth$]).pipe(
      filter(([uaa, auth]: [UAASetupState, AuthState | undefined]) => {
        return !!auth && !(uaa.settingUp || auth.verifying);
      }),
      delay(2000),
      take(10),
      filter(([_uaa, auth]: [UAASetupState, AuthState | undefined]) => {
        const validUAASessionData = !!auth?.sessionData && !auth.sessionData.uaaError;
        if (!validUAASessionData) {
          this.store.dispatch(new VerifySession());
        }
        return validUAASessionData;
      }),
      map(([uaa]: [UAASetupState, AuthState | undefined]) => {
        if (!uaa.error) {
          // Do a hard reload of the app
          const loc = window.location;
          const reload = loc.protocol + '//' + loc.host;
          window.location.assign(reload);
        } else {
          this.applyingSetup.set(false);
        }
        return {
          success: !uaa.error,
          message: uaa.message
        };
      }));
  };

}
