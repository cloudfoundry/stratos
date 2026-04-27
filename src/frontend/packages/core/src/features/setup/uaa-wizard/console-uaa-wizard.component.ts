import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  VerifySession,
  SetupConsoleGetScopes,
  SetupSaveConfig,
  AuthState,
  UAASetupState,
  InternalAppState,
} from '@stratosui/store';
import { firstValueFrom, Subscription } from 'rxjs';
import { delay, filter, skipWhile, take } from 'rxjs/operators';

interface UAAWizardForm {
  apiUrl: FormControl<string>;
  clientId: FormControl<string>;
  adminPassword: FormControl<string>;
  adminUsername: FormControl<string>;
  clientSecret: FormControl<string>;
  useSSO: FormControl<boolean>;
  skipSSL: FormControl<boolean>;
}

import { APP_TITLE } from '../../../core/core.types';
import { SignalStepHandle } from '../../../shared/components/stepper/step/step.component';
import { getSSOClientRedirectURI } from '../../endpoints/endpoint-helpers';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ShowPageHeaderComponent } from '../../../shared/components/page-header/show-page-header/show-page-header.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../shared/components/stepper/step/step.component';
import { ProductNameComponent } from '../../../shared/components/product-name.ccomponent';
import { ShowHideButtonComponent } from '../../../core/show-hide-button/show-hide-button.component';
import { LoadingPageComponent } from '../../../shared/components/loading-page/loading-page.component';

@Component({
  selector: 'app-console-uaa-wizard',
  templateUrl: './console-uaa-wizard.component.html',
  styleUrls: ['./console-uaa-wizard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    ShowPageHeaderComponent,
    SteppersComponent,
    StepComponent,
    ProductNameComponent,
    ShowHideButtonComponent,
    LoadingPageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsoleUaaWizardComponent implements OnInit, OnDestroy {
  private store = inject<Store<Pick<InternalAppState, 'uaaSetup' | 'auth'>>>(Store);
  private cdr = inject(ChangeDetectorRef);
  title = inject(APP_TITLE);


  private clientRedirectURI: string;

  constructor() {
    // Client Redirect URI for SSO
    this.clientRedirectURI = getSSOClientRedirectURI();
  }

  uaaForm!: FormGroup<UAAWizardForm>;
  uaaScopes: string[] = [];
  selectedScope = '';
  applyingSetup = signal<boolean>(false);

  // Tracks UAA form validity for the first step's signal handle. Updated
  // from the form's valueChanges subscription in ngOnInit so the step's
  // Next button gates on form validity in the same way the legacy
  // `validateUAAForm` Observable did.
  private uaaFormValid = signal<boolean>(false);
  private formSub?: Subscription;

  public show = false;
  public showPassword = false;

  // FWT-959 Part 2 (Partition A) — SignalStepHandle wiring.
  //
  // Two-step UAA setup. Step 1 collects credentials and dispatches
  // SetupConsoleGetScopes; step 2 picks an admin scope and dispatches
  // SetupSaveConfig then hard-reloads on success. Cross-step state
  // (`uaaScopes`, `selectedScope`) lives on this parent and is read
  // directly by step 2's template, so we don't need to plumb it through
  // signals — the previous and migrated paths share the same fields.

  uaaFormStepHandle: SignalStepHandle = {
    valid: this.uaaFormValid.asReadonly(),
    submit: async () => {
      this.store.dispatch(new SetupConsoleGetScopes({
        uaa_endpoint: this.uaaForm.get('apiUrl').value,
        console_client: this.uaaForm.get('clientId').value,
        password: this.uaaForm.get('adminPassword').value,
        skip_ssl_validation: this.uaaForm.get('skipSSL').value,
        username: this.uaaForm.get('adminUsername').value,
        console_client_secret: this.uaaForm.get('clientSecret').value,
        use_sso: this.uaaForm.get('useSSO').value,
        console_admin_scope: ''
      }));
      const state = await firstValueFrom(
        this.store.select('uaaSetup').pipe(
          skipWhile((s: UAASetupState) => s.settingUp),
          take(1),
        )
      );
      if (state.error) {
        throw new Error(state.message || 'Failed to fetch UAA scopes');
      }
      this.uaaScopes = state.payload.scope;
      if (this.uaaScopes.find(scope => scope === 'stratos.admin')) {
        this.selectedScope = 'stratos.admin';
      } else if (this.uaaScopes.find(scope => scope === 'cloud_controller.admin')) {
        this.selectedScope = 'cloud_controller.admin';
      }
      // OnPush: uaaScopes / selectedScope are plain fields read by step 2's
      // template. The setter assignments above don't trigger CD on their
      // own, so step 2 may render with an empty scope dropdown until
      // something else marks the view dirty. Force a tick.
      this.cdr.markForCheck();
    },
  };

  uaaScopeStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    submit: async () => {
      this.store.dispatch(new SetupSaveConfig({
        uaa_endpoint: this.uaaForm.get('apiUrl').value,
        console_client: this.uaaForm.get('clientId').value,
        password: this.uaaForm.get('adminPassword').value,
        skip_ssl_validation: this.uaaForm.get('skipSSL').value,
        username: this.uaaForm.get('adminUsername').value,
        console_client_secret: this.uaaForm.get('clientSecret').value,
        use_sso: this.uaaForm.get('useSSO').value,
        console_admin_scope: this.selectedScope
      }));

      this.applyingSetup.set(true);
      const state = await firstValueFrom(
        this.store.select(s => [s.uaaSetup, s.auth] as [UAASetupState, AuthState]).pipe(
          filter(([uaa, auth]) => !(uaa.settingUp || auth.verifying)),
          delay(2000),
          take(10),
          filter(([_uaa, auth]) => {
            const validUAASessionData = auth.sessionData && !auth.sessionData.uaaError;
            if (!validUAASessionData) {
              this.store.dispatch(new VerifySession());
            }
            return validUAASessionData;
          }),
          take(1),
        )
      );
      const [uaa] = state;
      if (uaa.error) {
        this.applyingSetup.set(false);
        throw new Error(uaa.message || 'Failed to save UAA configuration');
      }
      // Hard reload of the app on success — preserves the legacy behaviour.
      const loc = window.location;
      const reload = loc.protocol + '//' + loc.host;
      window.location.assign(reload);
    },
  };

  ngOnInit() {
    this.uaaForm = new FormGroup<UAAWizardForm>({
      apiUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      skipSSL: new FormControl(false, { nonNullable: true }),
      clientId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      clientSecret: new FormControl('', { nonNullable: true }),
      adminUsername: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      adminPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      useSSO: new FormControl(false, { nonNullable: true }),
    });

    // Mirror form validity into a signal the step handle reads. Initial
    // value is `false` (matches the legacy Observable's first emission).
    this.uaaFormValid.set(this.uaaForm.valid);
    this.formSub = this.uaaForm.valueChanges.subscribe(() => {
      this.uaaFormValid.set(this.uaaForm.valid);
    });
  }

  ngOnDestroy() {
    this.formSub?.unsubscribe();
  }

}
