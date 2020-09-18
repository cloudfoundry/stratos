import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ApplicationService } from '../../../../../cloud-foundry/src/features/applications/application.service';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import {
  AutoscalerConstants,
  getAdjustmentType,
  getScaleType,
  PolicyAlert,
} from '../../../core/autoscaler-helpers/autoscaler-util';
import {
  getThresholdMax,
  getThresholdMin,
  inValidMetricType,
  numberWithFractionOrExceedRange,
} from '../../../core/autoscaler-helpers/autoscaler-validation';
import { AppAutoscalerInvalidPolicyError, AppAutoscalerPolicyLocal } from '../../../store/app-autoscaler.types';
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
export class EditAutoscalerPolicyStep2Component extends EditAutoscalerPolicy implements OnInit, OnDestroy {

  policyAlert = PolicyAlert;
  metricTypes = AutoscalerConstants.MetricTypes;
  filteredMetricTypes$: Observable<string[]>;
  private metricUnitSubject = new BehaviorSubject(this.metricTypes[0]);
  metricUnit$: Observable<string>;
  operatorTypes = AutoscalerConstants.UpperOperators.concat(AutoscalerConstants.LowerOperators);
  editTriggerForm: FormGroup;
  // appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  public currentPolicy: AppAutoscalerPolicyLocal;
  public testing = false;
  private editIndex = -1;
  private editMetricType = '';
  private editScaleType = 'upper';
  private editAdjustmentType = 'value';
  private subs: Subscription[] = [];

  constructor(
    public applicationService: ApplicationService,
    private fb: FormBuilder,
    service: EditAutoscalerPolicyService,
    route: ActivatedRoute
  ) {
    super(service, route);
    this.editTriggerForm = this.fb.group({
      metric_type: [0, [Validators.required, this.validateTriggerMetricType()]],
      operator: [0, this.validateTriggerOperator()],
      threshold: [0, [Validators.required, Validators.min(1), this.validateTriggerThreshold()]],
      unit: [0],
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

    this.metricUnit$ = this.metricUnitSubject.asObservable();

    this.subs.push(this.editTriggerForm.get('metric_type').valueChanges.pipe(
      map(value => this.getMetricUnit(value)),
    ).subscribe(unit => this.metricUnitSubject.next(unit)));

    this.filteredMetricTypes$ = this.editTriggerForm.controls.metric_type.valueChanges.pipe(
      startWith(''),
      map(value => this.metricTypes.filter(type => type.toLocaleLowerCase().includes(value)))
    )
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
      unit: this.currentPolicy.scaling_rules_form[index].unit || '',
      adjustment: Math.abs(Number(this.currentPolicy.scaling_rules_form[index].adjustment)),
      breach_duration_secs: this.currentPolicy.scaling_rules_form[index].breach_duration_secs,
      cool_down_secs: this.currentPolicy.scaling_rules_form[index].cool_down_secs,
      adjustment_type: this.editAdjustmentType
    });
    this.metricUnitSubject.next(this.getMetricUnit(this.editMetricType));
  }

  finishTrigger() {
    const adjustmentP = this.editTriggerForm.get('adjustment_type').value === 'value' ? '' : '%';
    const adjustmentI = this.editTriggerForm.get('adjustment').value;
    const adjustmentM = this.editScaleType === 'upper' ? `+${adjustmentI}${adjustmentP}` : `-${adjustmentI}${adjustmentP}`;
    this.currentPolicy.scaling_rules_form[this.editIndex].metric_type = this.editTriggerForm.get('metric_type').value;
    this.currentPolicy.scaling_rules_form[this.editIndex].operator = this.editTriggerForm.get('operator').value;
    this.currentPolicy.scaling_rules_form[this.editIndex].threshold = this.editTriggerForm.get('threshold').value;
    this.currentPolicy.scaling_rules_form[this.editIndex].unit = this.editTriggerForm.get('unit').value;
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
      if (!this.editTriggerForm) {
        return null;
      }
      this.editMetricType = control.value;
      const errors: AppAutoscalerInvalidPolicyError = {};
      if (inValidMetricType(control.value)) {
        errors.alertInvalidPolicyTriggerMetricName = { value: control.value };
      }
      this.editTriggerForm.controls.threshold.updateValueAndValidity();
      return Object.keys(errors).length === 0 ? null : errors;
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

  getMetricUnit(metricType: string, unit?: string) {
    return AutoscalerConstants.getMetricUnit(metricType, unit);
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }
}
