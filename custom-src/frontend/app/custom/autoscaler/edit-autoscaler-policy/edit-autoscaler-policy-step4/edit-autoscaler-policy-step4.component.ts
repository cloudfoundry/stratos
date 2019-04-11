import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, distinctUntilChanged, publishReplay, refCount, first } from 'rxjs/operators';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { ApplicationService } from '../../../../features/applications/application.service';
import { EntityService } from '../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerUpdatedPolicySchemaKey
} from '../../../../../../store/src/helpers/entity-factory';
import { GetAppAutoscalerPolicyAction, UpdateAppAutoscalerPolicyAction } from '../../../../../../store/src/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../../../../store/src/types/app-autoscaler.types';
import {
  MomentFormateDateTimeT, PolicyAlert, PolicyDefaultSpecificDate
} from '../../../../../../store/src/helpers/autoscaler/autoscaler-util';
import {
  numberWithFractionOrExceedRange,
  dateTimeIsSameOrAfter,
  specificDateRangeOverlapping
} from '../../../../../../store/src/helpers/autoscaler/autoscaler-validation';
import * as moment from 'moment-timezone';
import { selectUpdateAutoscalerPolicyState } from '../../../../../../store/src/effects/autoscaler.effects';

@Component({
  selector: 'app-edit-autoscaler-policy-step4',
  templateUrl: './edit-autoscaler-policy-step4.component.html',
  styleUrls: ['./edit-autoscaler-policy-step4.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyStep4Component implements OnInit, OnDestroy {

  policyAlert = PolicyAlert;
  editSpecificDateForm: FormGroup;
  submitMessage = '';
  submitStatus = true;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  private editLimitValid = true;
  private editSpecificDateTimeValid = true;
  private appAutoscalerPolicyErrorSub: Subscription;
  private currentPolicy: any;
  private editIndex = -1;

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.editSpecificDateForm = this.fb.group({
      instance_min_count: [0, [Validators.required, this.validateRecurringSpecificMin()]],
      instance_max_count: [0, [Validators.required, this.validateRecurringSpecificMax()]],
      initial_min_instance_count: [0, [this.validateSpecificDateInitialMin()]],
      start_date_time: [0, [Validators.required, this.validateSpecificDateStartDateTime()]],
      end_date_time: [0, [Validators.required, this.validateSpecificDateEndDateTime()]]
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

    let waitForAppAutoscalerUpdateStatus$: Observable<any>;
    waitForAppAutoscalerUpdateStatus$ = updateAppAutoscalerPolicyService.waitForEntity$.pipe(publishReplay(1), refCount());
    waitForAppAutoscalerUpdateStatus$
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
    return observableOf({ success: this.submitStatus, message: this.submitMessage});
  }

  addSpecificDate = () => {
    this.currentPolicy.schedules.specific_date.push(PolicyDefaultSpecificDate);
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
      const lastValid = this.editSpecificDateTimeValid;
      this.editSpecificDateTimeValid = true;
      const errors: any = {};
      if (dateTimeIsSameOrAfter(moment().tz(this.currentPolicy.schedules.timezone).format(MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleStartDateTimeBeforeNow = { value: control.value };
      }
      if (dateTimeIsSameOrAfter(control.value, this.editSpecificDateForm.get('end_date_time').value)) {
        this.editSpecificDateTimeValid = false;
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = { value: control.value };
      }
      if (specificDateRangeOverlapping(newSchedule, this.editIndex, this.currentPolicy.schedules.specific_date)) {
        this.editSpecificDateTimeValid = false;
        errors.alertInvalidPolicyScheduleSpecificConflict = { value: control.value };
      }
      if (this.editSpecificDateForm && lastValid !== this.editSpecificDateTimeValid) {
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
      const newSchedule = {
        start_date_time: this.editSpecificDateForm.get('start_date_time').value,
        end_date_time: control.value
      };
      const lastValid = this.editSpecificDateTimeValid;
      this.editSpecificDateTimeValid = true;
      const errors: any = {};
      if (dateTimeIsSameOrAfter(moment().tz(this.currentPolicy.schedules.timezone).format(MomentFormateDateTimeT), control.value)) {
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeNow = { value: control.value };
      }
      if (dateTimeIsSameOrAfter(this.editSpecificDateForm.get('start_date_time').value, control.value)) {
        this.editSpecificDateTimeValid = false;
        errors.alertInvalidPolicyScheduleEndDateTimeBeforeStartDateTime = { value: control.value };
      }
      if (specificDateRangeOverlapping(newSchedule, this.editIndex, this.currentPolicy.schedules.specific_date)) {
        this.editSpecificDateTimeValid = false;
        errors.alertInvalidPolicyScheduleSpecificConflict = { value: control.value };
      }
      if (this.editSpecificDateForm && lastValid !== this.editSpecificDateTimeValid) {
        this.editSpecificDateForm.controls.start_date_time.updateValueAndValidity();
      }
      return Object.keys(errors).length === 0 ? null : errors;
    };
  }

  validateRecurringSpecificMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editSpecificDateForm &&
      numberWithFractionOrExceedRange(control.value, 1, this.editSpecificDateForm.get('instance_max_count').value - 1, true);
      const lastValid = this.editLimitValid;
      this.editLimitValid = this.editSpecificDateForm && control.value < this.editSpecificDateForm.get('instance_max_count').value;
      if (this.editSpecificDateForm && lastValid !== this.editLimitValid) {
        this.editSpecificDateForm.controls.instance_max_count.updateValueAndValidity();
      }
      if (this.editSpecificDateForm) {
        this.editSpecificDateForm.controls.initial_min_instance_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
    };
  }

  validateRecurringSpecificMax(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const invalid = this.editSpecificDateForm && numberWithFractionOrExceedRange(control.value,
        this.editSpecificDateForm.get('instance_min_count').value + 1, Number.MAX_VALUE, true);
      const lastValid = this.editLimitValid;
      this.editLimitValid =
        this.editSpecificDateForm && this.editSpecificDateForm.get('instance_min_count').value < control.value;
      if (this.editSpecificDateForm && lastValid !== this.editLimitValid) {
        this.editSpecificDateForm.controls.instance_min_count.updateValueAndValidity();
      }
      if (this.editSpecificDateForm) {
        this.editSpecificDateForm.controls.initial_min_instance_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMaximumRange: { value: control.value } } : null;
    };
  }
}
