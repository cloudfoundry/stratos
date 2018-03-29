/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import { denormalize } from 'normalizr';
import { Observable } from 'rxjs/Observable';
import { map, withLatestFrom } from 'rxjs/operators';

import { UtilsService } from '../../../../core/utils.service';
import { IStepperStep, StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { GetAllEndpoints, RegisterEndpoint } from '../../../../store/actions/endpoint.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { EndpointsEffect } from '../../../../store/effects/endpoint.effects';
import { getFullEndpointApiUrl, getEndpointTypes } from '../../endpoint-helpers';
import { getAPIRequestDataState, selectUpdateInfo } from '../../../../store/selectors/api.selectors';
import { selectPaginationState } from '../../../../store/selectors/pagination.selectors';
import { endpointStoreNames } from '../../../../store/types/endpoint.types';
import { entityFactory } from '../../../../store/helpers/entity-factory';
import { endpointSchemaKey } from '../../../../store/helpers/entity-factory';

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

  endpointTypes = getEndpointTypes();

  constructor(private store: Store<AppState>, public utilsService: UtilsService) {

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
  }

  ngOnInit() { }

  onNext: StepOnNextFunction = () => {
    const action = new RegisterEndpoint(
      this.typeField.value,
      this.nameField.value,
      this.urlField.value,
      !!this.skipSllField.value
    );

    this.store.dispatch(action);

    const update$ = this.store.select(
      this.getUpdateSelector(action.guid())
    ).filter(update => !!update);

    return update$.pairwise()
      .filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy))
      .map(([oldVal, newVal]) => newVal)
      .map(result => {
        if (!result.error) {
          this.store.dispatch(new RouterNav({ path: ['endpoints'] }));
        }
        return {
          success: !result.error
        };
      });
  }

  private getUpdateSelector(guid) {
    return selectUpdateInfo(
      endpointStoreNames.type,
      guid,
      EndpointsEffect.registeringKey,
    );
  }

  ngAfterContentInit() {
    this.validate = this.form.statusChanges
      .map(() => {
        return this.form.valid;
      });
  }
}
