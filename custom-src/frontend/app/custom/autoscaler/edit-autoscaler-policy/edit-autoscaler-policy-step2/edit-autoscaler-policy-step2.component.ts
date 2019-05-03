import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Observable } from 'rxjs';

import { cloneObject } from '../../../../core/utils.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { AppAutoscalerPolicy, AppAutoscalerPolicyLocal } from '../../app-autoscaler.types';
import {
  getAdjustmentType,
  getScaleType,
  LowerOperators,
  MetricPercentageTypes,
  MetricTypes,
  PolicyAlert,
  PolicyDefaultSetting,
  PolicyDefaultTrigger,
  UpperOperators,
} from '../../autoscaler-helpers/autoscaler-util';
import {
  getThresholdMax,
  getThresholdMin,
  numberWithFractionOrExceedRange,
} from '../../autoscaler-helpers/autoscaler-validation';
import { EditAutoscalerPolicy } from '../edit-autoscaler-policy-base-step';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';

@Component({
  selector: 'app-edit-autoscaler-policy-step2',
  templateUrl: './edit-autoscaler-policy-step2.component.html',
  styleUrls: ['./edit-autoscaler-policy-step2.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep2Component extends EditAutoscalerPolicy implements OnInit {

  policyAlert = PolicyAlert;
  metricTypes = MetricTypes;
  operatorTypes = UpperOperators.concat(LowerOperators);
  editTriggerForm: FormGroup;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  public currentPolicy: AppAutoscalerPolicyLocal;
  public testing = false;
  private editIndex = -1;
  private editScaleType = 'upper';
  private editAdjustmentType = 'value';

  constructor(
    public applicationService: ApplicationService,
    private fb: FormBuilder,
    service: EditAutoscalerPolicyService
  ) {
    super(service)
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

  addTrigger = () => {
    this.currentPolicy.scaling_rules_form.push(cloneObject(PolicyDefaultTrigger));
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

  finishTrigger() {
    const adjustmentP = this.editTriggerForm.get('adjustment_type').value === 'value' ? '' : '%';
    const adjustmentI = this.editTriggerForm.get('adjustment').value;
    const adjustmentM = this.editScaleType === 'upper' ? `+${adjustmentI}${adjustmentP}` : `-${adjustmentI}${adjustmentP}`;
    this.currentPolicy.scaling_rules_form[this.editIndex].metric_type = this.editTriggerForm.get('metric_type').value;
    this.currentPolicy.scaling_rules_form[this.editIndex].operator = this.editTriggerForm.get('operator').value;
    this.currentPolicy.scaling_rules_form[this.editIndex].threshold = this.editTriggerForm.get('threshold').value;
    this.currentPolicy.scaling_rules_form[this.editIndex].adjustment = adjustmentM;
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
      if (MetricPercentageTypes.indexOf(metricType) >= 0) {
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
