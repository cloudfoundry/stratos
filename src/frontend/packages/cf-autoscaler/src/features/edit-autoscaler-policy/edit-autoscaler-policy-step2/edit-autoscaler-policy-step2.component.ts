import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Observable } from 'rxjs';

import { ApplicationService } from '../../../../../cloud-foundry/src/features/applications/application.service';
import {
  AutoscalerConstants,
  getAdjustmentType,
  getScaleType,
  PolicyAlert,
} from '../../../core/autoscaler-helpers/autoscaler-util';
import {
  getThresholdMax,
  getThresholdMin,
  numberWithFractionOrExceedRange,
} from '../../../core/autoscaler-helpers/autoscaler-validation';
import {
  AppAutoscalerInvalidPolicyError,
  AppAutoscalerPolicy,
  AppAutoscalerPolicyLocal,
} from '../../../store/app-autoscaler.types';
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
  metricTypes = AutoscalerConstants.MetricTypes;
  operatorTypes = AutoscalerConstants.UpperOperators.concat(AutoscalerConstants.LowerOperators);
  editTriggerForm: FormGroup;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  public currentPolicy: AppAutoscalerPolicyLocal;
  public testing = false;
  private editIndex = -1;
  private editMetricType = '';
  private editScaleType = 'upper';
  private editAdjustmentType = 'value';

  constructor(
    public applicationService: ApplicationService,
    private fb: FormBuilder,
    service: EditAutoscalerPolicyService
  ) {
    super(service);
    this.editTriggerForm = this.fb.group({
      metric_type: [0, this.validateTriggerMetricType()],
      operator: [0, this.validateTriggerOperator()],
      threshold: [0, [Validators.required, Validators.min(1), this.validateTriggerThreshold()]],
      adjustment: [0, [Validators.required, Validators.min(1), this.validateTriggerAdjustment()]],
      breach_duration_secs: [0, [
        Validators.min(AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_min),
        Validators.max(AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_max)
      ]],
      cool_down_secs: [0, [
        Validators.min(AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_min),
        Validators.max(AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_max)
      ]],
      adjustment_type: [0, this.validateTriggerAdjustmentType()]
    });
  }

  addTrigger = () => {
    const { ...newTrigger } = AutoscalerConstants.PolicyDefaultTrigger;
    this.currentPolicy.scaling_rules_form.push(newTrigger);
    this.editTrigger(this.currentPolicy.scaling_rules_form.length - 1);
  }

  removeTrigger(index: number) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    this.currentPolicy.scaling_rules_form.splice(index, 1);
  }

  editTrigger(index: number) {
    this.editIndex = index;
    this.editMetricType = this.currentPolicy.scaling_rules_form[index].metric_type;
    this.editScaleType = getScaleType(this.currentPolicy.scaling_rules_form[index].operator);
    this.editAdjustmentType = getAdjustmentType(this.currentPolicy.scaling_rules_form[index].adjustment);
    this.editTriggerForm.setValue({
      metric_type: this.editMetricType,
      operator: this.currentPolicy.scaling_rules_form[index].operator,
      threshold: this.currentPolicy.scaling_rules_form[index].threshold,
      adjustment: Math.abs(Number(this.currentPolicy.scaling_rules_form[index].adjustment)),
      breach_duration_secs: this.currentPolicy.scaling_rules_form[index].breach_duration_secs,
      cool_down_secs: this.currentPolicy.scaling_rules_form[index].cool_down_secs,
      adjustment_type: this.editAdjustmentType
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
      this.currentPolicy.scaling_rules_form[this.editIndex].breach_duration_secs =
        AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_default;
    }
    if (this.editTriggerForm.get('cool_down_secs').value) {
      this.currentPolicy.scaling_rules_form[this.editIndex].cool_down_secs = this.editTriggerForm.get('cool_down_secs').value;
    } else {
      this.currentPolicy.scaling_rules_form[this.editIndex].cool_down_secs =
        AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_default;
    }
    this.editIndex = -1;
  }

  validateTriggerMetricType(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editTriggerForm) {
        this.editMetricType = control.value;
        this.editTriggerForm.controls.threshold.updateValueAndValidity();
      }
      return null;
    };
  }

  validateTriggerOperator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editTriggerForm) {
        this.editScaleType = getScaleType(control.value);
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
      const errors: AppAutoscalerInvalidPolicyError = {};
      if (AutoscalerConstants.MetricPercentageTypes.indexOf(this.editMetricType) >= 0) {
        if (numberWithFractionOrExceedRange(control.value, 1, 100, true)) {
          errors.alertInvalidPolicyTriggerThreshold100 = { value: control.value };
        }
      }
      const thresholdMin = getThresholdMin(this.currentPolicy.scaling_rules_form, this.editMetricType, this.editScaleType, this.editIndex);
      const thresholdMax = getThresholdMax(this.currentPolicy.scaling_rules_form, this.editMetricType, this.editScaleType, this.editIndex);
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
      const errors: AppAutoscalerInvalidPolicyError = {};
      const max = this.editAdjustmentType === 'value' ? this.currentPolicy.instance_max_count - 1 : Number.MAX_VALUE;
      if (numberWithFractionOrExceedRange(control.value, 1, max, true)) {
        errors.alertInvalidPolicyTriggerStepRange = {};
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateTriggerAdjustmentType(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editTriggerForm) {
        this.editAdjustmentType = control.value;
        this.editTriggerForm.controls.adjustment.updateValueAndValidity();
      }
      return null;
    };
  }

  getMetricUnit(metricType: string) {
    return AutoscalerConstants.getMetricUnit(metricType);
  }
}
