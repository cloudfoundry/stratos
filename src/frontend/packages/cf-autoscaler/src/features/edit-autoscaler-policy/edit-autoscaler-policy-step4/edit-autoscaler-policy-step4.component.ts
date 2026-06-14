import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { TailwindErrorStateMatcher, TailwindShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { BehaviorSubject, from, of as observableOf } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { StepOnNextFunction } from '@stratosui/core';
import { AutoscalerConstants, PolicyAlert } from '../../../core/autoscaler-helpers/autoscaler-util';
import {
  dateTimeIsSameOrAfter,
  numberWithFractionOrExceedRange,
  specificDateRangeOverlapping } from '../../../core/autoscaler-helpers/autoscaler-validation';
import { AutoscalerPolicyDataService } from '../../../services/domain-data/autoscaler-policy-data.service';
import {
  AppAutoscalerInvalidPolicyError,
  AppAutoscalerPolicyLocal,
  AppSpecificDate } from '../../../store/app-autoscaler.types';
import { EditAutoscalerPolicyDirective } from '../edit-autoscaler-policy-base-step';
import {
  TileGridComponent,
  TileGroupComponent,
  TileComponent,
  MetadataItemComponent
} from '@stratosui/core';

interface EditSpecificDateForm {
  instance_min_count: FormControl<number>;
  instance_max_count: FormControl<number>;
  initial_min_instance_count: FormControl<number>;
  start_date_time: FormControl<string>;
  end_date_time: FormControl<string>;
}

@Component({
  selector: 'app-edit-autoscaler-policy-step4',
  templateUrl: './edit-autoscaler-policy-step4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    MetadataItemComponent
  ],
  providers: [
    { provide: TailwindErrorStateMatcher, useClass: TailwindShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep4Component extends EditAutoscalerPolicyDirective implements OnInit {
  applicationService = inject(ApplicationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  // FWT-959 Track A wave-3 (A-policy slice): replaced
  // CreateAppAutoscalerPolicyAction / UpdateAppAutoscalerPolicyAction +
  // EntityServiceFactory entityMonitor wiring with a direct call into
  // AutoscalerPolicyDataService.update() (covers both create and update —
  // the legacy effects both PUT to the same /apps/{guid}/policy endpoint).
  private policyData = inject(AutoscalerPolicyDataService);


  policyAlert = PolicyAlert;
  editSpecificDateForm: FormGroup<EditSpecificDateForm>;

  public declare currentPolicy: AppAutoscalerPolicyLocal;
  // FWT-959 Part 2: editIndex backed by a BehaviorSubject so the parent
  // orchestrator can bridge editIndex changes into a signal for its
  // signal-step handle (valid / disablePrevious). Templates still read
  // `editIndex` (now via getter), call-sites still write `this.editIndex = N`.
  readonly editIndex$ = new BehaviorSubject<number>(-1);
  get editIndex(): number { return this.editIndex$.value; }
  set editIndex(v: number) { this.editIndex$.next(v); }
  private editMutualValidation = {
    limit: true,
    datetime: true
  };
  private createUpdateTest!: string;

  constructor() {
    super();
    this.editSpecificDateForm = this.fb.group<EditSpecificDateForm>({
      instance_min_count: new FormControl<number>(0, { nonNullable: true }),
      instance_max_count: new FormControl<number>(0, { nonNullable: true }),
      initial_min_instance_count: new FormControl<number>(0, { validators: [this.validateSpecificDateInitialMin()], nonNullable: true }),
      start_date_time: new FormControl<string>('', { validators: [Validators.required, this.validateSpecificDateStartDateTime()], nonNullable: true }),
      end_date_time: new FormControl<string>('', { validators: [Validators.required, this.validateSpecificDateEndDateTime()], nonNullable: true })
    });
  }

  ngOnInit() {
    super.ngOnInit();
    this.createUpdateTest = this.isCreate ? 'create policy' : 'update policy';
  }

  updatePolicy: StepOnNextFunction = () => {
    if (this.validateGlobalSetting()) {
      return observableOf({
        success: false,
        message: `Could not ${this.createUpdateTest}: ${PolicyAlert.alertInvalidPolicyTriggerScheduleEmpty}` });
    }
    const cfGuid = this.applicationService.cfGuid;
    const appGuid = this.applicationService.appGuid;
    return from(this.policyData.update(cfGuid, appGuid, this.currentPolicy)).pipe(
      map(() => ({
        success: true,
        redirect: true,
        message: null as string | null,
      })),
      catchError(err => {
        const detail = (err && (err.message || (err.error && (err.error.message || err.error)))) || '';
        return observableOf({
          success: false,
          redirect: false,
          message: `Could not ${this.createUpdateTest}${detail ? `: ${detail}` : ''}`,
        });
      }),
    );
  };

  addSpecificDate = () => {
    const { ...newSchedule } = AutoscalerConstants.PolicyDefaultSpecificDate;
    this.currentPolicy.schedules.specific_date.push(newSchedule);
    this.editSpecificDate(this.currentPolicy.schedules.specific_date.length - 1);
  };

  removeSpecificDate(index: number) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    this.currentPolicy.schedules.specific_date.splice(index, 1);
  }

  editSpecificDate(index: number) {
    this.editIndex = index;
    const specificDate = this.currentPolicy.schedules.specific_date[index];
    this.editSpecificDateForm.setValue({
      instance_min_count: specificDate.instance_min_count,
      instance_max_count: Math.abs(Number(specificDate.instance_max_count)),
      initial_min_instance_count: specificDate.initial_min_instance_count ?? 0,
      start_date_time: specificDate.start_date_time,
      end_date_time: specificDate.end_date_time });
    this.editSpecificDateForm.controls.instance_min_count.setValidators([Validators.required,
    validateRecurringSpecificMin(this.editSpecificDateForm, this.editMutualValidation)]);
    this.editSpecificDateForm.controls.instance_max_count.setValidators([Validators.required,
    validateRecurringSpecificMax(this.editSpecificDateForm, this.editMutualValidation)]);
  }

  finishSpecificDate() {
    const specificDate = this.currentPolicy.schedules?.specific_date?.[this.editIndex];
    if (!specificDate) {
      return;
    }
    const initialMinCount = this.editSpecificDateForm.get('initial_min_instance_count')?.value ?? 0;
    if (initialMinCount) {
      specificDate.initial_min_instance_count = initialMinCount;
    } else {
      delete specificDate.initial_min_instance_count;
    }
    specificDate.instance_min_count =
      this.editSpecificDateForm.get('instance_min_count')?.value ?? 0;
    specificDate.instance_max_count =
      this.editSpecificDateForm.get('instance_max_count')?.value ?? 0;
    specificDate.start_date_time = this.editSpecificDateForm.get('start_date_time')?.value ?? '';
    specificDate.end_date_time = this.editSpecificDateForm.get('end_date_time')?.value ?? '';
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
      const errors: AppAutoscalerInvalidPolicyError = {};
      const newSchedule: AppSpecificDate = {
        instance_min_count: 0,
        instance_max_count: 0,
        start_date_time: control.value,
        end_date_time: this.editSpecificDateForm.get('end_date_time')?.value ?? ''
      };
      const lastValid = this.editMutualValidation.datetime;
      this.editMutualValidation.datetime = true;
      if (dateTimeIsSameOrAfter(format(toZonedTime(new Date(), this.currentPolicy.schedules.timezone),
        AutoscalerConstants.MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleStartDateTimeBeforeNow = { value: control.value };
      }
      if (dateTimeIsSameOrAfter(control.value, this.editSpecificDateForm.get('end_date_time')?.value ?? '')) {
        this.editMutualValidation.datetime = false;
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = { value: control.value };
      }
      if (specificDateRangeOverlapping(newSchedule, this.editIndex, this.currentPolicy.schedules.specific_date)) {
        this.editMutualValidation.datetime = false;
        errors.alertInvalidPolicyScheduleSpecificConflict = { value: control.value };
      }
      if (this.editSpecificDateForm && lastValid !== this.editMutualValidation.datetime) {
        this.editSpecificDateForm.controls.end_date_time.updateValueAndValidity();
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateSpecificDateEndDateTime(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.editSpecificDateForm) {
        return null;
      }
      const errors: AppAutoscalerInvalidPolicyError = {};
      const newSchedule = {
        instance_min_count: 0,
        instance_max_count: 0,
        start_date_time: this.editSpecificDateForm.get('start_date_time')?.value ?? '',
        end_date_time: control.value
      };
      const lastValid = this.editMutualValidation.datetime;
      this.editMutualValidation.datetime = true;
      if (dateTimeIsSameOrAfter(format(toZonedTime(new Date(), this.currentPolicy.schedules.timezone),
        AutoscalerConstants.MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeNow = { value: control.value };
      }
      if (dateTimeIsSameOrAfter(this.editSpecificDateForm.get('start_date_time')?.value ?? '', control.value)) {
        this.editMutualValidation.datetime = false;
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = { value: control.value };
      }
      if (specificDateRangeOverlapping(newSchedule, this.editIndex, this.currentPolicy.schedules.specific_date)) {
        this.editMutualValidation.datetime = false;
        errors.alertInvalidPolicyScheduleSpecificConflict = { value: control.value };
      }
      if (this.editSpecificDateForm && lastValid !== this.editMutualValidation.datetime) {
        this.editSpecificDateForm.controls.start_date_time.updateValueAndValidity();
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateGlobalSetting() {
    return this.currentPolicy.scaling_rules_form.length === 0
      && this.currentPolicy.schedules.recurring_schedule.length === 0
      && this.currentPolicy.schedules.specific_date.length === 0;
  }
}

export function validateRecurringSpecificMin(editForm: FormGroup<any>, editMutualValidation: { limit: boolean }): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    const invalid = editForm &&
      numberWithFractionOrExceedRange(control.value, 1, editForm.get('instance_max_count').value - 1, true);
    const lastValid = editMutualValidation.limit;
    editMutualValidation.limit = editForm && control.value < editForm.get('instance_max_count').value;
    if (editForm && lastValid !== editMutualValidation.limit) {
      editForm.controls.instance_max_count.updateValueAndValidity();
    }
    if (editForm) {
      editForm.controls.initial_min_instance_count.updateValueAndValidity();
    }
    return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
  };
}

export function validateRecurringSpecificMax(editForm: FormGroup<any>, editMutualValidation: { limit: boolean }): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    const invalid = editForm && numberWithFractionOrExceedRange(control.value,
      editForm.get('instance_min_count').value + 1, Number.MAX_VALUE, true);
    const lastValid = editMutualValidation.limit;
    editMutualValidation.limit = editForm && editForm.get('instance_min_count').value < control.value;
    if (editForm && lastValid !== editMutualValidation.limit) {
      editForm.controls.instance_min_count.updateValueAndValidity();
    }
    if (editForm) {
      editForm.controls.initial_min_instance_count.updateValueAndValidity();
    }
    return invalid ? { alertInvalidPolicyMaximumRange: { value: control.value } } : null;
  };
}
