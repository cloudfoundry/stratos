import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { TailwindErrorStateMatcher, TailwindShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { BehaviorSubject, of as observableOf } from 'rxjs';
import { take, filter, map, pairwise } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { StepOnNextFunction } from '@stratosui/core';
import { AppState, EntityService, EntityServiceFactory, RequestInfoState } from '@stratosui/store';
import { AutoscalerConstants, PolicyAlert } from '../../../core/autoscaler-helpers/autoscaler-util';
import {
  dateTimeIsSameOrAfter,
  numberWithFractionOrExceedRange,
  specificDateRangeOverlapping } from '../../../core/autoscaler-helpers/autoscaler-validation';
import { CreateAppAutoscalerPolicyAction, UpdateAppAutoscalerPolicyAction } from '../../../store/app-autoscaler.actions';
import {
  AppAutoscalerInvalidPolicyError,
  AppAutoscalerPolicyLocal,
  AppSpecificDate } from '../../../store/app-autoscaler.types';
import { EditAutoscalerPolicyDirective } from '../edit-autoscaler-policy-base-step';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
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
  styleUrls: ['./edit-autoscaler-policy-step4.component.scss'],
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
  private store = inject<Store<AppState>>(Store);
  private fb = inject(FormBuilder);
  private entityServiceFactory = inject(EntityServiceFactory);
  private cdr = inject(ChangeDetectorRef);


  policyAlert = PolicyAlert;
  editSpecificDateForm: FormGroup<EditSpecificDateForm>;

  private updateAppAutoscalerPolicyService!: EntityService;
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
  private action!: CreateAppAutoscalerPolicyAction | UpdateAppAutoscalerPolicyAction;
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
    this.action = this.isCreate ?
      new CreateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy) :
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy);
    this.createUpdateTest = this.isCreate ? 'create policy' : 'update policy';
    this.updateAppAutoscalerPolicyService = this.entityServiceFactory.create(
      this.applicationService.appGuid,
      this.action
    );
  }

  updatePolicy: StepOnNextFunction = () => {
    if (this.validateGlobalSetting()) {
      return observableOf({
        success: false,
        message: `Could not ${this.createUpdateTest}: ${PolicyAlert.alertInvalidPolicyTriggerScheduleEmpty}` });
    }
    this.action.policy = this.currentPolicy;
    this.store.dispatch(this.action);
    return this.updateAppAutoscalerPolicyService.entityMonitor.entityRequest$.pipe(
      pairwise(),
      filter(([oldV, newV]) => !!oldV && !!newV),
      filter(([oldV, newV]) => this.getBusyState(oldV) && !this.getBusyState(newV)),
      map(([, newV]) => this.getStateResult(newV)),
      map(request => ({
        success: !request.error,
        redirect: !request.error,
        message: request.error ? `Could not ${this.createUpdateTest}${request.message ? `: ${request.message}` : ''}` : null
      })),
      take(1),
    );
  };

  private getStateResult(info: RequestInfoState): { error: boolean, message: string } {
    if (this.isCreate) {
      return {
        error: info.error,
        message: info.message
      };
    }
    const updatingState = info.updating[UpdateAppAutoscalerPolicyAction.updateKey];
    return {
      error: updatingState.error,
      message: updatingState.message
    };
  }

  private getBusyState(info: RequestInfoState): boolean {
    if (this.isCreate) {
      return info.creating;
    }
    return info.updating[UpdateAppAutoscalerPolicyAction.updateKey] && info.updating[UpdateAppAutoscalerPolicyAction.updateKey].busy;
  }

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
