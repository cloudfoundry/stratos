import { AfterContentInit, Component, Input } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component extends CreateEndpointHelperComponent implements IStepperStep, AfterContentInit {

  registerForm: UntypedFormGroup;

  @Input() finalStep: boolean;
  private pFixedUrl: string;
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
  clientRedirectURI: string;

  endpointTypeSupportsSSO = false;
  endpoint: StratosCatalogEndpointEntity;
  show = false;

  showCACertField = false;
  showAdvancedOptions = false;
  lastSkipSSLValue = false;

  constructor(
    private fb: UntypedFormBuilder,
    activatedRoute: ActivatedRoute,
    private snackBarService: SnackBarService,
    sessionService: SessionService,
    currentUserPermissionsService: CurrentUserPermissionsService,
    userProfileService: UserProfileService
  ) {
    super(sessionService, currentUserPermissionsService, userProfileService);

    this.registerForm = this.fb.group({
      nameField: ['', [Validators.required]],
      urlField: ['', [Validators.required]],
      skipSSLField: [false, []],
      ssoAllowedField: [false, []],
      // Optional Client ID and Client Secret
      clientIDField: ['', []],
      clientSecretField: ['', []],
      createSystemEndpointField: [true, []],
      caCertField: ['', []],
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

    return stratosEntityCatalog.endpoint.api.register<ActionState>(
      type,
      subType,
      this.registerForm.value.nameField,
      this.registerForm.value.urlField,
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
          name: this.registerForm.value.nameField,
          type,
          subType,
          ssoAllowed: this.registerForm.value.ssoAllowedField ? !!this.registerForm.value.ssoAllowedField : false
        };
        if (!result.error) {
          this.snackBarService.show(`Successfully registered '${this.registerForm.value.nameField}'`);
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
      }));
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
      this.lastSkipSSLValue = this.registerForm.value.skipSSLField;
      this.registerForm.controls.skipSSLField.setValue(false);
    } else {
      this.registerForm.controls.skipSSLField.setValue(this.lastSkipSSLValue);
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
