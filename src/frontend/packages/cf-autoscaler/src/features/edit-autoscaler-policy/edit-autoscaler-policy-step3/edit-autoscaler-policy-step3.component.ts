import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { addDays, format } from 'date-fns';

import { TailwindErrorStateMatcher, TailwindShowOnDirtyErrorStateMatcher, TileGridComponent, TileGroupComponent, TileComponent, MetadataItemComponent } from '@stratosui/core';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { AutoscalerConstants, PolicyAlert, shiftArray } from '../../../core/autoscaler-helpers/autoscaler-util';
import {
  dateIsAfter,
  numberWithFractionOrExceedRange,
  recurringSchedulesOverlapping,
  timeIsSameOrAfter,
} from '../../../core/autoscaler-helpers/autoscaler-validation';
import { AppAutoscalerInvalidPolicyError, AppAutoscalerPolicyLocal, AppRecurringSchedule } from '../../../store/app-autoscaler.types';
import { EditAutoscalerPolicyDirective } from '../edit-autoscaler-policy-base-step';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import {
  validateRecurringSpecificMax,
  validateRecurringSpecificMin,
} from '../edit-autoscaler-policy-step4/edit-autoscaler-policy-step4.component';

interface EditRecurringScheduleForm {
  days_of_week: FormControl<number[]>;
  days_of_month: FormControl<number[]>;
  instance_min_count: FormControl<number>;
  instance_max_count: FormControl<number>;
  initial_min_instance_count: FormControl<number>;
  start_date: FormControl<string>;
  end_date: FormControl<string>;
  start_time: FormControl<string>;
  end_time: FormControl<string>;
  effective_type: FormControl<string>;
  repeat_type: FormControl<string>;
}

@Component({
  selector: 'app-edit-autoscaler-policy-step3',
  templateUrl: './edit-autoscaler-policy-step3.component.html',
  styleUrls: ['./edit-autoscaler-policy-step3.component.scss'],
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
    TileComponent,
    MetadataItemComponent
  ]
})
export class EditAutoscalerPolicyStep3Component extends EditAutoscalerPolicyDirective implements OnInit {

  policyAlert = PolicyAlert;
  weekdayOptions = AutoscalerConstants.WeekdayOptions;
  monthdayOptions = AutoscalerConstants.MonthdayOptions;
  editRecurringScheduleForm: FormGroup<EditRecurringScheduleForm>;

  public declare currentPolicy: AppAutoscalerPolicyLocal;
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
    route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    super(service, route);
    this.editRecurringScheduleForm = this.fb.group<EditRecurringScheduleForm>({
      days_of_week: this.fb.control<number[]>([], { nonNullable: true }),
      days_of_month: this.fb.control<number[]>([], { nonNullable: true }),
      instance_min_count: this.fb.control<number>(0, { nonNullable: true }),
      instance_max_count: this.fb.control<number>(0, { nonNullable: true }),
      initial_min_instance_count: this.fb.control<number>(0, { nonNullable: true, validators: [this.validateRecurringScheduleInitialMin()] }),
      start_date: this.fb.control<string>('', { nonNullable: true, validators: [this.validateRecurringScheduleGlobal()] }),
      end_date: this.fb.control<string>('', { nonNullable: true, validators: [this.validateRecurringScheduleGlobal()] }),
      start_time: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, this.validateRecurringScheduleTime('end_time'), this.validateRecurringScheduleGlobal()] }),
      end_time: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, this.validateRecurringScheduleTime('start_time'), this.validateRecurringScheduleGlobal()] }),
      effective_type: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, this.validateRecurringScheduleGlobal()] }),
      repeat_type: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, this.validateRecurringScheduleGlobal('repeat_type')] }),
    });
  }

  addRecurringSchedule = () => {
    const { ...newSchedule } = AutoscalerConstants.PolicyDefaultRecurringSchedule;
    this.currentPolicy.schedules.recurring_schedule.push(newSchedule);
    this.editRecurringSchedule(this.currentPolicy.schedules.recurring_schedule.length - 1);
  };

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
      initial_min_instance_count: editSchedule.initial_min_instance_count ?? 0,
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
    this.editRecurringScheduleForm.controls['instance_min_count'].setValidators([Validators.required,
    validateRecurringSpecificMin(this.editRecurringScheduleForm, this.editMutualValidation)]);
    this.editRecurringScheduleForm.controls['instance_max_count'].setValidators([Validators.required,
    validateRecurringSpecificMax(this.editRecurringScheduleForm, this.editMutualValidation)]);
    if (this.editEffectiveType === 'custom') {
      if (!this.currentPolicy.schedules.recurring_schedule[this.editIndex].start_date &&
        !this.editRecurringScheduleForm.get('start_date')?.value) {
        this.editRecurringScheduleForm.controls['start_date'].setValue(format(addDays(new Date(), 1), AutoscalerConstants.MomentFormateDate));
        this.editRecurringScheduleForm.controls['end_date'].setValue(format(addDays(new Date(), 1), AutoscalerConstants.MomentFormateDate));
      }
      this.editRecurringScheduleForm.controls['start_date'].setValidators([Validators.required,
      this.validateRecurringScheduleDate('end_date'), this.validateRecurringScheduleGlobal()]);
      this.editRecurringScheduleForm.controls['end_date'].setValidators([Validators.required,
      this.validateRecurringScheduleDate('start_date'), this.validateRecurringScheduleGlobal()]);
    } else {
      this.clearValidatorsThenRevalidate(this.editRecurringScheduleForm.controls['start_date']);
      this.clearValidatorsThenRevalidate(this.editRecurringScheduleForm.controls['end_date']);
    }
    if (this.editRepeatType === 'week') {
      this.editRecurringScheduleForm.controls['days_of_week'].setValidators([Validators.required, this.validateRecurringScheduleWeekMonth()]);
      this.clearValidatorsThenRevalidate(this.editRecurringScheduleForm.controls['days_of_month']);
    } else {
      this.editRecurringScheduleForm.controls['days_of_month'].setValidators([Validators.required, this.validateRecurringScheduleWeekMonth()]);
      this.clearValidatorsThenRevalidate(this.editRecurringScheduleForm.controls['days_of_week']);
    }
  }

  clearValidatorsThenRevalidate(input: AbstractControl) {
    input.clearValidators();
    input.updateValueAndValidity();
  }

  finishRecurringSchedule() {
    const currentSchedule = this.currentPolicy.schedules.recurring_schedule[this.editIndex];
    const repeatOn = ('days_of_' + this.editRepeatType) as 'days_of_week' | 'days_of_month';
    if (this.editRecurringScheduleForm.get('effective_type')?.value === 'custom') {
      currentSchedule.start_date = this.editRecurringScheduleForm.get('start_date')?.value ?? '';
      currentSchedule.end_date = this.editRecurringScheduleForm.get('end_date')?.value ?? '';
    } else {
      delete currentSchedule.start_date;
      delete currentSchedule.end_date;
    }
    delete currentSchedule.days_of_month;
    delete currentSchedule.days_of_week;
    currentSchedule[repeatOn] = shiftArray(this.editRecurringScheduleForm.get(repeatOn)?.value ?? [], 1);
    const initialMinCount = this.editRecurringScheduleForm.get('initial_min_instance_count')?.value ?? 0;
    if (initialMinCount) {
      currentSchedule.initial_min_instance_count = initialMinCount;
    } else {
      delete currentSchedule.initial_min_instance_count;
    }
    currentSchedule.instance_min_count = this.editRecurringScheduleForm.get('instance_min_count')?.value ?? 0;
    currentSchedule.instance_max_count = this.editRecurringScheduleForm.get('instance_max_count')?.value ?? 0;
    currentSchedule.start_time = this.editRecurringScheduleForm.get('start_time')?.value ?? '';
    currentSchedule.end_time = this.editRecurringScheduleForm.get('end_time')?.value ?? '';
    this.editIndex = -1;
  }

  validateRecurringScheduleGlobal(controlName?: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: unknown } | null => {
      if (this.editRecurringScheduleForm) {
        if (controlName === 'repeat_type') {
          this.editRepeatType = control.value;
          this.setRecurringScheduleValidator();
        }
        if (this.editRepeatType === 'week') {
          this.editRecurringScheduleForm.controls['days_of_week'].updateValueAndValidity();
        } else {
          this.editRecurringScheduleForm.controls['days_of_month'].updateValueAndValidity();
        }
      }
      return null;
    };
  }

  validateRecurringScheduleInitialMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: unknown } | null => {
      const minValue = this.editRecurringScheduleForm?.get('instance_min_count')?.value ?? 0;
      const maxValue = this.editRecurringScheduleForm?.get('instance_max_count')?.value ?? Number.MAX_VALUE;
      const invalid = this.editRecurringScheduleForm &&
        numberWithFractionOrExceedRange(control.value, minValue, maxValue + 1, false);
      return invalid ? { alertInvalidPolicyInitialMaximumRange: { value: control.value } } : null;
    };
  }

  validateRecurringScheduleDate(mutualName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: unknown } | null => {
      if (this.editEffectiveType === 'always') {
        return null;
      }
      const errors: AppAutoscalerInvalidPolicyError = {};
      if (dateIsAfter(format(new Date(), AutoscalerConstants.MomentFormateDate), control.value)) {
        errors.alertInvalidPolicyScheduleDateBeforeNow = { value: control.value };
      }
      const lastValid = this.editMutualValidation.date;
      this.editMutualValidation.date =
        !dateIsAfter(this.editRecurringScheduleForm.get('start_date')?.value ?? '', this.editRecurringScheduleForm.get('end_date')?.value ?? '');
      if (!this.editMutualValidation.date) {
        errors.alertInvalidPolicyScheduleEndDateBeforeStartDate = { value: control.value };
      }
      this.mutualValidate(mutualName, lastValid, this.editMutualValidation.date);
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateRecurringScheduleTime(mutualName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: unknown } | null => {
      const invalid = this.editRecurringScheduleForm &&
        timeIsSameOrAfter(this.editRecurringScheduleForm.get('start_time')?.value ?? '', this.editRecurringScheduleForm.get('end_time')?.value ?? '');
      const lastValid = this.editMutualValidation.time;
      this.editMutualValidation.time = !invalid;
      this.mutualValidate(mutualName, lastValid, this.editMutualValidation.time);
      return invalid ? { alertInvalidPolicyScheduleEndTimeBeforeStartTime: { value: control.value } } : null;
    };
  }

  validateRecurringScheduleWeekMonth(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: unknown } | null => {
      const newSchedule: Partial<AppRecurringSchedule> = {
        start_time: this.editRecurringScheduleForm.get('start_time')?.value ?? '',
        end_time: this.editRecurringScheduleForm.get('end_time')?.value ?? ''
      };
      const repeatProperty = 'days_of_' + this.editRepeatType as 'days_of_week' | 'days_of_month';
      newSchedule[repeatProperty] = shiftArray(control.value, 1);
      if (this.editEffectiveType === 'custom') {
        newSchedule.start_date = this.editRecurringScheduleForm.get('start_date')?.value ?? '';
        newSchedule.end_date = this.editRecurringScheduleForm.get('end_date')?.value ?? '';
      }
      const invalid = recurringSchedulesOverlapping(newSchedule as AppRecurringSchedule, this.editIndex,
        this.currentPolicy.schedules.recurring_schedule, repeatProperty);
      return invalid ? { alertInvalidPolicyScheduleRecurringConflict: { value: control.value } } : null;
    };
  }

  resetEffectiveType(key: string) {
    this.editEffectiveType = key;
    this.setRecurringScheduleValidator();
  }

  mutualValidate(inputName: string, lastValid: boolean, currentValid: boolean) {
    if (this.editRecurringScheduleForm && lastValid !== currentValid) {
      const control = this.editRecurringScheduleForm.get(inputName);
      if (control) {
        control.updateValueAndValidity();
      }
    }
  }
}
