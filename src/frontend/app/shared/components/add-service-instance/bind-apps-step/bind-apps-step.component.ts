import { AfterContentInit, Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, first, map, switchMap, tap } from 'rxjs/operators';

import { IApp } from '../../../../core/cf-api.types';
import { appDataSort } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { SetCreateServiceInstanceApp } from '../../../../store/actions/create-service-instance.actions';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { CsiGuidsService } from '../csi-guids.service';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';
import { safeUnsubscribe } from '../../../../features/service-catalog/services-helper';
import { JsonPointer } from 'angular2-json-schema-form';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})
export class BindAppsStepComponent implements OnDestroy, AfterContentInit {

  @Input('boundAppId')
  boundAppId: string;

  validateSubscription: Subscription;
  validate = new BehaviorSubject(true);
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  apps$: Observable<APIResource<IApp>[]>;
  guideText = 'Specify the application to bind (Optional)';

  selectedFramework = 'material-design';
  schema: any;
  showJsonSchema: boolean;
  jsonFormOptions: any = { addSubmit: false };
  selectedServiceSubscription: Subscription;
  formValidationErrors: any;
  selectedService$: any;
  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.stepperForm = new FormGroup({
      apps: new FormControl(''),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
    });
  }

  private setBoundApp() {
    if (this.boundAppId) {
      this.stepperForm.controls.apps.setValue(this.boundAppId);
      this.stepperForm.controls.apps.disable();
      this.guideText = 'Specify binding params (optional)';
    }
  }

  onFormChange(jsonData) {
    if (!!jsonData) {
      const stringData = JSON.stringify(jsonData);
      this.stepperForm.get('params').setValue(stringData);
    }
  }

  validationErrors(data: any): void {
    this.formValidationErrors = data;
  }

  get prettyValidationErrors() {
    if (!this.formValidationErrors) { return null; }
    const errorArray = [];
    for (const error of this.formValidationErrors) {
      const message = error.message;
      const dataPathArray = JsonPointer.parse(error.dataPath);
      if (dataPathArray.length) {
        let field = dataPathArray[0];
        for (let i = 1; i < dataPathArray.length; i++) {
          const key = dataPathArray[i];
          field += /^\d+$/.test(key) ? `[${key}]` : `.${key}`;
        }
        errorArray.push(`${field}: ${message}`);
      } else {
        errorArray.push(message);
      }
    }
    return errorArray.join('<br>');
  }

  ngAfterContentInit() {
    this.validateSubscription = this.stepperForm.statusChanges.pipe(
      map(() => {
        if (this.stepperForm.pristine) {
          setTimeout(() => this.validate.next(true));
        }
        setTimeout(() => this.validate.next(this.stepperForm.valid));
      })
    ).subscribe();


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

  onEnter = (selectedService$?) => {
    this.selectedService$ = selectedService$;
    if (selectedService$ instanceof Observable) {
      this.selectedServiceSubscription = selectedService$
        .subscribe(selectedService => {
          this.schema = this.filterSchema(selectedService.entity.entity.schemas.service_binding.create.parameters);
        });
    }
  }

  private filterSchema = (schema: any): any => {
    return Object.keys(schema).reduce((obj, key) => {
      if (key !== '$schema') { obj[key] = schema[key]; }
      return obj;
    }, {});
  }

  submit = (): Observable<StepOnNextResult> => {
    this.setApp();
    return observableOf({ success: true, data: this.selectedService$ });
  }

  setApp = () => this.store.dispatch(
    new SetCreateServiceInstanceApp(this.stepperForm.controls.apps.value, this.stepperForm.controls.params.value)
  )

  ngOnDestroy(): void {
    this.validateSubscription.unsubscribe();
    safeUnsubscribe(this.selectedServiceSubscription);
  }

}
