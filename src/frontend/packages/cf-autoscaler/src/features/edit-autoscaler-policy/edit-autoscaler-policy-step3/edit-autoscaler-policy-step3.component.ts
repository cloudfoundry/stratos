import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment-timezone';

import { ApplicationService } from '../../../../../cloud-foundry/src/features/applications/application.service';
import { AutoscalerConstants, PolicyAlert, shiftArray } from '../../../core/autoscaler-helpers/autoscaler-util';
import {
  dateIsAfter,
  numberWithFractionOrExceedRange,
  recurringSchedulesOverlapping,
  timeIsSameOrAfter,
} from '../../../core/autoscaler-helpers/autoscaler-validation';
import {
  AppAutoscalerInvalidPolicyError,
  AppAutoscalerPolicy,
  AppAutoscalerPolicyLocal,
} from '../../../store/app-autoscaler.types';
import { EditAutoscalerPolicy } from '../edit-autoscaler-policy-base-step';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import {
  validateRecurringSpecificMax,
  validateRecurringSpecificMin,
} from '../edit-autoscaler-policy-step4/edit-autoscaler-policy-step4.component';

@Component({
  selector: 'app-edit-autoscaler-policy-step3',
  templateUrl: './edit-autoscaler-policy-step3.component.html',
  styleUrls: ['./edit-autoscaler-policy-step3.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep3Component extends EditAutoscalerPolicy implements OnInit {

  policyAlert = PolicyAlert;
  weekdayOptions = AutoscalerConstants.WeekdayOptions;
  monthdayOptions = AutoscalerConstants.MonthdayOptions;
  editRecurringScheduleForm: FormGroup;

  public currentPolicy: AppAutoscalerPolicyLocal;
  private editIndex = -1;
  private editEffectiveType = 'always';
  private editRepeatType = 'week';
  private editMutualValidation = {
    limit: true,
    date: true,
    time: true
  };

  constructor(
    public applicationService: ApplicationService,
    private fb: FormBuilder,
    service: EditAutoscalerPolicyService,
    route: ActivatedRoute
  ) {
    super(service, route);
    this.editRecurringScheduleForm = this.fb.group({
      days_of_week: [0],
      days_of_month: [0],
      instance_min_count: [0],
      instance_max_count: [0],
      initial_min_instance_count: [0, [this.validateRecurringScheduleInitialMin()]],
      start_date: [0, [this.validateRecurringScheduleGlobal()]],
      end_date: [0, [this.validateRecurringScheduleGlobal()]],
      start_time: [0, [Validators.required, this.validateRecurringScheduleTime('end_time'), this.validateRecurringScheduleGlobal()]],
      end_time: [0, [Validators.required, this.validateRecurringScheduleTime('start_time'), this.validateRecurringScheduleGlobal()]],
      effective_type: [0, [Validators.required, this.validateRecurringScheduleGlobal()]],
      repeat_type: [0, [Validators.required, this.validateRecurringScheduleGlobal('repeat_type')]],
    });
  }

  addRecurringSchedule = () => {
    const { ...newSchedule } = AutoscalerConstants.PolicyDefaultRecurringSchedule;
    this.currentPolicy.schedules.recurring_schedule.push(newSchedule);
    this.editRecurringSchedule(this.currentPolicy.schedules.recurring_schedule.length - 1);
  }

  removeRecurringSchedule(index: number) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    this.currentPolicy.schedules.recurring_schedule.splice(index, 1);
  }

  editRecurringSchedule(index: number) {
    const editSchedule = this.currentPolicy.schedules.recurring_schedule[index];
    this.editIndex = index;
    this.editEffectiveType = editSchedule.start_date ? 'custom' : 'always';
    this.editRepeatType = editSchedule.days_of_week ? 'week' : 'month';
    this.editRecurringScheduleForm.setValue({
      days_of_week: shiftArray(editSchedule.days_of_week || [], -1),
      days_of_month: shiftArray(editSchedule.days_of_month || [], -1),
      instance_min_count: editSchedule.instance_min_count,
      instance_max_count: Math.abs(Number(editSchedule.instance_max_count)),
      initial_min_instance_count: editSchedule.initial_min_instance_count,
      start_date: editSchedule.start_date || '',
      end_date: editSchedule.end_date || '',
      start_time: editSchedule.start_time,
      end_time: editSchedule.end_time,
      effective_type: this.editEffectiveType,
      repeat_type: this.editRepeatType,
    });
    this.setRecurringScheduleValidator();
  }

  setRecurringScheduleValidator() {
    this.editRecurringScheduleForm.controls.instance_min_count.setValidators([Validators.required,
    validateRecurringSpecificMin(this.editRecurringScheduleForm, this.editMutualValidation)]);
    this.editRecurringScheduleForm.controls.instance_max_count.setValidators([Validators.required,
    validateRecurringSpecificMax(this.editRecurringScheduleForm, this.editMutualValidation)]);
    if (this.editEffectiveType === 'custom') {
      if (!this.currentPolicy.schedules.recurring_schedule[this.editIndex].start_date &&
        !this.editRecurringScheduleForm.get('start_date').value) {
        this.editRecurringScheduleForm.controls.start_date.setValue(moment().add(1, 'days').format(AutoscalerConstants.MomentFormateDate));
        this.editRecurringScheduleForm.controls.end_date.setValue(moment().add(1, 'days').format(AutoscalerConstants.MomentFormateDate));
      }
      this.editRecurringScheduleForm.controls.start_date.setValidators([Validators.required,
      this.validateRecurringScheduleDate('end_date'), this.validateRecurringScheduleGlobal()]);
      this.editRecurringScheduleForm.controls.end_date.setValidators([Validators.required,
      this.validateRecurringScheduleDate('start_date'), this.validateRecurringScheduleGlobal()]);
    } else {
      this.clearValidatorsThenRevalidate(this.editRecurringScheduleForm.controls.start_date);
      this.clearValidatorsThenRevalidate(this.editRecurringScheduleForm.controls.end_date);
    }
    if (this.editRepeatType === 'week') {
      this.editRecurringScheduleForm.controls.days_of_week.setValidators([Validators.required, this.validateRecurringScheduleWeekMonth()]);
      this.clearValidatorsThenRevalidate(this.editRecurringScheduleForm.controls.days_of_month);
    } else {
      this.editRecurringScheduleForm.controls.days_of_month.setValidators([Validators.required, this.validateRecurringScheduleWeekMonth()]);
      this.clearValidatorsThenRevalidate(this.editRecurringScheduleForm.controls.days_of_week);
    }
  }

  clearValidatorsThenRevalidate(input) {
    input.clearValidators();
    input.updateValueAndValidity();
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
    this.editIndex = -1;
  }

  validateRecurringScheduleGlobal(controlName?: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editRecurringScheduleForm) {
        if (controlName === 'repeat_type') {
          this.editRepeatType = control.value;
          this.setRecurringScheduleValidator();
        }
        if (this.editRepeatType === 'week') {
          this.editRecurringScheduleForm.controls.days_of_week.updateValueAndValidity();
        } else {
          this.editRecurringScheduleForm.controls.days_of_month.updateValueAndValidity();
        }
      }
      return null;
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

  validateRecurringScheduleDate(mutualName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.editEffectiveType === 'always') {
        return null;
      }
      const errors: AppAutoscalerInvalidPolicyError = {};
      if (dateIsAfter(moment().format(AutoscalerConstants.MomentFormateDate), control.value)) {
        errors.alertInvalidPolicyScheduleDateBeforeNow = { value: control.value };
      }
      const lastValid = this.editMutualValidation.date;
      this.editMutualValidation.date =
        !dateIsAfter(this.editRecurringScheduleForm.get('start_date').value, this.editRecurringScheduleForm.get('end_date').value);
      if (!this.editMutualValidation.date) {
        errors.alertInvalidPolicyScheduleEndDateBeforeStartDate = { value: control.value };
      }
      this.mutualValidate(mutualName, lastValid, this.editMutualValidation.date);
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateRecurringScheduleTime(mutualName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editRecurringScheduleForm &&
        timeIsSameOrAfter(this.editRecurringScheduleForm.get('start_time').value, this.editRecurringScheduleForm.get('end_time').value);
      const lastValid = this.editMutualValidation.time;
      this.editMutualValidation.time = !invalid;
      this.mutualValidate(mutualName, lastValid, this.editMutualValidation.time);
      return invalid ? { alertInvalidPolicyScheduleEndTimeBeforeStartTime: { value: control.value } } : null;
    };
  }

  validateRecurringScheduleWeekMonth(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const newSchedule: any = {
        start_time: this.editRecurringScheduleForm.get('start_time').value,
        end_time: this.editRecurringScheduleForm.get('end_time').value
      };
      newSchedule['days_of_' + this.editRepeatType] = shiftArray(control.value, 1);
      if (this.editEffectiveType === 'custom') {
        newSchedule.start_date = this.editRecurringScheduleForm.get('start_date').value;
        newSchedule.end_date = this.editRecurringScheduleForm.get('end_date').value;
      }
      const invalid = recurringSchedulesOverlapping(newSchedule, this.editIndex,
        this.currentPolicy.schedules.recurring_schedule, 'days_of_' + this.editRepeatType);
      return invalid ? { alertInvalidPolicyScheduleRecurringConflict: { value: control.value } } : null;
    };
  }

  resetEffectiveType(key: string) {
    this.editEffectiveType = key;
    this.setRecurringScheduleValidator();
  }

  mutualValidate(inputName: string, lastValid: boolean, currentValid: boolean) {
    if (this.editRecurringScheduleForm && lastValid !== currentValid) {
      this.editRecurringScheduleForm.controls[inputName].updateValueAndValidity();
    }
  }
}
