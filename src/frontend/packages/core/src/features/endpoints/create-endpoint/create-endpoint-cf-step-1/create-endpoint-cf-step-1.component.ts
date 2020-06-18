import { AfterContentInit, Component, Input, ViewChild } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { denormalize } from 'normalizr';
import { Observable } from 'rxjs';
import { filter, map, pairwise, withLatestFrom } from 'rxjs/operators';

import { ShowSnackBar } from '../../../../../../store/src/actions/snackBar.actions';
import { GeneralEntityAppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import {
  StratosCatalogEndpointEntity,
} from '../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { getAPIRequestDataState } from '../../../../../../store/src/selectors/api.selectors';
import { stratosEntityCatalog } from '../../../../../../store/src/stratos-entity-catalog';
import { endpointEntitySchema } from '../../../../base-entity-schemas';
import { getIdFromRoute } from '../../../../core/utils.service';
import { IStepperStep, StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { ConnectEndpointConfig } from '../../connect.service';
import { getFullEndpointApiUrl, getSSOClientRedirectURI } from '../../endpoint-helpers';

/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements IStepperStep, AfterContentInit {

  @Input() finalStep: boolean;

  existingEndpoints: Observable<{
    names: string[],
    urls: string[],
  }>;

  validate: Observable<boolean>;

  @ViewChild('form', { static: true }) form: NgForm;
  @ViewChild('nameField', { static: true }) nameField: NgModel;
  @ViewChild('urlField', { static: true }) urlField: NgModel;
  @ViewChild('skipSllField', { static: true }) skipSllField: NgModel;
  @ViewChild('ssoAllowedField') ssoAllowedField: NgModel;

  // Optional Client ID and Client Secret
  @ViewChild('clientIDField') clientIDField: NgModel;
  @ViewChild('clientSecretField') clientSecretField: NgModel;

  urlValidation: string;

  showAdvancedFields = false;
  clientRedirectURI: string;

  endpointTypeSupportsSSO = false;
  endpoint: StratosCatalogEndpointEntity;

  // private endpointEntityKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, endpointSchemaKey);

  constructor(private store: Store<GeneralEntityAppState>, activatedRoute: ActivatedRoute, ) {
    const paginationState$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor().pagination$;

    // TODO: RC Fix me, this is madness
    this.existingEndpoints = paginationState$.pipe(
      withLatestFrom(store.select(getAPIRequestDataState)),
      map(([pagination, entities]) => {
        const pages = Object.values(pagination.ids);
        const page = [].concat.apply([], pages);
        const endpoints = page.length ? denormalize(page, [endpointEntitySchema], entities) : [];
        return {
          names: endpoints.map(ep => ep.name),
          urls: endpoints.map(ep => getFullEndpointApiUrl(ep)),
        };
      })
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
      this.nameField.value,
      this.urlField.value,
      !!this.skipSllField.value,
      this.clientIDField ? this.clientIDField.value : '',
      this.clientSecretField ? this.clientSecretField.value : '',
      this.ssoAllowedField ? !!this.ssoAllowedField.value : false,
    ).pipe(
      pairwise(),
      filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
      map(([oldVal, newVal]) => newVal),
      map(result => {
        const data: ConnectEndpointConfig = {
          guid: result.message,
          name: this.nameField.value,
          type,
          subType,
          ssoAllowed: this.ssoAllowedField ? !!this.ssoAllowedField.value : false
        };
        if (!result.error) {
          this.store.dispatch(new ShowSnackBar(`Successfully registered '${this.nameField.value}'`));
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
  }


  ngAfterContentInit() {
    this.validate = this.form.statusChanges.pipe(
      map(() => {
        return this.form.valid;
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
}
