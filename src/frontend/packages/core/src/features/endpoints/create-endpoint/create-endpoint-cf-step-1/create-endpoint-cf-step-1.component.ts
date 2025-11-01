import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, AfterContentInit, Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { cfEndpointUrlValidator, normalizeUrl } from '../../../../shared/validators';
import { CustomCheckboxComponent } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { CustomFormFieldComponent } from '../../../../shared/components/custom-form-field/custom-form-field.component';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';
import { ActivatedRoute } from '@angular/router';
import {
  ActionState,
  stratosEntityCatalog,
  entityCatalog,
  StratosCatalogEndpointEntity
} from '@stratosui/store';
import { Observable } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { getIdFromRoute } from '../../../../core/utils.service';
import { IStepperStep, StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { SessionService } from '../../../../shared/services/session.service';
import { CurrentUserPermissionsService } from '../../../../core/permissions/current-user-permissions.service';
import { UserProfileService } from '../../../../core/user-profile.service';
import { SnackBarService } from '../../../../shared/services/snackbar.service';
import { ConnectEndpointConfig } from '../../connect.service';
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
    CustomFormFieldComponent,
    CustomCheckboxComponent,
    CustomIconComponent,
    UniqueDirective,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEndpointCfStep1Component extends CreateEndpointHelperComponent implements IStepperStep, AfterContentInit {

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

  constructor(
    private fb: FormBuilder,
    activatedRoute: ActivatedRoute,
    private snackBarService: SnackBarService,
    sessionService: SessionService,
    currentUserPermissionsService: CurrentUserPermissionsService,
    userProfileService: UserProfileService
  ) {
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

  onNext: StepOnNextFunction = () => {
    const { subType, type } = this.endpoint.getTypeAndSubtype();

    // SSL Setttings
    let sslAllow = this.registerForm.value.skipSSLField;
    if (this.showCACertField) {
      sslAllow = false;
    }

    // Normalize URL using shared utility
    const url = normalizeUrl(this.registerForm.value.urlField || '');

    return stratosEntityCatalog.endpoint.api.register<ActionState>(
      type,
      subType,
      this.registerForm.value.nameField,
      url,
      sslAllow,
      this.registerForm.value.clientIDField,
      this.registerForm.value.clientSecretField,
      this.registerForm.value.ssoAllowedField,
      this.registerForm.value.createSystemEndpointField,
      this.registerForm.value.caCertField,
    ).pipe(
      pairwise(),
      filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
      map(([, newVal]) => newVal),
      map(result => {
        const data: ConnectEndpointConfig = {
          guid: result.message,
          name: this.registerForm.value.nameField ?? '',
          type: type || '',
          subType: subType || '',
          ssoAllowed: this.registerForm.value.ssoAllowedField ? !!this.registerForm.value.ssoAllowedField : false
        };
        if (!result.error) {
          this.snackBarService.show(`Successfully registered '${this.registerForm.value.nameField ?? ''}'`);
        }
        const success = !result.error;
        return {
          success,
          redirect: success && this.finalStep,
          message: success ? '' : result.message,
          data
        };
      })
    );
  };

  ngAfterContentInit() {
    this.validate = this.registerForm.statusChanges.pipe(
      map(() => {
        return this.registerForm.valid;
      })
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
