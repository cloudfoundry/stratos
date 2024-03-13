import { Component, OnDestroy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { getSSOClientRedirectURI } from '../../endpoint-helpers';
import { getIdFromRoute, safeUnsubscribe } from './../../../../core/utils.service';
import { IStepperStep } from './../../../../shared/components/stepper/step/step.component';

interface EndpointModelMap {
  [id: string]: EndpointModel;
}

@Component({
  selector: 'app-edit-endpoint-step',
  templateUrl: './edit-endpoint-step.component.html',
  styleUrls: ['./edit-endpoint-step.component.scss'],
  providers: []
})
export class EditEndpointStepComponent implements OnDestroy, IStepperStep {

  endpointID: string;
  editEndpoint: UntypedFormGroup;
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

  constructor(
    activatedRoute: ActivatedRoute,
  ) {
    this.editEndpoint = new UntypedFormGroup({
      name: new UntypedFormControl('', [Validators.required as any]),
      url: new UntypedFormControl('', [Validators.required as any]),
      skipSSL: new UntypedFormControl(false),
      setClientInfo: new UntypedFormControl(false),
      clientID: new UntypedFormControl(''),
      clientSecret: new UntypedFormControl(''),
      allowSSO: new UntypedFormControl(false),
    });

    this.clientRedirectURI = getSSOClientRedirectURI();

    this.validate = this.editEndpoint.statusChanges.pipe(map(() => this.editEndpoint.valid));

    this.endpointID = getIdFromRoute(activatedRoute, 'id');

    this.existingEndpoints = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor().currentPage$.pipe(
      map(endpoints => endpoints.reduce((res, endpoint) => {
        res[endpoint.guid] = endpoint;
        return res;
      }, {}))
    );

    this.existingEndpointNames$ = this.existingEndpoints.pipe(
      map(endpoints => Object.values(endpoints).filter((ep: EndpointModel) => ep.guid !== this.endpointID)),
      map((endpoints: EndpointModel[]) => endpoints.map(ep => ep.name))
    );

    this.endpoint$ = this.existingEndpoints.pipe(
      map(endpoints => Object.values(endpoints).find((e => e.guid === this.endpointID)))
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
      });
      this.editEndpoint.controls.url.disable();
      this.updateControls();
    });

    this.formChangeSub = this.editEndpoint.valueChanges.subscribe(values => {
      // Enable or disable controls based on the checkbox
      if (values.setClientInfo !== this.setClientInfo) {
        this.setClientInfo = values.setClientInfo;
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

  onNext: StepOnNextFunction = () => {
    return this.endpoint$.pipe(
      first(),
      switchMap(endpoint => {
        const caCert = this.showCACertField ? this.editEndpoint.value.caCert : undefined;
        const skipSSL = this.showCACertField ? false : this.editEndpoint.value.skipSSL;
        return stratosEntityCatalog.endpoint.api.update<ActionState>(
          this.endpointID,
          this.endpointID, {
          endpointType: endpoint.cnsi_type,
          id: this.endpointID,
          name: this.editEndpoint.value.name,
          skipSSL,
          setClientInfo: this.editEndpoint.value.setClientInfo,
          clientID: this.editEndpoint.value.clientID,
          clientSecret: this.editEndpoint.value.clientSecret,
          allowSSO: this.editEndpoint.value.allowSSO,
          caCert,
        }
        ).pipe(
          pairwise(),
          filter(([oldV, newV]) => oldV.busy && !newV.busy),
          map(([, newV]) => newV),
          map(o => {
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
  setAdvancedFields(endpoint: any) {
    const isCloudFoundry = endpoint && endpoint.cnsi_type === 'cf';
    this.showAdvancedFields = isCloudFoundry;
    // Only allow SSL if the endpoint type is Cloud Foundry
    this.endpointTypeSupportsSSO = isCloudFoundry;
  }

  toggleCACertField() {
    this.showCACertField = !this.showCACertField;
    if (this.showCACertField) {
      this.lastSkipSSLValue = this.editEndpoint.value.skipSSL;
      this.editEndpoint.controls.skipSSL.setValue(false);
    } else {
      this.editEndpoint.controls.skipSSL.setValue(this.lastSkipSSLValue);
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
