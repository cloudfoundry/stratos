import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthDataService } from '@stratosui/store';
import { Subscription } from 'rxjs';

import { UaaSetupData, UaaSetupDataService } from '../../../core/uaa-setup-data.service';
import { SETUP_NOT_CONFIRMED_MESSAGE, waitForSetupConfirmed } from '../setup-confirmation';

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

// Pre-selected, in order, when the admin user's token carries them.
const PREFERRED_ADMIN_SCOPES = ['stratos.admin', 'cloud_controller.admin'];

@Component({
  selector: 'app-console-uaa-wizard',
  templateUrl: './console-uaa-wizard.component.html',
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
  private authData = inject(AuthDataService);
  private uaaSetupData = inject(UaaSetupDataService);
  title = inject(APP_TITLE);

  protected clientRedirectURI: string;

  constructor() {
    // Client Redirect URI for SSO
    this.clientRedirectURI = getSSOClientRedirectURI();
  }

  uaaForm!: FormGroup<UAAWizardForm>;
  uaaScopes = signal<string[]>([]);
  selectedScope = signal('');
  applyingSetup = signal<boolean>(false);
  // app-loading-page takes an Observable<boolean> — bridge the signal.
  applyingSetup$ = toObservable(this.applyingSetup);

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
  // Two-step UAA setup. Step 1 collects credentials and fetches the admin
  // user's scopes; step 2 picks an admin scope, saves the config, waits for
  // the backend to leave setup mode, then hard-reloads. Cross-step state
  // (`uaaScopes`, `selectedScope`) lives on this parent as signals so step
  // 2's OnPush template re-renders when step 1 sets them after an await.

  uaaFormStepHandle: SignalStepHandle = {
    valid: this.uaaFormValid.asReadonly(),
    submit: async () => {
      this.uaaScopes.set([]);
      this.selectedScope.set('');
      // Await this request and read the state it left behind. A replayed
      // stream still holds the previous request's state at this point.
      await this.uaaSetupData.checkScopes(this.setupData(''));
      const state = this.uaaSetupData.state();
      if (state.error) {
        throw new Error(state.message || 'Failed to fetch UAA scopes');
      }
      const scopes = state.payload?.scope ?? [];
      if (!scopes.length) {
        throw new Error('The UAA returned no scopes for the admin user, so there is no admin scope to choose. Check the admin username and password.');
      }
      this.uaaScopes.set(scopes);
      const preferred = PREFERRED_ADMIN_SCOPES.find(scope => scopes.includes(scope));
      if (preferred) {
        this.selectedScope.set(preferred);
      }
    },
  };

  // The backend stays in setup mode until an admin scope is saved, so
  // Finish is only enabled once one of the returned scopes is chosen.
  private adminScopeChosen = computed(() => {
    const scope = this.selectedScope();
    return !!scope && this.uaaScopes().includes(scope);
  });

  uaaScopeStepHandle: SignalStepHandle = {
    valid: this.adminScopeChosen,
    submit: async () => {
      this.applyingSetup.set(true);
      try {
        await this.uaaSetupData.saveConfig(this.setupData(this.selectedScope()));
        const saved = this.uaaSetupData.state();
        if (saved.error) {
          throw new Error(saved.message || 'Failed to save UAA configuration');
        }
        if (!await waitForSetupConfirmed(this.authData)) {
          throw new Error(SETUP_NOT_CONFIRMED_MESSAGE);
        }
      } catch (err) {
        this.applyingSetup.set(false);
        throw err;
      }
      // Hard reload of the app on success — preserves the legacy behaviour.
      const loc = window.location;
      const reload = loc.protocol + '//' + loc.host;
      window.location.assign(reload);
    },
  };

  private setupData(adminScope: string): UaaSetupData {
    const form = this.uaaForm.controls;
    return {
      uaa_endpoint: form.apiUrl.value,
      console_client: form.clientId.value,
      password: form.adminPassword.value,
      skip_ssl_validation: form.skipSSL.value,
      username: form.adminUsername.value,
      console_client_secret: form.clientSecret.value,
      use_sso: form.useSSO.value,
      console_admin_scope: adminScope,
    };
  }

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
