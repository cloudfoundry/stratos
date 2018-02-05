/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';
import { Component, OnInit, ViewChild, AfterContentInit } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CNSISModel, CNSISState, cnsisStoreNames } from '../../../../store/types/cnsis.types';
import { UtilsService } from '../../../../core/utils.service';
import { StepOnNextFunction, IStepperStep } from '../../../../shared/components/stepper/step/step.component';
import { cnsisEntitiesSelector } from '../../../../store/selectors/cnsis.selectors';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { RegisterCnis, GetAllCNSIS, EndpointSchema } from '../../../../store/actions/cnsis.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { selectEntity, selectUpdateInfo, selectRequestInfo, getAPIRequestDataState } from '../../../../store/selectors/api.selectors';
import { CNSISEffect } from '../../../../store/effects/cnsis.effects';
import { shareReplay, withLatestFrom, map } from 'rxjs/operators';
import { tag } from 'rxjs-spy/operator/tag';
import { selectPaginationState } from '../../../../store/selectors/pagination.selectors';
import { EndpointsDataSource } from '../../../../shared/data-sources/endpoints-data-source';
import { denormalize } from 'normalizr';

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements OnInit, IStepperStep, AfterContentInit {

  existingEndpoints: Observable<{
    names: string[],
    urls:  string[],
  }>;

  validate: Observable<boolean>;

  @ViewChild('form') form: NgForm;
  @ViewChild('nameField') nameField: NgModel;
  @ViewChild('urlField') urlField: NgModel;
  @ViewChild('skipSllField') skipSllField: NgModel;

  constructor(private store: Store<AppState>, public utilsService: UtilsService) {

    this.existingEndpoints = store.select(selectPaginationState(cnsisStoreNames.type, GetAllCNSIS.storeKey))
    .pipe(
      withLatestFrom(store.select(getAPIRequestDataState)),
      map(([pagination, entities]) => {
        const pages = Object.values(pagination.ids);
        const page = [].concat.apply([], pages);
        const endpoints = page.length ? denormalize(page, [EndpointSchema], entities) : [];
        return {
          names: endpoints.map(ep => ep.name),
          urls: endpoints.map(ep => `${ep.api_endpoint.Scheme}://${ep.api_endpoint.Host}`),
        }
      })
    );
  }

  ngOnInit() {}

  onNext: StepOnNextFunction = () => {
    const action = new RegisterCnis(
      this.nameField.value,
      this.urlField.value,
      !!this.skipSllField.value
    );
    
    this.store.dispatch(action);

    // const entityRequestSelect$ = this.store.select(selectRequestInfo(cnsisStoreNames.type, action.guid())).pipe(
    //   shareReplay(1),
    // );
    
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
      }
    });
  }

  private getUpdateSelector(guid) {
    return selectUpdateInfo(
      cnsisStoreNames.type,
      guid,
      CNSISEffect.registeringKey,
    );
  }

  ngAfterContentInit() {
    this.validate = this.form.statusChanges
      .map(() => {
        return this.form.valid;
      });
  }
}