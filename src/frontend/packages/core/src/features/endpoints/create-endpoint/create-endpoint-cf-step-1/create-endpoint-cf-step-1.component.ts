import { AfterContentInit, Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StratosCurrentUserPermissions } from '../../../../core/permissions/stratos-user-permissions.checker';
import { Observable } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { getFullEndpointApiUrl } from '../../../../../../store/src/endpoint-utils';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import {
  StratosCatalogEndpointEntity,
} from '../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../../../store/src/stratos-entity-catalog';
import { getIdFromRoute } from '../../../../core/utils.service';
import { IStepperStep, StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { SnackBarService } from '../../../../shared/services/snackbar.service';
import { ConnectEndpointConfig } from '../../connect.service';
import { getSSOClientRedirectURI } from '../../endpoint-helpers';
import { SessionService } from '../../../../shared/services/session.service';

type EndpointObservable = Observable<{
  names: string[],
  urls: string[],
}>;

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements IStepperStep, AfterContentInit {

  registerForm: FormGroup;

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

  overwritePermission: Observable<StratosCurrentUserPermissions[]>;

  existingEndpoints: EndpointObservable;
  existingAdminEndpoints: EndpointObservable;

  validate: Observable<boolean>;

  urlValidation: string;

  showAdvancedFields = false;
  clientRedirectURI: string;

  endpointTypeSupportsSSO = false;
  endpoint: StratosCatalogEndpointEntity;
  show = false;

  showAdvancedOptions = false;

  constructor(
    private fb: FormBuilder,
    activatedRoute: ActivatedRoute,
    private snackBarService: SnackBarService,
    private sessionService: SessionService
  ) {
    this.registerForm = this.fb.group({
      nameField: ['', [Validators.required]],
      urlField: ['', [Validators.required]],
      skipSllField: [false, []],
      ssoAllowedField: [false, []],
      // Optional Client ID and Client Secret
      clientIDField: ['', []],
      clientSecretField: ['', []],
      overwriteEndpointsField: [false, []],
    });

    const currentPage$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor().currentPage$;
    this.existingAdminEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.filter(ep => ep.creator.admin).map(ep => ep.name),
        urls: endpoints.filter(ep => ep.creator.admin).map(ep => getFullEndpointApiUrl(ep)),
      }))
    );
    this.existingEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.map(ep => ep.name),
        urls: endpoints.map(ep => getFullEndpointApiUrl(ep)),
      }))
    );

    this.overwritePermission = this.sessionService.userEndpointsEnabled().pipe(
      map(enabled => enabled ? [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT] : [])
    );

    const epType = getIdFromRoute(activatedRoute, 'type');
    const epSubType = getIdFromRoute(activatedRoute, 'subtype');
    this.endpoint = entityCatalog.getEndpoint(epType, epSubType);
    this.setUrlValidation(this.endpoint);

    // Client Redirect URI for SSO
    this.clientRedirectURI = getSSOClientRedirectURI();
  }

  onNext: StepOnNextFunction = () => {
    const { subType, type } = this.endpoint.getTypeAndSubtype();
    return stratosEntityCatalog.endpoint.api.register<ActionState>(
      type,
      subType,
      this.registerForm.value.nameField,
      this.registerForm.value.urlField,
      this.registerForm.value.skipSllField,
      this.registerForm.value.clientIDField,
      this.registerForm.value.clientSecretField,
      this.registerForm.value.ssoAllowedField,
      this.registerForm.value.overwriteEndpointsField,
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

  toggleOverwriteEndpoints() {
    // wait a tick for validators to adjust to new data in the directive
    setTimeout(()=>{
      this.registerForm.controls.nameField.updateValueAndValidity();
      this.registerForm.controls.urlField.updateValueAndValidity();
    });
  }
}
