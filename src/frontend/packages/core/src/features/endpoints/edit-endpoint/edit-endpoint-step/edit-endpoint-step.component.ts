import { ChangeDetectionStrategy, Component, computed, effect, Signal, OnDestroy, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppErrorComponent, AppInputDirective, CustomFormFieldComponent } from '../../../../shared/components/custom-form-field/custom-form-field.component';
import { CustomCheckboxComponent } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';
import {
  EndpointModel,
  EndpointsDataService,
  getFullEndpointApiUrl,
  EntityCatalogSchemas,
  IStratosEndpointDefinition,
  entityCatalog,
  ActionState } from '@stratosui/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { StepOnNextResult, SignalStepHandle } from '../../../../shared/components/stepper/step/step.component';
import { EndpointCertificatesComponent } from '../../certificates/endpoint-certificates.component';
import { getSSOClientRedirectURI } from '../../endpoint-helpers';
import { getIdFromRoute, safeUnsubscribe } from './../../../../core/utils.service';
import { UniqueDirective } from '../../../../shared/components/unique.directive';
import { ProductNameComponent } from '../../../../shared/components/product-name.ccomponent';

interface EditEndpointForm {
  name: FormControl<string>;
  url: FormControl<string>;
  skipSSL: FormControl<boolean>;
  setClientInfo: FormControl<boolean>;
  clientID: FormControl<string>;
  clientSecret: FormControl<string>;
  allowSSO: FormControl<boolean>;
  caCert: FormControl<string>;
}

@Component({
  selector: 'app-edit-endpoint-step',
  templateUrl: './edit-endpoint-step.component.html',
  styleUrls: ['./edit-endpoint-step.component.scss'],
  providers: [],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppErrorComponent,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomCheckboxComponent,
    CustomIconComponent,
    UniqueDirective,
    ProductNameComponent,
    EndpointCertificatesComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditEndpointStepComponent implements OnDestroy {

  endpointID: string;
  editEndpoint: FormGroup<EditEndpointForm>;
  showAdvancedFields = false;
  clientRedirectURI: string;
  endpointTypeSupportsSSO = false;
  validate: Observable<boolean>;
  readonly endpoint: Signal<EndpointModel | null>;
  readonly definition: Signal<IStratosEndpointDefinition<EntityCatalogSchemas> | undefined>;
  readonly existingEndpointNames: Signal<string[]>;
  formChangeSub: Subscription;
  setClientInfo = false;
  show = false;
  // Signal: written after the first render; an OnPush view under zoneless CD only repaints for signal writes.
  readonly showCACertField = signal(false);
  lastSkipSSLValue = false;
  // The cards follow the CA box; an empty pem (CA off) shows none.
  readonly caCertValue: Signal<string>;
  readonly certificatePem = computed(() => (this.showCACertField() ? this.caCertValue() : ''));

  // Signal-handle exposed to the parent stepper template (FWT-957)
  signalHandle: SignalStepHandle;

  private router = inject(Router);
  private endpointsData = inject(EndpointsDataService);

  constructor() {
    const activatedRoute = inject(ActivatedRoute);

    this.editEndpoint = new FormGroup<EditEndpointForm>({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      url: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      skipSSL: new FormControl(false, { nonNullable: true }),
      setClientInfo: new FormControl(false, { nonNullable: true }),
      clientID: new FormControl('', { nonNullable: true }),
      clientSecret: new FormControl('', { nonNullable: true }),
      allowSSO: new FormControl(false, { nonNullable: true }),
      caCert: new FormControl('', { nonNullable: true }) });

    this.caCertValue = toSignal(this.editEndpoint.controls.caCert.valueChanges, { initialValue: '' });
    this.clientRedirectURI = getSSOClientRedirectURI();

    this.validate = this.editEndpoint.statusChanges.pipe(map(() => this.editEndpoint.valid));

    const validSignal = toSignal(this.validate, { initialValue: this.editEndpoint.valid });
    this.signalHandle = {
      valid: validSignal,
      submit: async () => {
        const result = await this.onNext();
        if (!result.success) {
          throw new Error(result.message || 'Failed to update endpoint');
        }
        // Replace legacy `redirect: true` with explicit navigation back
        // to the endpoints page (matches the stepper cancel target).
        await this.router.navigate(['/endpoints']);
      },
    };

    this.endpointID = getIdFromRoute(activatedRoute, 'id');

    this.endpoint = this.endpointsData.endpointById(this.endpointID);
    // An endpoint type with no registered entity has no definition.
    this.definition = computed(() => {
      const endpoint = this.endpoint();
      return endpoint?.cnsi_type ? entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type)?.definition : undefined;
    });
    this.existingEndpointNames = computed(() => this.endpointsData.endpointsList()
      .filter(ep => ep.guid !== this.endpointID)
      .map(ep => ep.name));

    // Fill the form in with the endpoint data, once it is known
    let filled = false;
    effect(() => {
      const endpoint = this.endpoint();
      if (filled || !endpoint) {
        return;
      }
      filled = true;
      untracked(() => this.fillForm(endpoint));
    });

    this.formChangeSub = this.editEndpoint.valueChanges.subscribe(values => {
      // Enable or disable controls based on the checkbox
      const newSetClientInfo = values.setClientInfo ?? false;
      if (newSetClientInfo !== this.setClientInfo) {
        this.setClientInfo = newSetClientInfo;
        this.updateControls();
      }
    });
  }

  // Typed controls (get('name') would return AbstractControl | null).
  get name() { return this.editEndpoint.controls.name; }

  get clientID() { return this.editEndpoint.controls.clientID; }

  updateControls() {
    if (!this.setClientInfo) {
      this.editEndpoint.controls.clientID.disable();
      this.editEndpoint.controls.clientSecret.disable();
    } else {
      this.editEndpoint.controls.clientID.enable();
      this.editEndpoint.controls.clientSecret.enable();
    }
  }

  private fillForm(endpoint: EndpointModel) {
    this.setAdvancedFields(endpoint);
    this.lastSkipSSLValue = endpoint.skip_ssl_validation ?? false;
    this.showCACertField.set(!!endpoint.ca_cert);
    this.updateSSLFieldCheckbox();
    this.editEndpoint.setValue({
      name: endpoint.name,
      url: getFullEndpointApiUrl(endpoint),
      skipSSL: endpoint.skip_ssl_validation ?? false,
      setClientInfo: false,
      clientID: endpoint.client_id ?? '',
      clientSecret: '',
      allowSSO: endpoint.sso_allowed,
      caCert: endpoint.ca_cert || '' });
    this.editEndpoint.controls.url.disable();
    this.updateControls();
  }

  async onNext(): Promise<StepOnNextResult> {
    const endpoint = this.endpoint();
    if (!endpoint) {
      return { success: false, message: 'The endpoint is not loaded', redirect: false };
    }
    const caCert = this.showCACertField() ? this.editEndpoint.value.caCert : undefined;
    const skipSSL = this.showCACertField() ? false : this.editEndpoint.value.skipSSL ?? false;
    const state: ActionState = await this.endpointsData.update(this.endpointID, {
      endpointType: endpoint.cnsi_type ?? '',
      name: this.editEndpoint.value.name ?? '',
      skipSSL,
      setClientInfo: this.editEndpoint.value.setClientInfo ?? false,
      clientID: this.editEndpoint.value.clientID ?? '',
      clientSecret: this.editEndpoint.value.clientSecret ?? '',
      allowSSO: this.editEndpoint.value.allowSSO ?? false,
      caCert,
    });
    return {
      success: !state.error,
      message: state.message,
      redirect: !state.error
    };
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.formChangeSub);
  }

  // Only show the Client ID and Client Secret fields if the endpoint type is Cloud Foundry
  setAdvancedFields(endpoint: EndpointModel) {
    const isCloudFoundry = endpoint && endpoint.cnsi_type === 'cf';
    this.showAdvancedFields = isCloudFoundry;
    // Only allow SSL if the endpoint type is Cloud Foundry
    this.endpointTypeSupportsSSO = isCloudFoundry;
  }

  toggleCACertField() {
    this.showCACertField.update(shown => !shown);
    if (this.showCACertField()) {
      this.lastSkipSSLValue = this.editEndpoint.value.skipSSL ?? false;
      this.editEndpoint.controls.skipSSL.setValue(false);
    } else {
      this.editEndpoint.controls.skipSSL.setValue(this.lastSkipSSLValue ?? false);
    }
    this.updateSSLFieldCheckbox();
  }

  private updateSSLFieldCheckbox() {
    if (this.showCACertField()) {
      this.editEndpoint.controls.skipSSL.disable();
    } else {
      this.editEndpoint.controls.skipSSL.enable();
    }
  }
}
