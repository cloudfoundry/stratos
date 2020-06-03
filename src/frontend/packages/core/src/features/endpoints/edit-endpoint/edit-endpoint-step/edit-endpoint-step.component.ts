import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, pairwise, switchMap } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { selectUpdateInfo } from '../../../../../../store/src/selectors/api.selectors';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { getFullEndpointApiUrl, getSSOClientRedirectURI } from '../../endpoint-helpers';
import { UpdateEndpoint } from './../../../../../../store/src/actions/endpoint.actions';
import {
  EntityCatalogSchemas,
  IStratosEndpointDefinition,
} from './../../../../../../store/src/entity-catalog/entity-catalog.types';
import { endpointEntitiesSelector } from './../../../../../../store/src/selectors/endpoint.selectors';
import { EndpointModel } from './../../../../../../store/src/types/endpoint.types';
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
  editEndpoint: FormGroup;
  showAdvancedFields = false;
  clientRedirectURI: string;
  endpointTypeSupportsSSO = false;
  validate: Observable<boolean>;
  existingEndpoints: Observable<EndpointModelMap>;
  endpoint$: Observable<EndpointModel>;
  definition$: Observable<IStratosEndpointDefinition<EntityCatalogSchemas>>;
  existingEndpoinNames$: Observable<string[]>;
  formChangeSub: Subscription;
  setClientInfo = false;

  constructor(
    private store: Store<AppState>,
    activatedRoute: ActivatedRoute,
  ) {
    this.editEndpoint = new FormGroup({
      name: new FormControl('', [Validators.required as any]),
      url: new FormControl('', [Validators.required as any]),
      skipSSL: new FormControl(false),
      setClientInfo: new FormControl(false),
      clientID: new FormControl(''),
      clientSecret: new FormControl(''),
      allowSSO: new FormControl(false),
    });

    this.clientRedirectURI = getSSOClientRedirectURI();

    this.validate = this.editEndpoint.statusChanges.pipe(map(() => this.editEndpoint.valid));

    this.endpointID = getIdFromRoute(activatedRoute, 'id');

    this.existingEndpoints = this.store.select(endpointEntitiesSelector);

    this.existingEndpoinNames$ = this.existingEndpoints.pipe(
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
        const action = new UpdateEndpoint(
          endpoint.cnsi_type,
          this.endpointID,
          this.editEndpoint.value.name,
          this.editEndpoint.value.skipSSL,
          this.editEndpoint.value.setClientInfo,
          this.editEndpoint.value.clientID,
          this.editEndpoint.value.clientSecret,
          this.editEndpoint.value.allowSSO,
        );

        this.store.dispatch(action);

        return this.store.select(selectUpdateInfo('stratosEndpoint', this.endpointID, 'updating')).pipe(
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
        )
      })
    )
  }

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

}
