import { AfterContentInit, Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';

import { SetCreateServiceInstanceApp } from '../../../../../../cloud-foundry/src/actions/create-service-instance.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { pathGet, safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { StepOnNextResult } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServicePlan } from '../../../../cf-api-svc.types';
import { IApp } from '../../../../cf-api.types';
import { SchemaFormConfig } from '../../schema-form/schema-form.component';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})
export class BindAppsStepComponent implements OnDestroy, AfterContentInit {

  @Input()
  boundAppId: string;

  @Input()
  apps$: Observable<APIResource<IApp>[]>;

  validateSubscription: Subscription;
  validate = new BehaviorSubject<boolean>(true);
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  guideText = 'Specify the application to bind (Optional)';
  selectedServicePlan: APIResource<IServicePlan>;
  bindingParams: object = {};
  schemaFormConfig: SchemaFormConfig;

  constructor(
    private store: Store<CFAppState>,
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
    this.setBoundApp();
  }

  onEnter = (selectedServicePlan: APIResource<IServicePlan>) => {
    if (selectedServicePlan) {
      // Don't overwrite if it's null (we've returned to this step from the next)
      this.selectedServicePlan = selectedServicePlan;
    }

    // Start
    this.validateSubscription = this.stepperForm.controls.apps.valueChanges.subscribe(app => {
      if (!app) {
        // If there's no app selected the step will always be valid
        this.validate.next(true);
      }
    });

    if (!this.schemaFormConfig) {
      // Create new config
      this.schemaFormConfig = {
        schema: pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan),
      };
    } else {
      // Update existing config (retaining any existing config)
      this.schemaFormConfig = {
        ...this.schemaFormConfig,
        initialData: this.bindingParams,
        schema: pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan)
      };
    }

  }

  setBindingParams(data) {
    this.bindingParams = data;
  }

  setParamValid(valid: boolean) {
    this.validate.next(valid);
  }

  submit = (): Observable<StepOnNextResult> => {
    this.store.dispatch(new SetCreateServiceInstanceApp(this.stepperForm.controls.apps.value, this.bindingParams));
    return observableOf({
      success: true,
      data: this.selectedServicePlan
    });
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.validateSubscription);
  }

}
