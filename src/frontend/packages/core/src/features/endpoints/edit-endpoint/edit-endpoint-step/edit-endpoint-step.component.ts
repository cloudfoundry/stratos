import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CustomFormFieldComponent } from '../../../../shared/components/custom-form-field/custom-form-field.component';
import { CustomCheckboxComponent } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';
import {
  EndpointModel,
  getFullEndpointApiUrl,
  EntityCatalogSchemas,
  IStratosEndpointDefinition,
  stratosEntityCatalog,
  entityCatalog,
  ActionState,
} from '@stratosui/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, pairwise, switchMap } from 'rxjs/operators';

import { StepOnNextFunction, StepComponent, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { getSSOClientRedirectURI } from '../../endpoint-helpers';
import { getIdFromRoute, safeUnsubscribe } from './../../../../core/utils.service';
import { IStepperStep } from './../../../../shared/components/stepper/step/step.component';
import { UniqueDirective } from '../../../../shared/components/unique.directive';
import { ProductNameComponent } from '../../../../shared/components/product-name.ccomponent';

interface EndpointModelMap {
  [id: string]: EndpointModel;
}

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
    CustomFormFieldComponent,
    CustomCheckboxComponent,
    CustomIconComponent,
    UniqueDirective,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditEndpointStepComponent implements OnDestroy, IStepperStep {

  endpointID: string;
  editEndpoint: FormGroup<EditEndpointForm>;
  showAdvancedFields = false;
  clientRedirectURI: string;
  endpointTypeSupportsSSO = false;
  validate: Observable<boolean>;
  existingEndpoints: Observable<EndpointModelMap>;
  endpoint$: Observable<EndpointModel>;
  definition$: Observable<IStratosEndpointDefinition<EntityCatalogSchemas>>;
  existingEndpointNames$: Observable<string[]>;
  formChangeSub: Subscription;
  setClientInfo = false;
  show = false;
  showCACertField = false;
  lastSkipSSLValue = false;

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
      caCert: new FormControl('', { nonNullable: true }),
    });

    this.clientRedirectURI = getSSOClientRedirectURI();

    this.validate = this.editEndpoint.statusChanges.pipe(map(() => this.editEndpoint.valid));

    this.endpointID = getIdFromRoute(activatedRoute, 'id');

    this.existingEndpoints = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor().currentPage$.pipe(
      map(endpoints => endpoints.reduce((res: EndpointModelMap, endpoint) => {
        res[endpoint.guid] = endpoint;
        return res;
      }, {} as EndpointModelMap))
    );

    this.existingEndpointNames$ = this.existingEndpoints.pipe(
      map(endpoints => Object.values(endpoints).filter((ep: EndpointModel) => ep.guid !== this.endpointID)),
      map((endpoints: EndpointModel[]) => endpoints.map(ep => ep.name))
    );

    this.endpoint$ = this.existingEndpoints.pipe(
      map(endpoints => Object.values(endpoints).find((e: EndpointModel) => e.guid === this.endpointID))
    );

    this.definition$ = this.endpoint$.pipe(
      map(entity => entityCatalog.getEndpoint(entity.cnsi_type, entity.sub_type)),
      map(d => d.definition)
    );

    // Fill the form in with the endpoint data
    this.endpoint$.pipe(
      filter(ep => !!ep),
      first()
    ).subscribe(endpoint => {
      this.setAdvancedFields(endpoint);
      this.lastSkipSSLValue = endpoint.skip_ssl_validation;
      this.showCACertField = !!endpoint.caCert;
      this.updateSSLFieldCheckbox();
      this.editEndpoint.setValue({
        name: endpoint.name,
        url: getFullEndpointApiUrl(endpoint),
        skipSSL: endpoint.skip_ssl_validation,
        setClientInfo: false,
        clientID: endpoint.client_id,
        clientSecret: '',
        allowSSO: endpoint.sso_allowed,
        caCert: endpoint.caCert || '',
      });
      this.editEndpoint.controls.url.disable();
      this.updateControls();
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

  get name() { return this.editEndpoint.get('name'); }

  get clientID() { return this.editEndpoint.get('clientID'); }

  updateControls() {
    if (!this.setClientInfo) {
      this.editEndpoint.controls.clientID.disable();
      this.editEndpoint.controls.clientSecret.disable();
    } else {
      this.editEndpoint.controls.clientID.enable();
      this.editEndpoint.controls.clientSecret.enable();
    }
  }

  onNext: StepOnNextFunction = (index: number, step: StepComponent): Observable<StepOnNextResult> => {
    return this.endpoint$.pipe(
      filter((endpoint): endpoint is EndpointModel => !!endpoint),
      first(),
      switchMap(endpoint => {
        const caCert = this.showCACertField ? this.editEndpoint.value.caCert : undefined;
        const skipSSL = this.showCACertField ? false : this.editEndpoint.value.skipSSL ?? false;
        return ((stratosEntityCatalog.endpoint.api as any).update(
          this.endpointID,
          this.endpointID, {
          endpointType: endpoint.cnsi_type,
          id: this.endpointID,
          name: this.editEndpoint.value.name ?? '',
          skipSSL,
          setClientInfo: this.editEndpoint.value.setClientInfo ?? false,
          clientID: this.editEndpoint.value.clientID ?? '',
          clientSecret: this.editEndpoint.value.clientSecret ?? '',
          allowSSO: this.editEndpoint.value.allowSSO ?? false,
          caCert,
        }
        ) as Observable<ActionState>).pipe(
          pairwise(),
          filter(([oldV, newV]) => oldV.busy && !newV.busy),
          map(([, newV]) => newV),
          map((o: ActionState): StepOnNextResult => {
            return {
              success: !o.error,
              message: o.message,
              redirect: !o.error
            };
          })
        );
      })
    );
  };

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
    this.showCACertField = !this.showCACertField;
    if (this.showCACertField) {
      this.lastSkipSSLValue = this.editEndpoint.value.skipSSL ?? false;
      this.editEndpoint.controls.skipSSL.setValue(false);
    } else {
      this.editEndpoint.controls.skipSSL.setValue(this.lastSkipSSLValue ?? false);
    }
    this.updateSSLFieldCheckbox();
  }

  private updateSSLFieldCheckbox() {
    if (this.showCACertField) {
      this.editEndpoint.controls.skipSSL.disable();
    } else {
      this.editEndpoint.controls.skipSSL.enable();
    }
  }
}
