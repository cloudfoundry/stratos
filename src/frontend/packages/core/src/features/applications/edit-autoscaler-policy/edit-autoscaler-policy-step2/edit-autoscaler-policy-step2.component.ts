import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { ApplicationService } from '../../application.service';
import {
  UpperOperators,
  LowerOperators,
  PolicyDefaultSetting,
  MetricTypes,
  getScaleType,
  getAdjustmentType,
  PolicyAlert
} from '../../../../../../store/src/helpers/autoscaler/autoscaler-util';
import {
  numberWithFractionOrExceedRange,
  getThresholdMin,
  getThresholdMax
} from '../../../../../../store/src/helpers/autoscaler/autoscaler-validation';
import { selectUpdateAutoscalerPolicyState } from '../../../../../../store/src/effects/autoscaler.effects';
import { UpdateAppAutoscalerPolicyStepAction } from '../../../../../../store/src/actions/app-autoscaler.actions';

@Component({
  selector: 'app-edit-autoscaler-policy-step2',
  templateUrl: './edit-autoscaler-policy-step2.component.html',
  styleUrls: ['./edit-autoscaler-policy-step2.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep2Component implements OnInit {

  policyAlert = PolicyAlert;
  metricTypes = MetricTypes;
  operatorTypes = UpperOperators.concat(LowerOperators);
  editTriggerForm: FormGroup;
  appAutoscalerPolicy$: Observable<any>;

  public currentPolicy: any;
  private editIndex = -1;
  private editScaleType = 'upper';
  private editAdjustmentType = 'value';

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
  ) {
    this.editTriggerForm = this.fb.group({
      metric_type: [0, this.validateTriggerMetricType()],
      operator: [0, this.validateTriggerOperator()],
      threshold: [0, [Validators.required, Validators.min(1), this.validateTriggerThreshold()]],
      adjustment: [0, [Validators.required, Validators.min(1), this.validateTriggerAdjustment()]],
      breach_duration_secs: [0, [
        Validators.min(PolicyDefaultSetting.breach_duration_secs_min),
        Validators.max(PolicyDefaultSetting.breach_duration_secs_max)
      ]],
      cool_down_secs: [0, [
        Validators.min(PolicyDefaultSetting.cool_down_secs_min),
        Validators.max(PolicyDefaultSetting.cool_down_secs_max)
      ]],
      adjustment_type: [0]
    });
  }

  ngOnInit() {
    this.appAutoscalerPolicy$ = this.store.select(selectUpdateAutoscalerPolicyState).pipe(
      filter(state => true),
      map(state => {
        this.currentPolicy = state.policy;
        return this.currentPolicy;
      })
    );
  }

  addTrigger = () => {
    this.currentPolicy.scaling_rules_form.push({
      metric_type: 'memoryused',
      breach_duration_secs: PolicyDefaultSetting.breach_duration_secs_default,
      threshold: 10,
      operator: '<=',
      cool_down_secs: PolicyDefaultSetting.cool_down_secs_default,
      adjustment: '-1'
    });
    this.editTrigger(this.currentPolicy.scaling_rules_form.length - 1);
  }

  removeTrigger(index) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    this.currentPolicy.scaling_rules_form.splice(index, 1);
  }

  editTrigger(index) {
    this.editIndex = index;
    this.editScaleType = getScaleType(this.currentPolicy.scaling_rules_form[index].operator);
    this.editAdjustmentType = getAdjustmentType(this.currentPolicy.scaling_rules_form[index].adjustment);
    this.editTriggerForm.setValue({
      metric_type: this.currentPolicy.scaling_rules_form[index].metric_type,
      operator: this.currentPolicy.scaling_rules_form[index].operator,
      threshold: this.currentPolicy.scaling_rules_form[index].threshold,
      adjustment: Math.abs(Number(this.currentPolicy.scaling_rules_form[index].adjustment)),
      breach_duration_secs: this.currentPolicy.scaling_rules_form[index].breach_duration_secs,
      cool_down_secs: this.currentPolicy.scaling_rules_form[index].cool_down_secs,
      adjustment_type: this.currentPolicy.scaling_rules_form[index].adjustment.indexOf('%') >= 0 ? 'percentage' : 'value'
    });
  }

  finishTrigger: StepOnNextFunction = () => {
    if (this.editIndex !== -1) {
      const adjustmentp = this.editTriggerForm.get('adjustment_type').value === 'value' ? '' : '%';
      const adjustmenti = this.editTriggerForm.get('adjustment').value;
      const adjustmentm = this.editScaleType === 'upper' ? `+${adjustmenti}${adjustmentp}` : `-${adjustmenti}${adjustmentp}`;
      this.currentPolicy.scaling_rules_form[this.editIndex].metric_type = this.editTriggerForm.get('metric_type').value;
      this.currentPolicy.scaling_rules_form[this.editIndex].operator = this.editTriggerForm.get('operator').value;
      this.currentPolicy.scaling_rules_form[this.editIndex].threshold = this.editTriggerForm.get('threshold').value;
      this.currentPolicy.scaling_rules_form[this.editIndex].adjustment = adjustmentm;
      if (this.editTriggerForm.get('breach_duration_secs').value) {
        this.currentPolicy.scaling_rules_form[this.editIndex].breach_duration_secs =
          this.editTriggerForm.get('breach_duration_secs').value;
      } else {
        this.currentPolicy.scaling_rules_form[this.editIndex].breach_duration_secs = PolicyDefaultSetting.breach_duration_secs_default;
      }
      if (this.editTriggerForm.get('cool_down_secs').value) {
        this.currentPolicy.scaling_rules_form[this.editIndex].cool_down_secs = this.editTriggerForm.get('cool_down_secs').value;
      } else {
        this.currentPolicy.scaling_rules_form[this.editIndex].cool_down_secs = PolicyDefaultSetting.cool_down_secs_default;
      }
      this.editIndex = -1;
    }
    this.store.dispatch(new UpdateAppAutoscalerPolicyStepAction(this.currentPolicy));
    return observableOf({ success: true });
  }

  validateTriggerMetricType(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editTriggerForm) {
        this.editTriggerForm.controls.threshold.updateValueAndValidity();
      }
      return null;
    };
  }

  validateTriggerOperator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editTriggerForm) {
        this.editScaleType = getScaleType(this.editTriggerForm.get('operator').value);
        this.editTriggerForm.controls.threshold.updateValueAndValidity();
      }
      return null;
    };
  }

  validateTriggerThreshold(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.editTriggerForm) {
        return null;
      }
      const metricType = this.editTriggerForm.get('metric_type').value;
      this.editAdjustmentType = this.editTriggerForm.get('adjustment_type').value;
      const errors: any = {};
      if (metricType === 'memoryutil') {
        if (numberWithFractionOrExceedRange(control.value, 1, 100, true)) {
          errors.alertInvalidPolicyTriggerThreshold100 = { value: control.value };
        }
      }
      const thresholdMin = getThresholdMin(this.currentPolicy.scaling_rules_form, metricType, this.editScaleType, this.editIndex);
      const thresholdMax = getThresholdMax(this.currentPolicy.scaling_rules_form, metricType, this.editScaleType, this.editIndex);
      if (numberWithFractionOrExceedRange(control.value, thresholdMin, thresholdMax, true)) {
        errors.alertInvalidPolicyTriggerThresholdRange = { value: control.value };
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateTriggerAdjustment(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.editTriggerForm) {
        return null;
      }
      this.editAdjustmentType = this.editTriggerForm.get('adjustment_type').value;
      const errors: any = {};
      const max = this.editAdjustmentType === 'value' ? this.currentPolicy.instance_max_count - 1 : Number.MAX_VALUE;
      if (numberWithFractionOrExceedRange(control.value, 1, max, true)) {
        errors.alertInvalidPolicyTriggerStepRange = {};
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }
}
