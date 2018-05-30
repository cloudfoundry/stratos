
import {filter, pairwise,  map, withLatestFrom } from 'rxjs/operators';
/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import { denormalize } from 'normalizr';
import { Observable } from 'rxjs';

import { UtilsService } from '../../../../core/utils.service';
import { IStepperStep, StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { GetAllEndpoints, RegisterEndpoint } from '../../../../store/actions/endpoint.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { EndpointsEffect } from '../../../../store/effects/endpoint.effects';
import { getFullEndpointApiUrl, getEndpointTypes, DEFAULT_ENDPOINT_TYPE } from '../../endpoint-helpers';
import { getAPIRequestDataState, selectUpdateInfo } from '../../../../store/selectors/api.selectors';
import { selectPaginationState } from '../../../../store/selectors/pagination.selectors';
import { endpointStoreNames } from '../../../../store/types/endpoint.types';
import { entityFactory } from '../../../../store/helpers/entity-factory';
import { endpointSchemaKey } from '../../../../store/helpers/entity-factory';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements OnInit, IStepperStep, AfterContentInit {

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

  typeValue: any;

  endpointTypes = getEndpointTypes();
  urlValidation: string;

  snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  constructor(private store: Store<AppState>, private utilsService: UtilsService, private snackBar: MatSnackBar) {

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
  }

  ngOnInit() { }

  onNext: StepOnNextFunction = () => {

    // Close previous error snackbar if there was omne
    if (this.snackBarRef) {
      this.snackBar.dismiss();
    }

    const action = new RegisterEndpoint(
      this.typeField.value,
      this.nameField.value,
      this.urlField.value,
      !!this.skipSllField.value
    );

    this.store.dispatch(action);

    const update$ = this.store.select(
      this.getUpdateSelector(action.guid())
    ).pipe(filter(update => !!update));

    return update$.pipe(pairwise(),
      filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
      map(([oldVal, newVal]) => newVal),
      map(result => {
        if (!result.error) {
          this.store.dispatch(new RouterNav({ path: ['endpoints'] }));
        } else {
          // Snackbar
          this.snackBarRef = this.snackBar.open(result.message, 'Dismiss');
        }
        return {
          success: !result.error
        };
      }),);
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
  }
}
