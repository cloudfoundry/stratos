import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import * as moment from 'moment-timezone';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, take } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { EntityService } from '../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { cloneObject } from '../../../../core/utils.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { GetAppAutoscalerPolicyAction, UpdateAppAutoscalerPolicyAction } from '../../app-autoscaler.actions';
import { AppAutoscalerPolicy, AppAutoscalerPolicyLocal } from '../../app-autoscaler.types';
import { MomentFormateDateTimeT, PolicyAlert, PolicyDefaultSpecificDate } from '../../autoscaler-helpers/autoscaler-util';
import {
  dateTimeIsSameOrAfter,
  numberWithFractionOrExceedRange,
  specificDateRangeOverlapping,
} from '../../autoscaler-helpers/autoscaler-validation';
import { appAutoscalerUpdatedPolicySchemaKey } from '../../autoscaler.store.module';
import { EditAutoscalerPolicy } from '../edit-autoscaler-policy-base-step';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';

@Component({
  selector: 'app-edit-autoscaler-policy-step4',
  templateUrl: './edit-autoscaler-policy-step4.component.html',
  styleUrls: ['./edit-autoscaler-policy-step4.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep4Component extends EditAutoscalerPolicy implements OnInit {

  policyAlert = PolicyAlert;
  editSpecificDateForm: FormGroup;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  private updateAppAutoscalerPolicyService: EntityService;
  public currentPolicy: AppAutoscalerPolicyLocal;
  private editIndex = -1;
  private editMutualValidation = {
    limit: true,
    datetime: true
  };

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private entityServiceFactory: EntityServiceFactory,
    service: EditAutoscalerPolicyService
  ) {
    super(service);
    this.editSpecificDateForm = this.fb.group({
      instance_min_count: [0],
      instance_max_count: [0],
      initial_min_instance_count: [0, [this.validateSpecificDateInitialMin()]],
      start_date_time: [0, [Validators.required, this.validateSpecificDateStartDateTime()]],
      end_date_time: [0, [Validators.required, this.validateSpecificDateEndDateTime()]]
    });
  }

  ngOnInit() {
    super.ngOnInit();
    this.updateAppAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerUpdatedPolicySchemaKey,
      entityFactory(appAutoscalerUpdatedPolicySchemaKey),
      this.applicationService.appGuid,
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy),
      false
    );
  }

  updatePolicy: StepOnNextFunction = () => {
    this.store.dispatch(
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy)
    );
    let waitForAppAutoscalerUpdateStatus$: Observable<any>;
    waitForAppAutoscalerUpdateStatus$ = this.updateAppAutoscalerPolicyService.entityMonitor.entityRequest$.pipe(
      filter(request => !!request.error || !!request.response),
      map(request => {
        const msg = request.message;
        request.error = false;
        request.response = null;
        request.message = '';
        return msg;
      }),
      distinctUntilChanged(),
    ).pipe(map(errorMessage => {
      if (errorMessage) {
        return {
          success: false,
          message: `Could not update policy: ${errorMessage}`,
        };
      } else {
        return {
          success: true,
          redirect: true
        };
      }
    }));
    return waitForAppAutoscalerUpdateStatus$.pipe(take(1), map(res => {
      this.store.dispatch(
        new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid)
      );
      return {
        ...res,
      };
    }));
  }

  addSpecificDate = () => {
    this.currentPolicy.schedules.specific_date.push(cloneObject(PolicyDefaultSpecificDate));
    this.editSpecificDate(this.currentPolicy.schedules.specific_date.length - 1);
  }

  removeSpecificDate(index: number) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    this.currentPolicy.schedules.specific_date.splice(index, 1);
  }

  editSpecificDate(index: number) {
    this.editIndex = index;
    this.editSpecificDateForm.setValue({
      instance_min_count: this.currentPolicy.schedules.specific_date[index].instance_min_count,
      instance_max_count: Math.abs(Number(this.currentPolicy.schedules.specific_date[index].instance_max_count)),
      initial_min_instance_count: this.currentPolicy.schedules.specific_date[index].initial_min_instance_count,
      start_date_time: this.currentPolicy.schedules.specific_date[index].start_date_time,
      end_date_time: this.currentPolicy.schedules.specific_date[index].end_date_time,
    });
    this.editSpecificDateForm.controls.instance_min_count.setValidators([Validators.required,
    validateRecurringSpecificMin(this.editSpecificDateForm, this.editMutualValidation)]);
    this.editSpecificDateForm.controls.instance_max_count.setValidators([Validators.required,
    validateRecurringSpecificMax(this.editSpecificDateForm, this.editMutualValidation)]);
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
      const errors: any = {};
      const newSchedule = { start_date_time: control.value, end_date_time: this.editSpecificDateForm.get('end_date_time').value };
      const lastValid = this.editMutualValidation.datetime;
      this.editMutualValidation.datetime = true;
      if (dateTimeIsSameOrAfter(moment().tz(this.currentPolicy.schedules.timezone).format(MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleStartDateTimeBeforeNow = { value: control.value };
      }
      if (dateTimeIsSameOrAfter(control.value, this.editSpecificDateForm.get('end_date_time').value)) {
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
      const errors: any = {};
      const newSchedule = { start_date_time: this.editSpecificDateForm.get('start_date_time').value, end_date_time: control.value };
      const lastValid = this.editMutualValidation.datetime;
      this.editMutualValidation.datetime = true;
      if (dateTimeIsSameOrAfter(moment().tz(this.currentPolicy.schedules.timezone).format(MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeNow = { value: control.value };
      }
      if (dateTimeIsSameOrAfter(this.editSpecificDateForm.get('start_date_time').value, control.value)) {
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
}

export function validateRecurringSpecificMin(editForm, editMutualValidation): ValidatorFn {
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
    console.log(invalid);
    return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
  };
}

export function validateRecurringSpecificMax(editForm, editMutualValidation): ValidatorFn {
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
