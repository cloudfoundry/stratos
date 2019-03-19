import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Http } from '@angular/http';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, take, first } from 'rxjs/operators';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { AppMetadataTypes } from '../../../../../store/src/actions/app-metadata.actions';
import { SetCFDetails, SetNewAppName } from '../../../../../store/src/actions/create-applications-page.actions';
import { AppState } from '../../../../../store/src/app-state';
import { AppNameUniqueChecking, AppNameUniqueDirective } from '../app-name-unique.directive/app-name-unique.directive';
import { ApplicationService } from '../application.service';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
} from '../../../../../store/src/helpers/entity-factory';
import { GetAppAutoscalerPolicyAction, UpdateAppAutoscalerPolicyAction } from '../../../../../store/src/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../../../store/src/types/app-autoscaler.types';
import { selectUpdateInfo } from '../../../../../store/src/selectors/api.selectors';
import { ActionState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { MetricTypes, UpperOperators, LowerOperators, PolicyDefaultSetting } from '../../../../../store/src/helpers/autoscaler-helpers';
// import * as moment from 'moment';
import intersect from 'intersect';
import Moment from 'moment-timezone';
import {
  extendMoment
} from 'moment-range';
const moment = extendMoment(Moment);



@Component({
  selector: 'app-edit-autoscaler-policy',
  templateUrl: './edit-autoscaler-policy.component.html',
  styleUrls: ['./edit-autoscaler-policy.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyComponent implements OnInit, OnDestroy {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/auto-scaler`;

  alert_invalid_policy_minimum_range = 'The Minimum Instance Count must be a integer less than the Maximum Instance Count.';
  alert_invalid_policy_maximum_range = 'The Maximum Instance Count must be a integer greater than the Minimum Instance Count.';
  alert_invalid_policy_initial_minimum_range = 'The Initial Minimum Instance Count must be a integer in the range of Minimum Instance Count to Maximum Instance Count.';
  alert_invalid_policy_trigger_upper_threshold_range = 'The Upper Threshold value must be an integer greater than the Lower Threshold value.';
  alert_invalid_policy_trigger_lower_threshold_range = 'The Lower Threshold value must be an integer in the range of 1 to (Upper Threshold-1).';
  alert_invalid_policy_trigger_threshold_100 = 'The Lower/Upper Threshold value of memoryutil must be an integer below or equal to 100.';
  alert_invalid_policy_trigger_step_percentage_range = 'The Instance Step Up/Down percentage must be a integer greater than 1.';
  alert_invalid_policy_trigger_step_range = 'The Instance Step Up/Down value must be a integer in the range of 1 to (Maximum Instance-1).';
  alert_invalid_policy_trigger_breachduration_range = `The breach duration value must be an integer in the range of ${PolicyDefaultSetting.breach_duration_secs_min} to ${PolicyDefaultSetting.breach_duration_secs_max} seconds.`;
  alert_invalid_policy_trigger_cooldown_range = `The cooldown period value must be an integer in the range of ${PolicyDefaultSetting.cool_down_secs_min} to ${PolicyDefaultSetting.breach_duration_secs_max} seconds.`;
  alert_invalid_policy_schedule_start_date_before_now = 'Start date should be after or equal to current date.';
  alert_invalid_policy_schedule_end_date_before_now = 'End date should be after or equal to current date.';
  alert_invalid_policy_schedule_end_date_before_start_date = 'Start date must be earlier than the end date.';
  alert_invalid_policy_schedule_end_time_before_start_time = 'Start time must be earlier than the end time.';




  alert_invalid_policy_trigger_schedule_empty = 'At least one trigger rule or schedule should be defined.';

  alert_invalid_policy_schedule_repeat_on = 'Please select at least one "Repeat On" day.';

  alert_invalid_policy_schedule_end_datetime_before_start_datetime = 'Start date and time {start_time} must be earlier than the end date and time {end_time}.';
  alert_invalid_policy_schedule_start_datetime_before_now = 'Start date and time {time} must be after or equal to current date time.';
  alert_invalid_policy_schedule_end_datetime_before_now = 'End date and time {time} must be after or equal the current date and time.';
  alert_invalid_policy_schedule_recurring_conflict = 'Recurring schedule configuration conflict occurs.';
  alert_invalid_policy_schedule_specific_conflict = 'Specific date configuration conflict occurs.';


  weekdayOptions: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthdayOptions: number[] = (() => {
    const days = [];
    for (let i = 0; i < 31; i++) {
      days[i] = i + 1;
    }
    return days;
  })();
  MomentFormateDateTimeT = 'YYYY-MM-DDTHH:mm';
  MomentFormateDate = 'YYYY-MM-DD';
  MomentFormateTime: 'HH:mm';

  metricTypes = MetricTypes;
  operatorTypes = UpperOperators.concat(LowerOperators);

  editLimitForm: FormGroup;
  editTriggerForm: FormGroup;
  editRecurringScheduleForm: FormGroup;
  editSpecificDateForm: FormGroup;

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private http: Http,
    private snackBar: MatSnackBar,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.editLimitForm = this.fb.group({
      instance_min_count: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      instance_max_count: [0, [
        Validators.required,
        Validators.min(1)
      ]]
    });
    this.editTriggerForm = this.fb.group({
      metric_type: [0, [
      ]],
      operator: [0, [
      ]],
      threshold: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      adjustment: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      breach_duration_secs: [0, [
        Validators.min(PolicyDefaultSetting.breach_duration_secs_min),
        Validators.max(PolicyDefaultSetting.breach_duration_secs_max)
      ]],
      cool_down_secs: [0, [
        Validators.min(PolicyDefaultSetting.cool_down_secs_min),
        Validators.max(PolicyDefaultSetting.cool_down_secs_max),
      ]],
      adjustment_type: [0, [
      ]],
    });
    this.editRecurringScheduleForm = this.fb.group({
      days_of_week: [0],
      days_of_month: [0],
      instance_min_count: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      instance_max_count: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      initial_min_instance_count: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      start_date: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      end_date: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      start_time: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      end_time: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      effective_type: [0, [
        Validators.required,
      ]],
      repeat_type: [0, [
        Validators.required,
      ]],
    });
    this.editSpecificDateForm = this.fb.group({
      instance_min_count: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      instance_max_count: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      initial_min_instance_count: [0, [
        Validators.min(1)
      ]],
      start_date_time: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      end_date_time: [0, [
        Validators.required,
        Validators.min(1)
      ]]
    });
  }

  private app: any = {
    entity: {}
  };

  private sub: Subscription;

  private error = false;

  appAutoscalerPolicyService: EntityService;
  appAutoscalerPolicyUpdateService: EntityService;
  public appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  private currentPolicy: any;
  public isEditing = false;

  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  editingIndex = -1;
  editingScaleType = 'upper';
  editingAdjustmentType = 'value';
  editingEffectiveType = 'always';
  editingRepeatType = 'week';

  updateApp: StepOnNextFunction = () => {
    const updates = {};
    // We will only send the values that were actually edited
    for (const key of Object.keys(this.editLimitForm.value)) {
      if (!this.editLimitForm.controls[key].pristine) {
        updates[key] = this.editLimitForm.value[key];
      }
    }

    let obs$: Observable<any>;
    if (Object.keys(updates).length) {
      // We had at least one value to change - send update action
      obs$ = this.applicationService.updateApplication(updates, [AppMetadataTypes.SUMMARY]).pipe(map(v => (
        {
          success: !v.error,
          message: `Could not update application: ${v.message}`
        })));
    } else {
      obs$ = observableOf({ success: true });
    }

    return obs$.pipe(take(1), map(res => {
      return {
        ...res,
        redirect: res.success
      };
    }));
  }

  clearSub() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
  }

  ngOnInit() {
    this.sub = this.applicationService.application$.pipe(
      filter(app => !!app.app.entity),
      take(1),
      map(app => app.app.entity)
    ).subscribe(app => {
      this.app = app;
      this.store.dispatch(new SetCFDetails({
        cloudFoundry: this.applicationService.cfGuid,
        org: '',
        space: this.app.space_guid,
      }));
      this.store.dispatch(new SetNewAppName(this.app.name));
      // Don't want the values to change while the user is editing
      this.clearSub();
    });

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
          this.editLimitForm.controls.instance_min_count.setValue(this.currentPolicy.instance_min_count);
          this.editLimitForm.controls.instance_max_count.setValue(this.currentPolicy.instance_max_count);
          this.editLimitForm.controls.instance_min_count.setValidators([Validators.required, this.validateGlobalLimitMin()]);
          this.editLimitForm.controls.instance_max_count.setValidators([Validators.required, this.validateGlobalLimitMax()]);
        }
        return entity && entity.entity;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    this.clearSub();
  }

  finishEdit(ok: boolean) {
    this.isEditing = false;
    if (ok) {
      const doUpdate = () => this.updatePolicy();
      doUpdate().pipe(
        first(),
      ).subscribe(actionState => {
        if (actionState.error) {
          this.snackBarRef = this.snackBar.open(`Failed to update instance count: ${actionState.message}`, 'Dismiss');
        }
      });
    }
  }

  updatePolicy = () => {
    console.log('submit', this.currentPolicy)
    this.store.dispatch(
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy)
    );
    const actionState = selectUpdateInfo(appAutoscalerPolicySchemaKey,
      this.applicationService.appGuid,
      UpdateAppAutoscalerPolicyAction.updateKey);
    return this.store.select(actionState).pipe(filter(item => !!item));
  }

  // step1
  finishLimit: StepOnNextFunction = () => {
    this.currentPolicy.instance_min_count = Math.floor(this.editLimitForm.get('instance_min_count').value);
    this.currentPolicy.instance_max_count = Math.floor(this.editLimitForm.get('instance_max_count').value);
    console.log('finishLimit', this.currentPolicy)
    return observableOf({ success: true });
  }
  validateGlobalLimitMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.numberWithFractionOrExceedRange(control.value, 1, this.editLimitForm.get('instance_max_count').value, true);
      return invalid ? { alert_invalid_policy_minimum_range: { value: control.value } } : null;
    };
  }
  validateGlobalLimitMax(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.numberWithFractionOrExceedRange(control.value, this.editLimitForm.get('instance_min_count').value, Number.MAX_VALUE, true);
      return invalid ? { alert_invalid_policy_maximum_range: { value: control.value } } : null;
    };
  }

  // step2
  addTrigger = () => {
    this.currentPolicy.scaling_rules_form.push({
      metric_type: 'memoryused',
      breach_duration_secs: 600,
      threshold: 10,
      operator: '<=',
      cool_down_secs: 300,
      adjustment: '-2'
    })
  }
  removeTrigger(index) {
    if (this.editingIndex == index) {
      this.editingIndex = -1;
    }
    this.currentPolicy.scaling_rules_form.splice(index, 1)
  }
  editTrigger(index) {
    this.editingIndex = index;
    this.editingScaleType = this.getScaleType(this.currentPolicy.scaling_rules_form[index].operator);
    this.editingAdjustmentType = this.getAdjustmentType(this.currentPolicy.scaling_rules_form[index].adjustment);
    this.editTriggerForm.setValue({
      metric_type: this.currentPolicy.scaling_rules_form[index].metric_type,
      operator: this.currentPolicy.scaling_rules_form[index].operator,
      threshold: this.currentPolicy.scaling_rules_form[index].threshold,
      adjustment: Math.abs(Number(this.currentPolicy.scaling_rules_form[index].adjustment)),
      breach_duration_secs: this.currentPolicy.scaling_rules_form[index].breach_duration_secs,
      cool_down_secs: this.currentPolicy.scaling_rules_form[index].cool_down_secs,
      adjustment_type: this.currentPolicy.scaling_rules_form[index].adjustment.indexOf('%') >= 0 ? 'percentage' : 'value'
    });
    this.editTriggerForm.controls.adjustment.setValidators([Validators.required, Validators.min(1), this.validateTriggerAdjustment()]);
    this.editTriggerForm.controls.threshold.setValidators([Validators.required, Validators.min(1), this.validateTriggerThreshold()]);
  }
  finishTrigger: StepOnNextFunction = () => {
    if (this.editingIndex != -1) {
      const adjustmentp = this.editTriggerForm.get('adjustment_type').value == 'value' ? '' : '%';
      const adjustmenti = this.editTriggerForm.get('adjustment').value;
      const adjustmentm = (adjustmenti > 0 ? `+${adjustmenti}${adjustmentp}` : `${adjustmenti}${adjustmentp}`);
      this.currentPolicy.scaling_rules_form[this.editingIndex].metric_type = this.editTriggerForm.get('metric_type').value;
      this.currentPolicy.scaling_rules_form[this.editingIndex].operator = this.editTriggerForm.get('operator').value;
      this.currentPolicy.scaling_rules_form[this.editingIndex].threshold = this.editTriggerForm.get('threshold').value;
      this.currentPolicy.scaling_rules_form[this.editingIndex].adjustment = adjustmentm;
      if (this.editTriggerForm.get('breach_duration_secs').value) {
        this.currentPolicy.scaling_rules_form[this.editingIndex].breach_duration_secs = this.editTriggerForm.get('breach_duration_secs').value;
      } else {
        delete this.currentPolicy.scaling_rules_form[this.editingIndex].breach_duration_secs
      }
      if (this.editTriggerForm.get('cool_down_secs').value) {
        this.currentPolicy.scaling_rules_form[this.editingIndex].cool_down_secs = this.editTriggerForm.get('cool_down_secs').value;
      } else {
        delete this.currentPolicy.scaling_rules_form[this.editingIndex].cool_down_secs
      }
      this.editingIndex = -1;
    }
    console.log('finishTrigger', this.currentPolicy.scaling_rules_form)
    return observableOf({ success: true });
  }
  validateTriggerThreshold(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const metricType = this.editTriggerForm.get('metric_type').value;
      this.editingScaleType = this.getScaleType(this.editTriggerForm.get('operator').value);
      this.editingAdjustmentType = this.editTriggerForm.get('adjustment_type').value;
      const errors = {};
      if (metricType == 'memoryutil') {
        if (this.numberWithFractionOrExceedRange(control.value, 1, 100, true)) {
          errors['alert_invalid_policy_trigger_threshold_100'] = { value: control.value };
        }
      }
      if (this.numberWithFractionOrExceedRange(control.value, this.getThresthodMin(this.currentPolicy.scaling_rules_form, metricType, this.editingScaleType, this.editingIndex), this.getThresthodMax(this.currentPolicy.scaling_rules_form, metricType, this.editingScaleType, this.editingIndex), true)) {
        errors['alert_invalid_policy_trigger_threshold_range'] = { value: control.value };
      }
      return Object.keys(errors).length === 0 ? null : errors
    };
  }
  validateTriggerAdjustment(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      this.editingScaleType = this.getScaleType(this.editTriggerForm.get('operator').value);
      this.editingAdjustmentType = this.editTriggerForm.get('adjustment_type').value;
      const errors = {};
      const max = this.editingAdjustmentType == 'value' ? this.currentPolicy.instance_max_count - 1 : Number.MAX_VALUE;
      if (this.numberWithFractionOrExceedRange(control.value, 1, max, true)) {
        errors['alert_invalid_policy_trigger_step_range'] = {};
      }
      return Object.keys(errors).length === 0 ? null : errors
    };
  }

  // step3
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
    })
  }
  removeRecurringSchedule(index) {
    if (this.editingIndex == index) {
      this.editingIndex = -1;
    }
    this.currentPolicy.schedules.recurring_schedule.splice(index, 1)
  }
  editRecurringSchedule(index) {
    this.editingIndex = index;
    this.editingEffectiveType = this.currentPolicy.schedules.recurring_schedule[index].start_date ? 'custom' : 'always';
    this.editingRepeatType = this.currentPolicy.schedules.recurring_schedule[index].days_of_week ? 'week' : 'month';
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
      effective_type: this.editingEffectiveType,
      repeat_type: this.editingRepeatType,
    });
    this.editRecurringScheduleForm.controls.instance_min_count.setValidators([Validators.required, this.validateRecurringScheduleMin()]);
    this.editRecurringScheduleForm.controls.instance_max_count.setValidators([Validators.required, this.validateRecurringScheduleMax()]);
    this.editRecurringScheduleForm.controls.initial_min_instance_count.setValidators([this.validateRecurringScheduleInitialMin()]);
    this.editRecurringScheduleForm.controls.start_date.setValidators([Validators.required, this.validateRecurringScheduleStartDate()]);
    this.editRecurringScheduleForm.controls.end_date.setValidators([Validators.required, this.validateRecurringScheduleEndDate()]);
    this.editRecurringScheduleForm.controls.start_time.setValidators([Validators.required, this.validateRecurringScheduleStartTime()]);
    this.editRecurringScheduleForm.controls.end_time.setValidators([Validators.required, this.validateRecurringScheduleEndTime()]);
    if (this.editingRepeatType === 'week') {
      this.editRecurringScheduleForm.controls.days_of_week.setValidators([Validators.required, this.validateRecurringScheduleWeek()]);
      this.editRecurringScheduleForm.controls.days_of_month.clearValidators();
    } else {
      this.editRecurringScheduleForm.controls.days_of_month.setValidators([Validators.required, this.validateRecurringScheduleMonth()]);
      this.editRecurringScheduleForm.controls.days_of_week.clearValidators();
    }
  }
  finishRecurringSchedule(index) {
    if (this.editRecurringScheduleForm.get('effective_type').value == 'custom') {
      this.currentPolicy.schedules.recurring_schedule[index].start_date = this.editRecurringScheduleForm.get('start_date').value;
      this.currentPolicy.schedules.recurring_schedule[index].end_date = this.editRecurringScheduleForm.get('end_date').value;
    } else {
      delete this.currentPolicy.schedules.recurring_schedule[index].start_date
      delete this.currentPolicy.schedules.recurring_schedule[index].end_date
    }
    if (this.editRecurringScheduleForm.get('repeat_type').value == 'week') {
      this.currentPolicy.schedules.recurring_schedule[index].days_of_week = this.shiftArray(this.editRecurringScheduleForm.get('days_of_week').value, 1);
      delete this.currentPolicy.schedules.recurring_schedule[index].days_of_month;
    } else {
      this.currentPolicy.schedules.recurring_schedule[index].days_of_month = this.shiftArray(this.editRecurringScheduleForm.get('days_of_month').value, 1);
      delete this.currentPolicy.schedules.recurring_schedule[index].days_of_week;
    }
    if (this.currentPolicy.schedules.recurring_schedule[index].initial_min_instance_count) {
      this.currentPolicy.schedules.recurring_schedule[index].initial_min_instance_count = this.editRecurringScheduleForm.get('initial_min_instance_count').value;
    } else {
      delete this.currentPolicy.schedules.recurring_schedule[index].initial_min_instance_count;
    }
    this.currentPolicy.schedules.recurring_schedule[index].instance_min_count = this.editRecurringScheduleForm.get('instance_min_count').value;
    this.currentPolicy.schedules.recurring_schedule[index].instance_max_count = this.editRecurringScheduleForm.get('instance_max_count').value;
    this.currentPolicy.schedules.recurring_schedule[index].start_time = this.editRecurringScheduleForm.get('start_time').value;
    this.currentPolicy.schedules.recurring_schedule[index].end_time = this.editRecurringScheduleForm.get('end_time').value;
    this.editingIndex = -1;
    console.log('finishRecurringSchedule', this.currentPolicy.schedules.recurring_schedule)
  }
  validateRecurringScheduleMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.numberWithFractionOrExceedRange(control.value, 1, this.editRecurringScheduleForm.get('instance_max_count').value - 1, true);
      return invalid ? { alert_invalid_policy_minimum_range: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleMax(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.numberWithFractionOrExceedRange(control.value, this.editRecurringScheduleForm.get('instance_min_count').value + 1, Number.MAX_VALUE, true);
      return invalid ? { alert_invalid_policy_maximum_range: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleInitialMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.numberWithFractionOrExceedRange(control.value, this.editRecurringScheduleForm.get('instance_min_count').value, this.editRecurringScheduleForm.get('instance_max_count').value + 1, false);
      return invalid ? { alert_invalid_policy_initial_minimum_range: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleStartDate(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editingEffectiveType === 'always') return null;
      const errors = {};
      if (this.dateIsAfter(moment().format(this.MomentFormateDate), control.value)) {
        errors['alert_invalid_policy_schedule_start_date_before_now'] = { value: control.value };
      }
      if (this.dateIsAfter(control.value, this.editRecurringScheduleForm.get('end_date').value)) {
        errors['alert_invalid_policy_schedule_end_date_before_start_date'] = { value: control.value };
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }
  validateRecurringScheduleEndDate(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editingEffectiveType === 'always') return null;
      const errors = {};
      if (this.dateIsAfter(moment().format(this.MomentFormateDate), control.value)) {
        errors['alert_invalid_policy_schedule_end_date_before_now'] = { value: control.value };
      }
      if (this.dateIsAfter(this.editRecurringScheduleForm.get('start_date').value, control.value)) {
        errors['alert_invalid_policy_schedule_end_date_before_start_date'] = { value: control.value };
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }
  validateRecurringScheduleStartTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.timeIsSameOrAfter(control.value, this.editRecurringScheduleForm.get('end_time').value);
      return invalid ? { alert_invalid_policy_schedule_end_time_before_start_time: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleEndTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.timeIsSameOrAfter(this.editRecurringScheduleForm.get('start_time').value, control.value);
      return invalid ? { alert_invalid_policy_schedule_end_time_before_start_time: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleWeek(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const newSchedule = {
        days_of_week: this.shiftArray(control.value, 1),
        start_time: this.editRecurringScheduleForm.get('start_time').value,
        end_time: this.editRecurringScheduleForm.get('end_time').value
      };
      if (this.editingEffectiveType === 'custom') {
        newSchedule['start_date'] = this.editRecurringScheduleForm.get('start_date').value;
        newSchedule['end_date'] = this.editRecurringScheduleForm.get('end_date').value;
      }
      const invalid = this.recurringSchedulesOverlapping(newSchedule, this.editingIndex, this.currentPolicy.schedules.recurring_schedule, 'days_of_week');
      return invalid ? { alert_invalid_policy_schedule_recurring_conflict: { value: control.value } } : null;
    };
  }
  validateRecurringScheduleMonth(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const newSchedule = {
        days_of_month: this.shiftArray(control.value, 1),
        start_time: this.editRecurringScheduleForm.get('start_time').value,
        end_time: this.editRecurringScheduleForm.get('end_time').value
      };
      if (this.editingEffectiveType === 'custom') {
        newSchedule['start_date'] = this.editRecurringScheduleForm.get('start_date').value;
        newSchedule['end_date'] = this.editRecurringScheduleForm.get('end_date').value;
      }
      const invalid = this.recurringSchedulesOverlapping(newSchedule, this.editingIndex, this.currentPolicy.schedules.recurring_schedule, 'days_of_month');
      return invalid ? { alert_invalid_policy_schedule_recurring_conflict: { value: control.value } } : null;
    };
  }
  shiftArray(days_of_week, step) {
    const days = []
    for (let i = 0; i < days_of_week.length; i++) {
      days[i] = days_of_week[i] + step;
    }
    return days;
  }
  resetEffectiveType(key) {
    this.editingEffectiveType = key;
    if (key === 'custom') {
      if (!this.currentPolicy.schedules.recurring_schedule[this.editingIndex].start_date && !this.editRecurringScheduleForm.get('start_date').value) {
        this.editRecurringScheduleForm.controls.start_date.setValue(moment().add(1, 'days').format(this.MomentFormateDate));
        this.editRecurringScheduleForm.controls.end_date.setValue(moment().add(1, 'days').format(this.MomentFormateDate));
      }
    }
  }
  resetRepeatType(key) {
    this.editingRepeatType = key;
    if (key === 'week') {
      if (!this.editRecurringScheduleForm.controls.days_of_week.value || this.editRecurringScheduleForm.controls.days_of_week.value.length === 0) {
        this.editRecurringScheduleForm.controls.days_of_week.setValue([0]);
      }
      this.editRecurringScheduleForm.controls.days_of_week.setValidators([Validators.required, this.validateRecurringScheduleWeek()]);
      this.editRecurringScheduleForm.controls.days_of_month.clearValidators();
    } else {
      if (!this.editRecurringScheduleForm.controls.days_of_month.value || this.editRecurringScheduleForm.controls.days_of_month.value.length === 0) {
        this.editRecurringScheduleForm.controls.days_of_month.setValue([0]);
      }
      this.editRecurringScheduleForm.controls.days_of_month.setValidators([Validators.required, this.validateRecurringScheduleMonth()]);
      this.editRecurringScheduleForm.controls.days_of_week.clearValidators();
    }
  }

  // step4
  addSpecificDate = () => {
    let nextStartDateTime = moment().add(1, 'days')
    let nextEndDateTime = moment().add(1, 'days')
    nextStartDateTime.set('hour', 10)
    nextStartDateTime.set('minute', 0)
    nextEndDateTime.set('hour', 18)
    nextEndDateTime.set('minute', 0)
    this.currentPolicy.schedules.specific_date.push({
      start_date_time: nextStartDateTime.format(this.MomentFormateDateTimeT),
      end_date_time: nextEndDateTime.format(this.MomentFormateDateTimeT),
      days_of_week: [
        1, 2, 3
      ],
      instance_min_count: 1,
      instance_max_count: 10,
      initial_min_instance_count: 5
    })
  }
  removeSpecificDate(index) {
    if (this.editingIndex == index) {
      this.editingIndex = -1;
    }
    this.currentPolicy.schedules.specific_date.splice(index, 1)
  }
  editSpecificDate(index) {
    this.editingIndex = index;
    this.editSpecificDateForm.setValue({
      instance_min_count: this.currentPolicy.schedules.specific_date[index].instance_min_count,
      instance_max_count: Math.abs(Number(this.currentPolicy.schedules.specific_date[index].instance_max_count)),
      initial_min_instance_count: this.currentPolicy.schedules.specific_date[index].initial_min_instance_count,
      start_date_time: this.currentPolicy.schedules.specific_date[index].start_date_time,
      end_date_time: this.currentPolicy.schedules.specific_date[index].end_date_time,
    });
  }
  finishSpecificDate(index) {
    if (this.currentPolicy.schedules.specific_date[index].initial_min_instance_count) {
      this.currentPolicy.schedules.specific_date[index].initial_min_instance_count = this.editRecurringScheduleForm.get('initial_min_instance_count').value;
    }
    this.currentPolicy.schedules.specific_date[index].instance_min_count = this.editSpecificDateForm.get('instance_min_count').value;
    this.currentPolicy.schedules.specific_date[index].instance_max_count = this.editSpecificDateForm.get('instance_max_count').value;
    this.currentPolicy.schedules.specific_date[index].initial_min_instance_count = this.editSpecificDateForm.get('initial_min_instance_count').value;
    this.currentPolicy.schedules.specific_date[index].start_date_time = this.editSpecificDateForm.get('start_date_time').value;
    this.currentPolicy.schedules.specific_date[index].end_date_time = this.editSpecificDateForm.get('end_date_time').value;
    this.editingIndex = -1;
  }

  // reset editing index
  resetEditingIndex: StepOnNextFunction = () => {
    this.editingIndex = -1;
    return observableOf({ success: true });
  }

  getScaleType(operator) {
    if (LowerOperators.indexOf(operator) >= 0) {
      return 'lower'
    } else {
      return 'upper'
    }
  }
  getAdjustmentType(adjustment) {
    return adjustment.indexOf('%') >= 0 ? 'percentage' : 'value'
  }

  numberWithFractionOrExceedRange(value, min, max, required) {
    if ((!value || isNaN(value)) && !required) {
      return false
    }
    if ((!value || isNaN(value)) && required) {
      return true
    }
    return value.toString().indexOf('.') > -1 || value > max || value < min
  }

  timeIsSameOrAfter(startTime, endTime) {
    return moment('2000-01-01T' + startTime, this.MomentFormateDateTimeT).isSameOrAfter(moment('2000-01-01T' + endTime, this.MomentFormateDateTimeT));
  }

  dateIsAfter(startDate, endDate) {
    return moment(startDate, this.MomentFormateDate).isAfter(moment(endDate, this.MomentFormateDate));
  }

  dateTimeIsSameOrAfter(startDateTime, endDateTime, timezone) {
    // return moment.tz(startDateTime, timezone).isSameOrAfter(moment.tz(endDateTime, timezone));
    return moment(startDateTime, timezone).isSameOrAfter(moment(endDateTime, timezone));
  }

  recurringSchedulesInvalidRepeatOn(inputRecurringSchedules) {
    let weekdayCount = inputRecurringSchedules.hasOwnProperty('days_of_week') ? inputRecurringSchedules['days_of_week'].length : 0
    let monthdayCount = inputRecurringSchedules.hasOwnProperty('days_of_month') ? inputRecurringSchedules['days_of_month'].length : 0
    return (weekdayCount > 0 && monthdayCount > 0) || (weekdayCount == 0 && monthdayCount == 0)
  }

  recurringSchedulesOverlapping(newSchedule, index, inputRecurringSchedules, property) {
    for (let i = 0; i != index && i < inputRecurringSchedules.length; i++) {
      if (inputRecurringSchedules[i].hasOwnProperty(property) && newSchedule.hasOwnProperty(property)) {
        if (inputRecurringSchedules[i].hasOwnProperty('start_date') && inputRecurringSchedules[i].hasOwnProperty('end_date') && newSchedule.hasOwnProperty('start_date') && newSchedule.hasOwnProperty('end_date')) {
          if (!this.dateOverlaps(inputRecurringSchedules[i]['start_date'], inputRecurringSchedules[i]['end_date'], newSchedule['start_date'], newSchedule['end_date'])) {
            continue
          }
        }
        if (this.timeOverlaps(inputRecurringSchedules[i]['start_time'], inputRecurringSchedules[i]['end_time'], newSchedule['start_time'], newSchedule['end_time'])) {
          let intersects = intersect(inputRecurringSchedules[i][property], newSchedule[property])
          return intersects.length > 0;
        }
      }
    }
    return false;
  }

  specificDateRangeOverlapping(inputSpecificDates) {
    let errorpairs = {}
    var dateRangeList = []
    if (inputSpecificDates.length > 0) {
      for (let i = 0; inputSpecificDates && i < inputSpecificDates.length; i++) {
        let start = moment(inputSpecificDates[i].start_date_time, this.MomentFormateDateTimeT)
        let end = moment(inputSpecificDates[i].end_date_time, this.MomentFormateDateTimeT)
        let range = moment.range(start, end)
        dateRangeList[i] = range;
      }
      for (let j = 0; j < dateRangeList.length; j++) {
        for (let i = j + 1; i < dateRangeList.length; i++) {
          if (dateRangeList[j].overlaps(dateRangeList[i])) {
            errorpairs[i] = true
            errorpairs[j] = true
          }
        }
      }
    }
    return errorpairs
  }

  timeOverlaps(start_time_i, end_time_i, start_time_j, end_time_j) {
    let rangei = moment.range(moment('1970-01-01T' + start_time_i, this.MomentFormateDateTimeT), moment('1970-01-01T' + end_time_i, this.MomentFormateDateTimeT))
    let rangej = moment.range(moment('1970-01-01T' + start_time_j, this.MomentFormateDateTimeT), moment('1970-01-01T' + end_time_j, this.MomentFormateDateTimeT))
    console.log(rangei, rangej, rangei.overlaps(rangej))
    return rangei.overlaps(rangej)
  }

  dateOverlaps(start_date_i, end_date_i, start_date_j, end_date_j) {
    let rangei = moment.range(moment(start_date_i + 'T00:00', this.MomentFormateDateTimeT), moment(end_date_i + 'T23:59', this.MomentFormateDateTimeT))
    let rangej = moment.range(moment(start_date_j + 'T00:00', this.MomentFormateDateTimeT), moment(end_date_j + 'T23:59', this.MomentFormateDateTimeT))
    return rangei.overlaps(rangej)
  }

  getThresthodMin(policyTriggers, metricType, scaleType, index) {
    let thresholdMin = 1;
    if (scaleType == 'upper') {
      policyTriggers.map((trigger, triggerIndex) => {
        if (triggerIndex != index && trigger.metric_type == metricType && LowerOperators.indexOf(trigger.operator) >= 0) {
          thresholdMin = Math.max(trigger.threshold + 1, thresholdMin);
        }
      })
    }
    return thresholdMin;
  }

  getThresthodMax(policyTriggers, metricType, scaleType, index) {
    let thresholdMax = Number.MAX_VALUE
    if (scaleType == 'lower') {
      policyTriggers.map((trigger, triggerIndex) => {
        if (triggerIndex != index && trigger.metric_type == metricType && UpperOperators.indexOf(trigger.operator) >= 0) {
          thresholdMax = Math.min(trigger.threshold - 1, thresholdMax);
        }
      })
    }
    return thresholdMax
  }

}
