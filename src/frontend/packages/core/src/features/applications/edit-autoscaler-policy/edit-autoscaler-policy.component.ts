import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, distinctUntilChanged, publishReplay, refCount, first } from 'rxjs/operators';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { AppState } from '../../../../../store/src/app-state';
import { ApplicationService } from '../application.service';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
  appAutoscalerUpdatedPolicySchemaKey
} from '../../../../../store/src/helpers/entity-factory';
import { GetAppAutoscalerPolicyAction, UpdateAppAutoscalerPolicyAction } from '../../../../../store/src/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../../../store/src/types/app-autoscaler.types';
import {
  UpperOperators,
  LowerOperators,
  PolicyDefault,
  PolicyDefaultSetting,
  MetricTypes,
  getScaleType,
  getAdjustmentType,
  MomentFormateDate,
  MomentFormateDateTimeT
} from '../../../../../store/src/helpers/autoscaler/autoscaler-util';
import { autoscalerTransformArrayToMap } from '../../../../../store/src/helpers/autoscaler/autoscaler-transform-policy';
import {
  numberWithFractionOrExceedRange,
  getThresholdMin,
  getThresholdMax,
  dateIsAfter,
  timeIsSameOrAfter,
  dateTimeIsSameOrAfter,
  recurringSchedulesOverlapping,
  specificDateRangeOverlapping
} from '../../../../../store/src/helpers/autoscaler/autoscaler-validation';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-edit-autoscaler-policy',
  templateUrl: './edit-autoscaler-policy.component.html',
  styleUrls: ['./edit-autoscaler-policy.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyComponent implements OnInit, OnDestroy {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;

  alertInvalidPolicyMinimumRange = 'The Minimum Instance Count must be a integer less than the Maximum Instance Count.';
  alertInvalidPolicyMaximumRange = 'The Maximum Instance Count must be a integer greater than the Minimum Instance Count.';
  alertInvalidPolicyInitialMaximumRange =
    'The Initial Minimum Instance Count must be a integer in the range of Minimum Instance Count to Maximum Instance Count.';
  alertInvalidPolicyTriggerUpperThresholdRange = 'The Upper Threshold value must be an integer greater than the Lower Threshold value.';
  alertInvalidPolicyTriggerLowerThresholdRange = 'The Lower Threshold value must be an integer in the range of 1 to (Upper Threshold-1).';
  alertInvalidPolicyTriggerThreshold100 = 'The Lower/Upper Threshold value of memoryutil must be an integer below or equal to 100.';
  alertInvalidPolicyTriggerStepPercentageRange = 'The Instance Step Up/Down percentage must be a integer greater than 1.';
  alertInvalidPolicyTriggerStepRange = 'The Instance Step Up/Down value must be a integer in the range of 1 to (Maximum Instance-1).';
  alertInvalidPolicyTriggerBreachDurationRange =
    `The breach duration value must be an integer in the range of ${PolicyDefaultSetting.breach_duration_secs_min} to
    ${PolicyDefaultSetting.breach_duration_secs_max} seconds.`;
  alertInvalidPolicyTriggerCooldownRange =
    `The cooldown period value must be an integer in the range of ${PolicyDefaultSetting.cool_down_secs_min} to
    ${PolicyDefaultSetting.breach_duration_secs_max} seconds.`;
  alertInvalidPolicyScheduleStartDateBeforeNow = 'Start date should be after or equal to current date.';
  alertInvalidPolicyScheduleEndDateBeforeNow = 'End date should be after or equal to current date.';
  alertInvalidPolicyScheduleEndDateBeforeStartDate = 'Start date must be earlier than the end date.';
  alertInvalidPolicyScheduleEndTimeBeforeStartTime = 'Start time must be earlier than the end time.';
  alertInvalidPolicyScheduleRepeatOn = 'Please select at least one "Repeat On" day.';
  alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = 'Start date and time must be earlier than the end date and time.';
  alertInvalidPolicyScheduleStartDateTimeBeforeNow = 'Start date and time must be after or equal to current date time.';
  alertInvalidPolicyScheduleEndDateTimeBeforeNow = 'End date and time must be after or equal the current date and time.';
  alertInvalidPolicyScheduleRecurringConflict = 'Recurring schedule configuration conflict occurs.';
  alertInvalidPolicyScheduleSpecificConflict = 'Specific date configuration conflict occurs.';

  weekdayOptions: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthdayOptions: number[] = (() => {
    const days = [];
    for (let i = 0; i < 31; i++) {
      days[i] = i + 1;
    }
    return days;
  })();
  timezoneOptions = moment.tz.names();

  metricTypes = MetricTypes;
  operatorTypes = UpperOperators.concat(LowerOperators);

  editLimitForm: FormGroup;
  editTriggerForm: FormGroup;
  editRecurringScheduleForm: FormGroup;
  editSpecificDateForm: FormGroup;
  private editLimitValid = true;
  private editRecurringDateValid = true;
  private editRecurringTimeValid = true;
  private editSpecificDateTimeValid = true;

  private appAutoscalerPolicyErrorSub: Subscription;
  private appAutoscalerPolicyService: EntityService;
  private appAutoscalerPolicyUpdateService: EntityService;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  private currentPolicy: any;
  private editIndex = -1;
  private editScaleType = 'upper';
  private editAdjustmentType = 'value';
  private editEffectiveType = 'always';
  private editRepeatType = 'week';

  submitMessage = '';
  submitStatus = true;

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.initLimitForm();
    this.initTriggerForm();
    this.initRecurringScheduleForm();
    this.initSpecificDateForm();
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

  updatePolicy: StepOnNextFunction = () => {
    this.submitStatus = true;
    this.submitMessage = '';
    let updateAppAutoscalerPolicyService: EntityService;
    updateAppAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerUpdatedPolicySchemaKey,
      entityFactory(appAutoscalerUpdatedPolicySchemaKey),
      this.applicationService.appGuid,
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy),
      false
    );
    this.store.dispatch(
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy)
    );

    let waitForAppAutoscalerHealth$: Observable<any>;
    waitForAppAutoscalerHealth$ = updateAppAutoscalerPolicyService.waitForEntity$.pipe(publishReplay(1), refCount());
    waitForAppAutoscalerHealth$
      .pipe(first())
      .subscribe(entity => {
        this.submitStatus = true;
        this.submitMessage = 'Policy is saved.';
        this.currentPolicy = entity.entity;
        this.store.dispatch(
          new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid)
        );
      });
    this.appAutoscalerPolicyErrorSub = updateAppAutoscalerPolicyService.entityMonitor.entityRequest$.pipe(
      filter(request => !!request.error),
      map(request => request.message),
      distinctUntilChanged(),
    ).subscribe(errorMessage => {
      this.submitStatus = false;
      this.submitMessage = errorMessage;
    });
    return observableOf({ success: this.submitStatus, message: this.submitMessage });
  }

  // step1
  initLimitForm() {
    this.editLimitForm = this.fb.group({
      instance_min_count: [0, [Validators.required, this.validateGlobalLimitMin()]],
      instance_max_count: [0, [Validators.required, this.validateGlobalLimitMax()]],
      timezone: [0, [Validators.required]]
    });
  }
  finishLimit: StepOnNextFunction = () => {
    this.currentPolicy.instance_min_count = Math.floor(this.editLimitForm.get('instance_min_count').value);
    this.currentPolicy.instance_max_count = Math.floor(this.editLimitForm.get('instance_max_count').value);
    this.currentPolicy.schedules.timezone = this.editLimitForm.get('timezone').value;
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

  // step2
  initTriggerForm() {
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

  // step3
  initRecurringScheduleForm() {
    this.editRecurringScheduleForm = this.fb.group({
      days_of_week: [0],
      days_of_month: [0],
      instance_min_count: [0],
      instance_max_count: [0],
      initial_min_instance_count: [0, [this.validateRecurringScheduleInitialMin()]],
      start_date: [0, [this.validateRecurringScheduleGlobal()]],
      end_date: [0, [this.validateRecurringScheduleGlobal()]],
      start_time: [0, [Validators.required, this.validateRecurringScheduleStartTime(), this.validateRecurringScheduleGlobal()]],
      end_time: [0, [Validators.required, this.validateRecurringScheduleEndTime(), this.validateRecurringScheduleGlobal()]],
      effective_type: [0, [Validators.required, this.validateRecurringScheduleGlobal()]],
      repeat_type: [0, [Validators.required, this.validateRecurringScheduleGlobal()]],
    });
  }
  addRecurringSchedule = () => {
    this.currentPolicy.schedules.recurring_schedule.push({
      start_time: '10:00',
      end_time: '18:00',
      days_of_week: [
        1, 2, 3
      ],
      instance_min_count: 1,
      instance_max_count: 10,
      initial_min_instance_count: 5
    });
    this.editRecurringSchedule(this.currentPolicy.schedules.recurring_schedule.length - 1);
  }
  removeRecurringSchedule(index) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    this.currentPolicy.schedules.recurring_schedule.splice(index, 1);
  }
  editRecurringSchedule(index) {
    this.editIndex = index;
    this.editEffectiveType = this.currentPolicy.schedules.recurring_schedule[index].start_date ? 'custom' : 'always';
    this.editRepeatType = this.currentPolicy.schedules.recurring_schedule[index].days_of_week ? 'week' : 'month';
    this.editRecurringScheduleForm.setValue({
      days_of_week: this.shiftArray(this.currentPolicy.schedules.recurring_schedule[index].days_of_week || [], -1),
      days_of_month: this.shiftArray(this.currentPolicy.schedules.recurring_schedule[index].days_of_month || [], -1),
      instance_min_count: this.currentPolicy.schedules.recurring_schedule[index].instance_min_count,
      instance_max_count: Math.abs(Number(this.currentPolicy.schedules.recurring_schedule[index].instance_max_count)),
      initial_min_instance_count: this.currentPolicy.schedules.recurring_schedule[index].initial_min_instance_count,
      start_date: this.currentPolicy.schedules.recurring_schedule[index].start_date || '',
      end_date: this.currentPolicy.schedules.recurring_schedule[index].end_date || '',
      start_time: this.currentPolicy.schedules.recurring_schedule[index].start_time,
      end_time: this.currentPolicy.schedules.recurring_schedule[index].end_time,
      effective_type: this.editEffectiveType,
      repeat_type: this.editRepeatType,
    });
    this.setRecurringScheduleValidator();
  }
  setRecurringScheduleValidator() {
    this.editRecurringScheduleForm.controls.instance_min_count.
      setValidators([Validators.required, this.validateRecurringSpecificMin(this.editRecurringScheduleForm)]);
    this.editRecurringScheduleForm.controls.instance_max_count.
      setValidators([Validators.required, this.validateRecurringSpecificMax(this.editRecurringScheduleForm)]);
    if (this.editEffectiveType === 'custom') {
      this.editRecurringScheduleForm.controls.start_date.setValidators([Validators.required,
      this.validateRecurringScheduleStartDate(), this.validateRecurringScheduleGlobal()]);
      this.editRecurringScheduleForm.controls.end_date.setValidators([Validators.required,
      this.validateRecurringScheduleEndDate(), this.validateRecurringScheduleGlobal()]);
    }
    if (this.editRepeatType === 'week') {
      this.editRecurringScheduleForm.controls.days_of_week.setValidators([Validators.required, this.validateRecurringScheduleWeekMonth()]);
    } else {
      this.editRecurringScheduleForm.controls.days_of_month.setValidators([Validators.required, this.validateRecurringScheduleWeekMonth()]);
    }
  }
  finishRecurringSchedule() {
    const currentSchedule = this.currentPolicy.schedules.recurring_schedule[this.editIndex];
    const repeatOn = 'days_of_' + this.editRepeatType;
    if (this.editRecurringScheduleForm.get('effective_type').value === 'custom') {
      currentSchedule.start_date = this.editRecurringScheduleForm.get('start_date').value;
      currentSchedule.end_date = this.editRecurringScheduleForm.get('end_date').value;
    } else {
      delete currentSchedule.start_date;
      delete currentSchedule.end_date;
    }
    delete currentSchedule.days_of_month;
    delete currentSchedule.days_of_week;
    currentSchedule[repeatOn] = this.shiftArray(this.editRecurringScheduleForm.get(repeatOn).value, 1);
    if (this.editRecurringScheduleForm.get('initial_min_instance_count').value) {
      currentSchedule.initial_min_instance_count = this.editRecurringScheduleForm.get('initial_min_instance_count').value;
    } else {
      delete currentSchedule.initial_min_instance_count;
    }
    currentSchedule.instance_min_count = this.editRecurringScheduleForm.get('instance_min_count').value;
    currentSchedule.instance_max_count = this.editRecurringScheduleForm.get('instance_max_count').value;
    currentSchedule.start_time = this.editRecurringScheduleForm.get('start_time').value;
    currentSchedule.end_time = this.editRecurringScheduleForm.get('end_time').value;
    this.editIndex = -1;
  }
  validateRecurringScheduleGlobal(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editRecurringScheduleForm) {
        if (this.editRepeatType === 'week') {
          this.editRecurringScheduleForm.controls.days_of_week.updateValueAndValidity();
        } else {
          this.editRecurringScheduleForm.controls.days_of_month.updateValueAndValidity();
        }
      }
      return null;
    };
  }
  validateRecurringSpecificMin(formGroup: FormGroup): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = formGroup && numberWithFractionOrExceedRange(control.value, 1, formGroup.get('instance_max_count').value - 1, true);
      const lastValid = this.editLimitValid;
      this.editLimitValid = formGroup && control.value < formGroup.get('instance_max_count').value;
      if (formGroup && lastValid !== this.editLimitValid) {
        formGroup.controls.instance_max_count.updateValueAndValidity();
      }
      if (formGroup) {
        formGroup.controls.initial_min_instance_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
    };
  }
  validateRecurringSpecificMax(formGroup: FormGroup): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = formGroup && numberWithFractionOrExceedRange(control.value,
        formGroup.get('instance_min_count').value + 1, Number.MAX_VALUE, true);
      const lastValid = this.editLimitValid;
      this.editLimitValid =
        formGroup && formGroup.get('instance_min_count').value < control.value;
      if (formGroup && lastValid !== this.editLimitValid) {
        formGroup.controls.instance_min_count.updateValueAndValidity();
      }
      if (formGroup) {
        formGroup.controls.initial_min_instance_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMaximumRange: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleInitialMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editRecurringScheduleForm &&
        numberWithFractionOrExceedRange(control.value, this.editRecurringScheduleForm.get('instance_min_count').value,
          this.editRecurringScheduleForm.get('instance_max_count').value + 1, false);
      return invalid ? { alertInvalidPolicyInitialMaximumRange: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleStartDate(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editEffectiveType === 'always') {
        return null;
      }
      const errors: any = {};
      if (dateIsAfter(moment().format(MomentFormateDate), control.value)) {
        errors.alertInvalidPolicyScheduleStartDateBeforeNow = { value: control.value };
      }
      const lastValid = this.editRecurringDateValid;
      this.editRecurringDateValid = !dateIsAfter(control.value, this.editRecurringScheduleForm.get('end_date').value);
      if (!this.editRecurringDateValid) {
        errors.alertInvalidPolicyScheduleEndDateBeforeStartDate = { value: control.value };
      }
      if (this.editRecurringScheduleForm && lastValid !== this.editRecurringDateValid) {
        this.editRecurringScheduleForm.controls.end_date.updateValueAndValidity();
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }
  validateRecurringScheduleEndDate(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editEffectiveType === 'always') {
        return null;
      }
      const errors: any = {};
      if (dateIsAfter(moment().format(MomentFormateDate), control.value)) {
        errors.alertInvalidPolicyScheduleEndDateBeforeNow = { value: control.value };
      }
      const lastValid = this.editRecurringDateValid;
      this.editRecurringDateValid = !dateIsAfter(this.editRecurringScheduleForm.get('start_date').value, control.value);
      if (!this.editRecurringDateValid) {
        errors.alertInvalidPolicyScheduleEndDateBeforeStartDate = { value: control.value };
      }
      if (this.editRecurringScheduleForm && lastValid !== this.editRecurringDateValid) {
        this.editRecurringScheduleForm.controls.start_date.updateValueAndValidity();
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }
  validateRecurringScheduleStartTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editRecurringScheduleForm && this.editRecurringScheduleForm &&
        timeIsSameOrAfter(control.value, this.editRecurringScheduleForm.get('end_time').value);
      const lastValid = this.editRecurringTimeValid;
      this.editRecurringTimeValid = !invalid;
      if (this.editRecurringScheduleForm && lastValid !== this.editRecurringTimeValid) {
        this.editRecurringScheduleForm.controls.end_time.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyScheduleEndTimeBeforeStartTime: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleEndTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editRecurringScheduleForm &&
        timeIsSameOrAfter(this.editRecurringScheduleForm.get('start_time').value, control.value);
      const lastValid = this.editRecurringTimeValid;
      this.editRecurringTimeValid = !invalid;
      if (this.editRecurringScheduleForm && lastValid !== this.editRecurringTimeValid) {
        this.editRecurringScheduleForm.controls.start_time.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyScheduleEndTimeBeforeStartTime: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleWeekMonth(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const newSchedule: any = {
        start_time: this.editRecurringScheduleForm.get('start_time').value,
        end_time: this.editRecurringScheduleForm.get('end_time').value
      };
      if (this.editRepeatType === 'week') {
        newSchedule.days_of_week = this.shiftArray(control.value, 1);
      } else {
        newSchedule.days_of_month = this.shiftArray(control.value, 1);
      }
      if (this.editEffectiveType === 'custom') {
        newSchedule.start_date = this.editRecurringScheduleForm.get('start_date').value;
        newSchedule.end_date = this.editRecurringScheduleForm.get('end_date').value;
      }
      const invalid = recurringSchedulesOverlapping(newSchedule, this.editIndex,
        this.currentPolicy.schedules.recurring_schedule, 'days_of_' + this.editRepeatType);
      return invalid ? { alertInvalidPolicyScheduleRecurringConflict: { value: control.value } } : null;
    };
  }
  shiftArray(daysOfWeek, step) {
    const days = [];
    for (let i = 0; i < daysOfWeek.length; i++) {
      days[i] = daysOfWeek[i] + step;
    }
    return days;
  }
  resetEffectiveType(key) {
    this.editEffectiveType = key;
    if (key === 'custom') {
      if (!this.currentPolicy.schedules.recurring_schedule[this.editIndex].start_date &&
        !this.editRecurringScheduleForm.get('start_date').value) {
        this.editRecurringScheduleForm.controls.start_date.setValue(moment().add(1, 'days').format(MomentFormateDate));
        this.editRecurringScheduleForm.controls.end_date.setValue(moment().add(1, 'days').format(MomentFormateDate));
      }
      this.editRecurringScheduleForm.controls.start_date.setValidators([Validators.required,
      this.validateRecurringScheduleStartDate(), this.validateRecurringScheduleGlobal()]);
      this.editRecurringScheduleForm.controls.end_date.setValidators([Validators.required,
      this.validateRecurringScheduleEndDate(), this.validateRecurringScheduleGlobal()]);
    } else {
      this.editRecurringScheduleForm.controls.start_date.clearValidators();
      this.editRecurringScheduleForm.controls.end_date.clearValidators();
      this.editRecurringScheduleForm.controls.start_date.setValue(this.editRecurringScheduleForm.get('start_date').value);
      this.editRecurringScheduleForm.controls.end_date.setValue(this.editRecurringScheduleForm.get('end_date').value);
    }
  }
  resetRepeatType(key) {
    this.editRepeatType = key;
    if (key === 'week') {
      if (!this.editRecurringScheduleForm.controls.days_of_week.value ||
        this.editRecurringScheduleForm.controls.days_of_week.value.length === 0) {
        this.editRecurringScheduleForm.controls.days_of_week.setValue([0]);
      }
      this.editRecurringScheduleForm.controls.days_of_week.setValidators([Validators.required, this.validateRecurringScheduleWeekMonth()]);
      this.editRecurringScheduleForm.controls.days_of_month.clearValidators();
      this.editRecurringScheduleForm.controls.days_of_month.setValue(this.editRecurringScheduleForm.get('days_of_month').value);
    } else {
      if (!this.editRecurringScheduleForm.controls.days_of_month.value ||
        this.editRecurringScheduleForm.controls.days_of_month.value.length === 0) {
        this.editRecurringScheduleForm.controls.days_of_month.setValue([0]);
      }
      this.editRecurringScheduleForm.controls.days_of_month.setValidators([Validators.required, this.validateRecurringScheduleWeekMonth()]);
      this.editRecurringScheduleForm.controls.days_of_week.clearValidators();
      this.editRecurringScheduleForm.controls.days_of_week.setValue(this.editRecurringScheduleForm.get('days_of_week').value);
    }
  }

  // step4
  initSpecificDateForm() {
    this.editSpecificDateForm = this.fb.group({
      instance_min_count: [0],
      instance_max_count: [0],
      initial_min_instance_count: [0, [this.validateSpecificDateInitialMin()]],
      start_date_time: [0, [Validators.required, this.validateSpecificDateStartDateTime()]],
      end_date_time: [0, [Validators.required, this.validateSpecificDateEndDateTime()]]
    });
  }
  addSpecificDate = () => {
    const nextStartDateTime = moment().add(1, 'days');
    const nextEndDateTime = moment().add(1, 'days');
    nextStartDateTime.set('hour', 10);
    nextStartDateTime.set('minute', 0);
    nextEndDateTime.set('hour', 18);
    nextEndDateTime.set('minute', 0);
    this.currentPolicy.schedules.specific_date.push({
      start_date_time: nextStartDateTime.format(MomentFormateDateTimeT),
      end_date_time: nextEndDateTime.format(MomentFormateDateTimeT),
      instance_min_count: 1,
      instance_max_count: 10,
      initial_min_instance_count: 5
    });
    this.editSpecificDate(this.currentPolicy.schedules.specific_date.length - 1);
  }
  removeSpecificDate(index) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    this.currentPolicy.schedules.specific_date.splice(index, 1);
  }
  editSpecificDate(index) {
    this.editIndex = index;
    this.editSpecificDateForm.setValue({
      instance_min_count: this.currentPolicy.schedules.specific_date[index].instance_min_count,
      instance_max_count: Math.abs(Number(this.currentPolicy.schedules.specific_date[index].instance_max_count)),
      initial_min_instance_count: this.currentPolicy.schedules.specific_date[index].initial_min_instance_count,
      start_date_time: this.currentPolicy.schedules.specific_date[index].start_date_time,
      end_date_time: this.currentPolicy.schedules.specific_date[index].end_date_time,
    });
    this.editSpecificDateForm.controls.instance_min_count.
      setValidators([Validators.required, this.validateRecurringSpecificMin(this.editSpecificDateForm)]);
    this.editSpecificDateForm.controls.instance_max_count.
      setValidators([Validators.required, this.validateRecurringSpecificMax(this.editSpecificDateForm)]);
  }
  finishSpecificDate() {
    if (this.editSpecificDateForm.get('initial_min_instance_count').value) {
      this.currentPolicy.schedules.specific_date[this.editIndex].initial_min_instance_count =
        this.editSpecificDateForm.get('initial_min_instance_count').value;
    } else {
      delete this.currentPolicy.schedules.specific_date[this.editIndex].initial_min_instance_count;
    }
    this.currentPolicy.schedules.specific_date[this.editIndex].instance_min_count =
      this.editSpecificDateForm.get('instance_min_count').value;
    this.currentPolicy.schedules.specific_date[this.editIndex].instance_max_count =
      this.editSpecificDateForm.get('instance_max_count').value;
    this.currentPolicy.schedules.specific_date[this.editIndex].start_date_time = this.editSpecificDateForm.get('start_date_time').value;
    this.currentPolicy.schedules.specific_date[this.editIndex].end_date_time = this.editSpecificDateForm.get('end_date_time').value;
    this.editIndex = -1;
  }
  validateSpecificDateInitialMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editSpecificDateForm && numberWithFractionOrExceedRange(control.value,
        this.editSpecificDateForm.get('instance_min_count').value, this.editSpecificDateForm.get('instance_max_count').value + 1, false);
      return invalid ? { alertInvalidPolicyInitialMaximumRange: { value: control.value } } : null;
    };
  }
  validateSpecificDateStartDateTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.editSpecificDateForm) {
        return null;
      }
      const newSchedule = {
        start_date_time: control.value,
        end_date_time: this.editSpecificDateForm.get('end_date_time').value
      };
      const errors: any = {};
      if (dateTimeIsSameOrAfter(moment().tz(this.currentPolicy.schedules.timezone).format(MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleStartDateTimeBeforeNow = { value: control.value };
      }
      const lastValid = this.editSpecificDateTimeValid;
      this.editSpecificDateTimeValid = !dateTimeIsSameOrAfter(control.value, this.editSpecificDateForm.get('end_date_time').value);
      if (!this.editSpecificDateTimeValid) {
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = { value: control.value };
      }
      if (this.editSpecificDateForm && lastValid !== this.editSpecificDateTimeValid) {
        this.editSpecificDateForm.controls.end_date_time.updateValueAndValidity();
      }
      if (specificDateRangeOverlapping(newSchedule, this.editIndex, this.currentPolicy.schedules.specific_date)) {
        errors.alertInvalidPolicyScheduleSpecificConflict = { value: control.value };
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }
  validateSpecificDateEndDateTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.editSpecificDateForm) {
        return null;
      }
      const newSchedule = {
        start_date_time: this.editSpecificDateForm.get('start_date_time').value,
        end_date_time: control.value
      };
      const errors: any = {};
      if (dateTimeIsSameOrAfter(moment().tz(this.currentPolicy.schedules.timezone).format(MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeNow = { value: control.value };
      }
      const lastValid = this.editSpecificDateTimeValid;
      this.editSpecificDateTimeValid = !dateTimeIsSameOrAfter(this.editSpecificDateForm.get('start_date_time').value, control.value);
      if (!this.editSpecificDateTimeValid) {
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = { value: control.value };
      }
      if (this.editSpecificDateForm && lastValid !== this.editSpecificDateTimeValid) {
        this.editSpecificDateForm.controls.start_date_time.updateValueAndValidity();
      }
      if (specificDateRangeOverlapping(newSchedule, this.editIndex, this.currentPolicy.schedules.specific_date)) {
        errors.alertInvalidPolicyScheduleSpecificConflict = { value: control.value };
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }
}
