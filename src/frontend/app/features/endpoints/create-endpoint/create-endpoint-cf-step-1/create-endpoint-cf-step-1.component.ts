import { AfterContentInit, Component, ViewChild } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import { denormalize } from 'normalizr';
import { Observable } from 'rxjs';
import { filter, map, pairwise, withLatestFrom } from 'rxjs/operators';

import { UtilsService } from '../../../../core/utils.service';
import { IStepperStep, StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { GetAllEndpoints, RegisterEndpoint } from '../../../../store/actions/endpoint.actions';
import { AppState } from '../../../../store/app-state';
import { EndpointsEffect } from '../../../../store/effects/endpoint.effects';
import { endpointSchemaKey, entityFactory } from '../../../../store/helpers/entity-factory';
import { getAPIRequestDataState, selectUpdateInfo } from '../../../../store/selectors/api.selectors';
import { selectPaginationState } from '../../../../store/selectors/pagination.selectors';
import { endpointStoreNames } from '../../../../store/types/endpoint.types';
import { DEFAULT_ENDPOINT_TYPE, getEndpointTypes, getFullEndpointApiUrl } from '../../endpoint-helpers';
import { EndpointTypeConfig } from '../../../../core/extension/extension-types';


/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements IStepperStep, AfterContentInit {

  existingEndpoints: Observable<{
    names: string[],
    urls: string[],
  }>;

  validate: Observable<boolean>;

  @ViewChild('form') form: NgForm;
  @ViewChild('typeField') typeField: NgModel;
  @ViewChild('nameField') nameField: NgModel;
  @ViewChild('urlField') urlField: NgModel;
  @ViewChild('skipSllField') skipSllField: NgModel;
  @ViewChild('ssoAllowedField') ssoAllowedField: NgModel;

  // Optional Client ID and Client Secret
  @ViewChild('clientIDField') clientIDField: NgModel;
  @ViewChild('clientSecretField') clientSecretField: NgModel;

  typeValue: any;

  endpointTypes = getEndpointTypes();
  urlValidation: string;

  showAdvancedFields = false;
  clientRedirectURI: string;

  endpointTypeSupportsSSO = false;

  constructor(private store: Store<AppState>, private utilsService: UtilsService) {

    this.existingEndpoints = store.select(selectPaginationState(endpointStoreNames.type, GetAllEndpoints.storeKey))
      .pipe(
        withLatestFrom(store.select(getAPIRequestDataState)),
        map(([pagination, entities]) => {
          const pages = Object.values(pagination.ids);
          const page = [].concat.apply([], pages);
          const endpoints = page.length ? denormalize(page, [entityFactory(endpointSchemaKey)], entities) : [];
          return {
            names: endpoints.map(ep => ep.name),
            urls: endpoints.map(ep => getFullEndpointApiUrl(ep)),
          };
        })
      );

    // Auto-select default endpoint type - typically this is Cloud Foundry
    const defaultType = this.endpointTypes.filter((t) => t.value === DEFAULT_ENDPOINT_TYPE);
    if (defaultType && defaultType.length) {
      this.typeValue = defaultType[0].value;
      this.setUrlValidation(this.typeValue);
    }

    // Client Redirect URI for SSO
    this.clientRedirectURI = window.location.protocol + '//' + window.location.hostname +
      (window.location.port ? ':' + window.location.port : '') + '/pp/v1/auth/sso_login_callback';
  }

  onNext: StepOnNextFunction = () => {
    const action = new RegisterEndpoint(
      this.typeField.value,
      this.nameField.value,
      this.urlField.value,
      !!this.skipSllField.value,
      this.clientIDField ? this.clientIDField.value : '',
      this.clientSecretField ? this.clientSecretField.value : '',
      this.ssoAllowedField ? !!this.ssoAllowedField.value : false,
    );

    this.store.dispatch(action);

    const update$ = this.store.select(
      this.getUpdateSelector(action.guid())
    ).pipe(filter(update => !!update));

    return update$.pipe(pairwise(),
      filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
      map(([oldVal, newVal]) => newVal),
      map(result => ({
        success: !result.error,
        redirect: !result.error,
        message: !result.error ? '' : result.message
      })));
  }

  private getUpdateSelector(guid) {
    return selectUpdateInfo(
      endpointStoreNames.type,
      guid,
      EndpointsEffect.registeringKey,
    );
  }

  ngAfterContentInit() {
    this.validate = this.form.statusChanges.pipe(
      map(() => {
        return this.form.valid;
      }));
  }

  setUrlValidation(endpointValue: string) {
    const endpoint = this.endpointTypes.find(e => e.value === endpointValue);
    this.urlValidation = endpoint ? endpoint.urlValidation : '';
    this.setAdvancedFields(endpoint);
  }

  // Only show the Client ID and Client Secret fields if the endpoint type is Cloud Foundry
  setAdvancedFields(endpoint: EndpointTypeConfig) {
    this.showAdvancedFields = endpoint.value === 'cf';

    // Only allow SSL if the endpoint type isCloud Foundry
    this.endpointTypeSupportsSSO = endpoint.value === 'cf';
  }
}
