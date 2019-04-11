import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { ApplicationService } from '../../../../features/applications/application.service';
import { selectUpdateAutoscalerPolicyState } from '../../../../../../store/src/effects/autoscaler.effects';
import { UpdateAppAutoscalerPolicyStepAction } from '../../../../../../store/src/actions/app-autoscaler.actions';
import {
  MomentFormateDate, PolicyAlert, shiftArray, PolicyDefaultRecurringSchedule
} from '../../../../../../store/src/helpers/autoscaler/autoscaler-util';
import {
  numberWithFractionOrExceedRange,
  dateIsAfter,
  timeIsSameOrAfter,
  recurringSchedulesOverlapping,
} from '../../../../../../store/src/helpers/autoscaler/autoscaler-validation';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-edit-autoscaler-policy-step3',
  templateUrl: './edit-autoscaler-policy-step3.component.html',
  styleUrls: ['./edit-autoscaler-policy-step3.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep3Component implements OnInit {

  policyAlert = PolicyAlert;
  weekdayOptions: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthdayOptions: number[] = (() => {
    const days = [];
    for (let i = 0; i < 31; i++) {
      days[i] = i + 1;
    }
    return days;
  })();
  editRecurringScheduleForm: FormGroup;
  appAutoscalerPolicy$: Observable<any>;

  private editLimitValid = true;
  private editRecurringDateValid = true;
  private editRecurringTimeValid = true;
  private currentPolicy: any;
  private editIndex = -1;
  private editEffectiveType = 'always';
  private editRepeatType = 'week';

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
  ) {
    this.editRecurringScheduleForm = this.fb.group({
      days_of_week: [0],
      days_of_month: [0],
      instance_min_count: [0, [Validators.required, this.validateRecurringSpecificMin()]],
      instance_max_count: [0, [Validators.required, this.validateRecurringSpecificMax()]],
      initial_min_instance_count: [0, [this.validateRecurringScheduleInitialMin()]],
      start_date: [0, [this.validateRecurringScheduleGlobal()]],
      end_date: [0, [this.validateRecurringScheduleGlobal()]],
      start_time: [0, [Validators.required, this.validateRecurringScheduleStartTime(), this.validateRecurringScheduleGlobal()]],
      end_time: [0, [Validators.required, this.validateRecurringScheduleEndTime(), this.validateRecurringScheduleGlobal()]],
      effective_type: [0, [Validators.required, this.validateRecurringScheduleGlobal()]],
      repeat_type: [0, [Validators.required, this.validateRecurringScheduleGlobal()]],
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

  addRecurringSchedule = () => {
    this.currentPolicy.schedules.recurring_schedule.push(PolicyDefaultRecurringSchedule);
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
      days_of_week: shiftArray(this.currentPolicy.schedules.recurring_schedule[index].days_of_week || [], -1),
      days_of_month: shiftArray(this.currentPolicy.schedules.recurring_schedule[index].days_of_month || [], -1),
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

  finishRecurringSchedule: StepOnNextFunction = () => {
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
    currentSchedule[repeatOn] = shiftArray(this.editRecurringScheduleForm.get(repeatOn).value, 1);
    if (this.editRecurringScheduleForm.get('initial_min_instance_count').value) {
      currentSchedule.initial_min_instance_count = this.editRecurringScheduleForm.get('initial_min_instance_count').value;
    } else {
      delete currentSchedule.initial_min_instance_count;
    }
    currentSchedule.instance_min_count = this.editRecurringScheduleForm.get('instance_min_count').value;
    currentSchedule.instance_max_count = this.editRecurringScheduleForm.get('instance_max_count').value;
    currentSchedule.start_time = this.editRecurringScheduleForm.get('start_time').value;
    currentSchedule.end_time = this.editRecurringScheduleForm.get('end_time').value;
    this.store.dispatch(new UpdateAppAutoscalerPolicyStepAction(this.currentPolicy));
    this.editIndex = -1;
    return observableOf({ success: true });
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

  validateRecurringSpecificMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editRecurringScheduleForm &&
        numberWithFractionOrExceedRange(control.value, 1, this.editRecurringScheduleForm.get('instance_max_count').value - 1, true);
      const lastValid = this.editLimitValid;
      this.editLimitValid = this.editRecurringScheduleForm &&
        control.value < this.editRecurringScheduleForm.get('instance_max_count').value;
      if (this.editRecurringScheduleForm && lastValid !== this.editLimitValid) {
        this.editRecurringScheduleForm.controls.instance_max_count.updateValueAndValidity();
      }
      if (this.editRecurringScheduleForm) {
        this.editRecurringScheduleForm.controls.initial_min_instance_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
    };
  }

  validateRecurringSpecificMax(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editRecurringScheduleForm && numberWithFractionOrExceedRange(control.value,
        this.editRecurringScheduleForm.get('instance_min_count').value + 1, Number.MAX_VALUE, true);
      const lastValid = this.editLimitValid;
      this.editLimitValid =
        this.editRecurringScheduleForm && this.editRecurringScheduleForm.get('instance_min_count').value < control.value;
      if (this.editRecurringScheduleForm && lastValid !== this.editLimitValid) {
        this.editRecurringScheduleForm.controls.instance_min_count.updateValueAndValidity();
      }
      if (this.editRecurringScheduleForm) {
        this.editRecurringScheduleForm.controls.initial_min_instance_count.updateValueAndValidity();
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
        newSchedule.days_of_week = shiftArray(control.value, 1);
      } else {
        newSchedule.days_of_month = shiftArray(control.value, 1);
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
}
