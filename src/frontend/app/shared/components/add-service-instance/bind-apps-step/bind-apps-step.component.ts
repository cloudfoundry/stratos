import { AfterContentInit, Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

import { IServicePlan } from '../../../../core/cf-api-svc.types';
import { IApp } from '../../../../core/cf-api.types';
import { pathGet } from '../../../../core/utils.service';
import { safeUnsubscribe } from '../../../../features/service-catalog/services-helper';
import { SetCreateServiceInstanceApp } from '../../../../store/actions/create-service-instance.actions';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { SchemaFormConfig } from '../../schema-form/schema-form.component';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { testSelectedServicePlan, testServiceBindingData } from '../specify-details-step/specify-details-step.component';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})
export class BindAppsStepComponent implements OnDestroy, AfterContentInit {

  @Input()
  boundAppId: string;

  validateSubscription: Subscription;
  validate = new BehaviorSubject<boolean>(false);
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  apps$: Observable<APIResource<IApp>[]>;
  guideText = 'Specify the application to bind (Optional)';
  selectedServicePlan: APIResource<IServicePlan>;
  bindingParams: object = {};
  schemaFormConfig: SchemaFormConfig;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.stepperForm = new FormGroup({
      apps: new FormControl(''),
    });
  }

  private setBoundApp() {
    if (this.boundAppId) {
      this.stepperForm.controls.apps.setValue(this.boundAppId);
      this.stepperForm.controls.apps.disable();
      this.guideText = 'Specify binding params (optional)';
    }
  }

  ngAfterContentInit() {
    this.apps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      switchMap(createServiceInstance => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, createServiceInstance.spaceGuid);
        return getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(createServiceInstance.cfGuid, createServiceInstance.spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$;
      }));
    this.setBoundApp();
  }

  onEnter = (selectedServicePlan: APIResource<IServicePlan>) => {
    // TODO: RC Remove
    selectedServicePlan = testSelectedServicePlan;

    this.validateSubscription = this.stepperForm.controls['apps'].valueChanges.subscribe(app => {
      if (!app) {
        // If there's no app selected the step will always be valid
        this.validate.next(true);
      }
    });

    this.selectedServicePlan = selectedServicePlan;
    this.schemaFormConfig = {
      schema: pathGet('entity.schemas.service_binding.create.parameters', selectedServicePlan),
      // TODO: RC Remove
      initialData: testServiceBindingData
    };
  }

  setBindingParams(data) {
    this.bindingParams = data;
  }

  setParamValid(valid: boolean) {
    this.validate.next(valid);
  }

  submit = (): Observable<StepOnNextResult> => {
    this.setApp();
    return observableOf({
      success: true,
      data: this.selectedServicePlan
    });
  }

  setApp = () => this.store.dispatch(
    new SetCreateServiceInstanceApp(this.stepperForm.controls.apps.value, this.bindingParams)
  )

  ngOnDestroy(): void {
    safeUnsubscribe(this.validateSubscription);
  }

}



