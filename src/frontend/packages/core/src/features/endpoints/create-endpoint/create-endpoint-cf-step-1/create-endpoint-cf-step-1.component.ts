import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, AfterContentInit, Component, Input, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { cfEndpointUrlValidator, normalizeUrl } from '../../../../shared/validators';
import { CustomCheckboxComponent } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { AppInputDirective, CustomFormFieldComponent, AppErrorComponent } from '../../../../shared/components/custom-form-field/custom-form-field.component';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';
import { ActivatedRoute } from '@angular/router';
import {
  AppState,
  Store,
  StratosCatalogEndpointEntity,
  entityCatalog,
} from '@stratosui/store';
import { from, Observable } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';

import { EndpointsSignalService } from '../../../../core/signals/endpoints-signal.service';
import { getIdFromRoute } from '../../../../core/utils.service';
import { IStepperStep, StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { SessionService } from '../../../../shared/services/session.service';
import { CurrentUserPermissionsService } from '../../../../core/permissions/current-user-permissions.service';
import { UserProfileService } from '../../../../core/user-profile.service';
import { SnackBarService } from '../../../../shared/services/snackbar.service';
import { ConnectEndpointConfig } from '../../connect.service';
import { EndpointsSignalConfigService } from '../../endpoints-page/endpoints-signal-config.service';
import { getSSOClientRedirectURI } from '../../endpoint-helpers';
import { CreateEndpointHelperComponent } from '../create-endpoint-helper';
import { UniqueDirective } from '../../../../shared/components/unique.directive';
import { ProductNameComponent } from '../../../../shared/components/product-name.ccomponent';

interface CreateEndpointForm {
  nameField: FormControl<string>;
  urlField: FormControl<string>;
  skipSSLField: FormControl<boolean>;
  ssoAllowedField: FormControl<boolean>;
  clientIDField: FormControl<string>;
  clientSecretField: FormControl<string>;
  createSystemEndpointField: FormControl<boolean>;
  caCertField: FormControl<string>;
}

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    AppErrorComponent,
    CustomCheckboxComponent,
    CustomIconComponent,
    UniqueDirective,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEndpointCfStep1Component extends CreateEndpointHelperComponent implements IStepperStep, AfterContentInit {
  private fb = inject(FormBuilder);
  private snackBarService = inject(SnackBarService);
  private store = inject<Store<AppState>>(Store);
  private endpointsSignalConfig = inject(EndpointsSignalConfigService);
  private endpointsSignals = inject(EndpointsSignalService);


  registerForm: FormGroup<CreateEndpointForm>;

  @Input() finalStep: boolean;
  private pFixedUrl!: string;
  @Input()
  get fixedUrl(): string {
    return this.pFixedUrl;
  }
  set fixedUrl(url: string) {
    this.pFixedUrl = url;
    this.registerForm.controls.urlField.setValue(this.pFixedUrl);
    if (this.pFixedUrl) {
      this.registerForm.controls.urlField.disable();
    } else {
      this.registerForm.controls.urlField.enable();
    }
  }

  validate: Observable<boolean>;

  urlValidation: string;

  showAdvancedFields = false;
  clientRedirectURI!: string;

  endpointTypeSupportsSSO = false;
  endpoint: StratosCatalogEndpointEntity;
  show = false;

  showCACertField = false;
  showAdvancedOptions = false;
  lastSkipSSLValue = false;

  constructor() {
    const activatedRoute = inject(ActivatedRoute);
    const sessionService = inject(SessionService);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const userProfileService = inject(UserProfileService);

    super(sessionService, currentUserPermissionsService, userProfileService);

    this.registerForm = this.fb.group<CreateEndpointForm>({
      nameField: this.fb.nonNullable.control('', [Validators.required]),
      urlField: this.fb.nonNullable.control('', [Validators.required, cfEndpointUrlValidator]),
      skipSSLField: this.fb.nonNullable.control(false, []),
      ssoAllowedField: this.fb.nonNullable.control(false, []),
      // Optional Client ID and Client Secret
      clientIDField: this.fb.nonNullable.control('', []),
      clientSecretField: this.fb.nonNullable.control('', []),
      createSystemEndpointField: this.fb.nonNullable.control(true, []),
      caCertField: this.fb.nonNullable.control('', []),
    });

    const epType = getIdFromRoute(activatedRoute, 'type');
    const epSubType = getIdFromRoute(activatedRoute, 'subtype');
    this.endpoint = entityCatalog.getEndpoint(epType, epSubType);
    this.setUrlValidation(this.endpoint);

    // Client Redirect URI for SSO
    this.clientRedirectURI = getSSOClientRedirectURI();
  }

  onNext: StepOnNextFunction = () => from(this.runRegistration());

  // Perform the endpoint registration via the signal-config service. Returns
  // a step-shaped result the stepper's onNext can act on directly. The
  // service wraps the legacy ngrx ActionState observable in a Promise that
  // resolves once the busy edge transitions, so we no longer need pairwise/
  // filter/map gymnastics here.
  private async runRegistration(): Promise<StepOnNextResult> {
    const { subType, type } = this.endpoint.getTypeAndSubtype();

    // SSL settings — when a CA cert is provided we trust it as the override
    // (skip-ssl is mutually exclusive with cert pinning). When the CA-cert
    // field is shown but left empty, honor the user's checkbox so self-signed
    // endpoints (k3d / kind / minikube) still work via skipSslValidation.
    let sslAllow = this.registerForm.value.skipSSLField ?? false;
    const caCert = (this.registerForm.value.caCertField ?? '').trim();
    if (this.showCACertField && caCert.length > 0) {
      sslAllow = false;
    }

    // Normalize URL using shared utility
    const url = normalizeUrl(this.registerForm.value.urlField || '');
    const name = this.registerForm.value.nameField ?? '';

    const result = await this.endpointsSignalConfig.register({
      endpointType: type,
      endpointSubType: subType,
      name,
      endpoint: url,
      skipSslValidation: sslAllow,
      clientID: this.registerForm.value.clientIDField,
      clientSecret: this.registerForm.value.clientSecretField,
      ssoAllowed: this.registerForm.value.ssoAllowedField,
      createSystemEndpoint: this.registerForm.value.createSystemEndpointField,
      caCert: this.registerForm.value.caCertField,
    });

    const data: ConnectEndpointConfig = {
      guid: result.message,
      name,
      type: type || '',
      subType: subType || '',
      ssoAllowed: this.registerForm.value.ssoAllowedField ? !!this.registerForm.value.ssoAllowedField : false
    };
    if (!result.error) {
      this.snackBarService.show(`Successfully registered '${name}'`);
      // Warn if another endpoint is already registered with the same URL.
      // Multiple registrations are permitted (different users/operators may each need their own),
      // but the user should know about existing registrations.
      const urlHost = new URL(url).host;
      // Delay past the endpoints-page subscription that calls snackBarService.hide()
      // when endpoint connectivity state updates after registration completes.
      setTimeout(() => {
        const entities = this.endpointsSignals.endpoints();
        const dupes = Object.values(entities).filter(e =>
          e.api_endpoint?.Host === urlHost && e.guid !== result.message
        );
        if (dupes.length > 0) {
          const names = dupes.map(e => e.name).join(', ');
          this.snackBarService.show(`Note: '${url}' is also registered as: ${names}`, 'Dismiss');
        }
      }, 1500);
    }
    const success = !result.error;
    return {
      success,
      redirect: success && this.finalStep,
      message: success ? '' : result.message,
      data
    };
  }

  ngAfterContentInit() {
    this.validate = this.registerForm.statusChanges.pipe(
      startWith(this.registerForm.status),
      map(() => this.registerForm.valid)
    );
  }

  setUrlValidation(endpoint: StratosCatalogEndpointEntity) {
    this.urlValidation = endpoint ? endpoint.definition.urlValidationRegexString : '';
    this.setAdvancedFields(endpoint);
  }

  // Only show the Client ID and Client Secret fields if the endpoint type is Cloud Foundry
  setAdvancedFields(endpoint: StratosCatalogEndpointEntity) {
    this.showAdvancedFields = endpoint.definition.type === 'cf';

    // Only allow SSL if the endpoint type is Cloud Foundry
    this.endpointTypeSupportsSSO = endpoint.definition.type === 'cf';
  }

  toggleAdvancedOptions() {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  toggleCACertField() {
    this.showCACertField = !this.showCACertField;
    if (this.showCACertField) {
      this.lastSkipSSLValue = this.registerForm.value.skipSSLField ?? false;
      this.registerForm.controls.skipSSLField.setValue(false);
      this.registerForm.controls.skipSSLField.disable();
    } else {
      this.registerForm.controls.skipSSLField.setValue(this.lastSkipSSLValue ?? false);
      this.registerForm.controls.skipSSLField.enable();
    }
  }

  toggleCreateSystemEndpoint() {
    // wait a tick for validators to adjust to new data in the directive
    setTimeout(() => {
      this.registerForm.controls.nameField.updateValueAndValidity();
      this.registerForm.controls.urlField.updateValueAndValidity();
    });
  }
}
