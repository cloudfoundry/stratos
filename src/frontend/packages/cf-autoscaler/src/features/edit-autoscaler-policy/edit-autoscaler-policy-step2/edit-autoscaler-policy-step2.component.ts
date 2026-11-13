import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TailwindErrorStateMatcher, TailwindShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { TileGridComponent, TileGroupComponent, TileComponent } from '@stratosui/core';
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
import { EditAutoscalerPolicyDirective } from '../edit-autoscaler-policy-base-step';

interface EditTriggerForm {
  metric_type: FormControl<string>;
  operator: FormControl<string>;
  threshold: FormControl<number>;
  adjustment: FormControl<number>;
  breach_duration_secs: FormControl<number>;
  cool_down_secs: FormControl<number>;
  adjustment_type: FormControl<string>;
}

@Component({
  selector: 'app-edit-autoscaler-policy-step2',
  templateUrl: './edit-autoscaler-policy-step2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: TailwindErrorStateMatcher, useClass: TailwindShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent
  ]
})
export class EditAutoscalerPolicyStep2Component extends EditAutoscalerPolicyDirective implements OnInit {
  applicationService = inject(ApplicationService);
  private fb = inject(FormBuilder);


  policyAlert = PolicyAlert;
  metricTypes = AutoscalerConstants.MetricTypes;
  filteredMetricTypes$: Observable<string[]>;
  operatorTypes = AutoscalerConstants.UpperOperators.concat(AutoscalerConstants.LowerOperators);
  editTriggerForm: FormGroup<EditTriggerForm>;
  // appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  public declare currentPolicy: AppAutoscalerPolicyLocal;
  public testing = false;
  // Index of the row being edited, -1 when none. The parent reads it to gate
  // Next and Previous.
  readonly editIndex = signal(-1);
  protected editMetricType = '';
  protected editScaleType = 'upper';
  protected editAdjustmentType = 'value';

  constructor() {
    super();
    this.editTriggerForm = this.fb.group<EditTriggerForm>({
      metric_type: this.fb.control('', { validators: [Validators.required, this.validateTriggerMetricType()], nonNullable: true }),
      operator: this.fb.control('', { validators: [this.validateTriggerOperator()], nonNullable: true }),
      threshold: this.fb.control(0, { validators: [Validators.required, Validators.min(1), this.validateTriggerThreshold()], nonNullable: true }),
      adjustment: this.fb.control(0, { validators: [Validators.required, Validators.min(1), this.validateTriggerAdjustment()], nonNullable: true }),
      breach_duration_secs: this.fb.control(0, { validators: [
        Validators.min(AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_min),
        Validators.max(AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_max)
      ], nonNullable: true }),
      cool_down_secs: this.fb.control(0, { validators: [
        Validators.min(AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_min),
        Validators.max(AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_max)
      ], nonNullable: true }),
      adjustment_type: this.fb.control('', { validators: [this.validateTriggerAdjustmentType()], nonNullable: true })
    });

    this.filteredMetricTypes$ = this.editTriggerForm.controls.metric_type.valueChanges.pipe(
      startWith(''),
      map(value => this.metricTypes.filter(type => type.toLocaleLowerCase().includes(value)))
    );
  }

  addTrigger = () => {
    const { ...newTrigger } = AutoscalerConstants.PolicyDefaultTrigger;
    this.currentPolicy.scaling_rules_form.push(newTrigger);
    this.editTrigger(this.currentPolicy.scaling_rules_form.length - 1);
  };

  removeTrigger(index: number) {
    if (this.editIndex() === index) {
      this.editIndex.set(-1);
    }
    this.currentPolicy.scaling_rules_form.splice(index, 1);
  }

  editTrigger(index: number) {
    this.editIndex.set(index);
    this.editMetricType = this.currentPolicy.scaling_rules_form[index].metric_type;
    this.editScaleType = getScaleType(this.currentPolicy.scaling_rules_form[index].operator);
    this.editAdjustmentType = getAdjustmentType(this.currentPolicy.scaling_rules_form[index].adjustment);
    this.editTriggerForm.setValue({
      metric_type: this.editMetricType,
      operator: this.currentPolicy.scaling_rules_form[index].operator,
      threshold: this.currentPolicy.scaling_rules_form[index].threshold,
      // A percentage step is stored as e.g. '-20%'; the field holds 20.
      adjustment: Math.abs(parseInt(this.currentPolicy.scaling_rules_form[index].adjustment, 10)),
      breach_duration_secs: this.currentPolicy.scaling_rules_form[index].breach_duration_secs ?? 0,
      cool_down_secs: this.currentPolicy.scaling_rules_form[index].cool_down_secs ?? 0,
      adjustment_type: this.editAdjustmentType
    });
  }

  finishTrigger() {
    const adjustmentP = this.editTriggerForm.get('adjustment_type')?.value === 'value' ? '' : '%';
    const adjustmentI = this.editTriggerForm.get('adjustment')?.value ?? 0;
    const adjustmentM = this.editScaleType === 'upper' ? `+${adjustmentI}${adjustmentP}` : `-${adjustmentI}${adjustmentP}`;
    this.currentPolicy.scaling_rules_form[this.editIndex()].metric_type = this.editTriggerForm.get('metric_type')?.value ?? '';
    this.currentPolicy.scaling_rules_form[this.editIndex()].operator = this.editTriggerForm.get('operator')?.value ?? '';
    this.currentPolicy.scaling_rules_form[this.editIndex()].threshold = this.editTriggerForm.get('threshold')?.value ?? 0;
    this.currentPolicy.scaling_rules_form[this.editIndex()].adjustment = adjustmentM;
    const breachDuration = this.editTriggerForm.get('breach_duration_secs')?.value ?? 0;
    if (breachDuration) {
      this.currentPolicy.scaling_rules_form[this.editIndex()].breach_duration_secs = breachDuration;
    } else {
      this.currentPolicy.scaling_rules_form[this.editIndex()].breach_duration_secs =
        AutoscalerConstants.PolicyDefaultSetting.breach_duration_secs_default;
    }
    const coolDown = this.editTriggerForm.get('cool_down_secs')?.value ?? 0;
    if (coolDown) {
      this.currentPolicy.scaling_rules_form[this.editIndex()].cool_down_secs = coolDown;
    } else {
      this.currentPolicy.scaling_rules_form[this.editIndex()].cool_down_secs =
        AutoscalerConstants.PolicyDefaultSetting.cool_down_secs_default;
    }
    this.editIndex.set(-1);
  }

  validateTriggerMetricType(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
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
    return (control: AbstractControl): ValidationErrors | null => {
      if (this.editTriggerForm) {
        this.editScaleType = getScaleType(control.value);
        this.editTriggerForm.controls.threshold.updateValueAndValidity();
      }
      return null;
    };
  }

  validateTriggerThreshold(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!this.editTriggerForm) {
        return null;
      }
      const errors: AppAutoscalerInvalidPolicyError = {};
      const limit = AutoscalerConstants.getMetricThresholdMax(this.editMetricType);
      if (limit !== undefined && numberWithFractionOrExceedRange(control.value, 1, limit, true)) {
        errors.alertInvalidPolicyTriggerThreshold100 = { value: control.value };
      }
      const thresholdMin = getThresholdMin(this.currentPolicy.scaling_rules_form, this.editMetricType, this.editScaleType, this.editIndex());
      const thresholdMax = getThresholdMax(this.currentPolicy.scaling_rules_form, this.editMetricType, this.editScaleType, this.editIndex());
      if (numberWithFractionOrExceedRange(control.value, thresholdMin, thresholdMax, true)) {
        errors.alertInvalidPolicyTriggerThresholdRange = { value: control.value };
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateTriggerAdjustment(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
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
    return (control: AbstractControl): ValidationErrors | null => {
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
}
