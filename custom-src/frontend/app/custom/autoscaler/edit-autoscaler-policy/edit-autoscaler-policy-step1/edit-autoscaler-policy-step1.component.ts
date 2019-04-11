import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { map} from 'rxjs/operators';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { ApplicationService } from '../../../../features/applications/application.service';
import { EntityService } from '../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey
} from '../../../../../../store/src/helpers/entity-factory';
import {
  GetAppAutoscalerPolicyAction,
  UpdateAppAutoscalerPolicyStepAction
} from '../../app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../app-autoscaler.types';
import { PolicyDefault, PolicyAlert } from '../../autoscaler-helpers/autoscaler-util';
import { autoscalerTransformArrayToMap } from '../../autoscaler-helpers/autoscaler-transform-policy';
import { numberWithFractionOrExceedRange } from '../../autoscaler-helpers/autoscaler-validation';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-edit-autoscaler-policy-step1',
  templateUrl: './edit-autoscaler-policy-step1.component.html',
  styleUrls: ['./edit-autoscaler-policy-step1.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep1Component implements OnInit, OnDestroy {

  policyAlert = PolicyAlert;
  timezoneOptions = moment.tz.names();
  editLimitForm: FormGroup;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  private editLimitValid = true;
  private appAutoscalerPolicyErrorSub: Subscription;
  private appAutoscalerPolicyService: EntityService;
  private currentPolicy: any;

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.editLimitForm = this.fb.group({
      instance_min_count: [0, [Validators.required, this.validateGlobalLimitMin()]],
      instance_max_count: [0, [Validators.required, this.validateGlobalLimitMax()]],
      timezone: [0, [Validators.required]]
    });
  }

  ngOnInit() {
    this.appAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid),
      false
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      map(({ entity }) => {
        if (entity && entity.entity) {
          this.currentPolicy = entity.entity;
        } else {
          this.currentPolicy = PolicyDefault;
        }
        if (!this.currentPolicy.scaling_rules_form) {
          this.currentPolicy = autoscalerTransformArrayToMap(this.currentPolicy);
        }
        this.editLimitForm.controls.timezone.setValue(this.currentPolicy.schedules.timezone);
        this.editLimitForm.controls.instance_min_count.setValue(this.currentPolicy.instance_min_count);
        this.editLimitForm.controls.instance_max_count.setValue(this.currentPolicy.instance_max_count);
        this.editLimitForm.controls.instance_min_count.setValidators([Validators.required, this.validateGlobalLimitMin()]);
        this.editLimitForm.controls.instance_max_count.setValidators([Validators.required, this.validateGlobalLimitMax()]);
        return this.currentPolicy;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.appAutoscalerPolicyErrorSub) {
      this.appAutoscalerPolicyErrorSub.unsubscribe();
    }
  }

  finishLimit: StepOnNextFunction = () => {
    this.currentPolicy.instance_min_count = Math.floor(this.editLimitForm.get('instance_min_count').value);
    this.currentPolicy.instance_max_count = Math.floor(this.editLimitForm.get('instance_max_count').value);
    this.currentPolicy.schedules.timezone = this.editLimitForm.get('timezone').value;
    this.store.dispatch(new UpdateAppAutoscalerPolicyStepAction(this.currentPolicy));
    return observableOf({ success: true });
  }

  validateGlobalLimitMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      let invalid = false;
      if (this.editLimitForm) {
        invalid = numberWithFractionOrExceedRange(control.value, 1, this.editLimitForm.get('instance_max_count').value - 1, true);
      }
      const lastValid = this.editLimitValid;
      this.editLimitValid = this.editLimitForm && control.value < this.editLimitForm.get('instance_max_count').value;
      if (this.editLimitForm && this.editLimitValid !== lastValid) {
        this.editLimitForm.controls.instance_max_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
    };
  }

  validateGlobalLimitMax(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      let invalid = false;
      if (this.editLimitForm) {
        invalid = numberWithFractionOrExceedRange(control.value,
          this.editLimitForm.get('instance_min_count').value + 1, Number.MAX_VALUE, true);
      }
      const lastValid = this.editLimitValid;
      this.editLimitValid = this.editLimitForm && this.editLimitForm.get('instance_min_count').value < control.value;
      if (this.editLimitForm && this.editLimitValid !== lastValid) {
        this.editLimitForm.controls.instance_min_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMaximumRange: { value: control.value } } : null;
    };
  }
}
