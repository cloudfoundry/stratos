import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { TailwindErrorStateMatcher, TailwindShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';
import { of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApplicationService } from '../../../../../cloud-foundry/src/features/applications/application.service';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { autoscalerTransformArrayToMap } from '../../../core/autoscaler-helpers/autoscaler-transform-policy';
import { PolicyAlert } from '../../../core/autoscaler-helpers/autoscaler-util';
import { numberWithFractionOrExceedRange } from '../../../core/autoscaler-helpers/autoscaler-validation';
import { EditAutoscalerPolicyDirective } from '../edit-autoscaler-policy-base-step';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';

interface EditLimitForm {
  instance_min_count: FormControl<number>;
  instance_max_count: FormControl<number>;
  timezone: FormControl<string>;
}

@Component({
  selector: 'app-edit-autoscaler-policy-step1',
  templateUrl: './edit-autoscaler-policy-step1.component.html',
  styleUrls: ['./edit-autoscaler-policy-step1.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: TailwindErrorStateMatcher, useClass: TailwindShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class EditAutoscalerPolicyStep1Component extends EditAutoscalerPolicyDirective implements OnInit {

  policyAlert = PolicyAlert;
  timezoneOptions = Intl.supportedValuesOf('timeZone');
  editLimitForm: FormGroup<EditLimitForm>;

  private editLimitValid = true;

  constructor(
    public applicationService: ApplicationService,
    private fb: FormBuilder,
    service: EditAutoscalerPolicyService,
    route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    super(service, route);
    this.editLimitForm = this.fb.group<EditLimitForm>({
      instance_min_count: this.fb.nonNullable.control(0, [Validators.required, this.validateGlobalLimitMin()]),
      instance_max_count: this.fb.nonNullable.control(0, [Validators.required, this.validateGlobalLimitMax()]),
      timezone: this.fb.nonNullable.control('', [Validators.required])
    });
  }

  ngOnInit() {
    this.service.updateFromStore(this.applicationService.appGuid, this.applicationService.cfGuid);
    this.appAutoscalerPolicy$ = this.service.getState().pipe(
      map(policy => {
        this.currentPolicy = policy;
        if (!this.currentPolicy.scaling_rules_form) {
          this.currentPolicy = autoscalerTransformArrayToMap(this.currentPolicy);
        }
        this.editLimitForm.controls.timezone.setValue(this.currentPolicy.schedules?.timezone ?? '');
        this.editLimitForm.controls.instance_min_count.setValue(this.currentPolicy.instance_min_count);
        this.editLimitForm.controls.instance_max_count.setValue(this.currentPolicy.instance_max_count);
        this.editLimitForm.controls.instance_min_count.setValidators([Validators.required, this.validateGlobalLimitMin()]);
        this.editLimitForm.controls.instance_max_count.setValidators([Validators.required, this.validateGlobalLimitMax()]);
        this.cdr.markForCheck();
        return this.currentPolicy;
      })
    );
  }

  onNext: StepOnNextFunction = () => {
    this.currentPolicy.instance_min_count = Math.floor(this.editLimitForm.get('instance_min_count')?.value ?? 0);
    this.currentPolicy.instance_max_count = Math.floor(this.editLimitForm.get('instance_max_count')?.value ?? 0);
    if (this.currentPolicy.schedules) {
      this.currentPolicy.schedules.timezone = this.editLimitForm.get('timezone')?.value ?? '';
    }
    this.service.setState(this.currentPolicy);
    return observableOf({ success: true });
  };

  validateGlobalLimitMin(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any, } => {
      const invalid = this.editLimitForm ?
        numberWithFractionOrExceedRange(control.value, 1, this.editLimitForm.get('instance_max_count').value - 1, true) : false;
      const lastValid = this.editLimitValid;
      this.editLimitValid = this.editLimitForm && control.value < this.editLimitForm.get('instance_max_count').value;
      if (this.editLimitForm && this.editLimitValid !== lastValid) {
        this.editLimitForm.controls.instance_max_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMinimumRange: { value: control.value } } : null;
    };
  }

  validateGlobalLimitMax(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any, } => {
      const invalid = this.editLimitForm ? numberWithFractionOrExceedRange(control.value,
        this.editLimitForm.get('instance_min_count').value + 1, Number.MAX_VALUE, true) : false;
      const lastValid = this.editLimitValid;
      this.editLimitValid = this.editLimitForm && this.editLimitForm.get('instance_min_count').value < control.value;
      if (this.editLimitForm && this.editLimitValid !== lastValid) {
        this.editLimitForm.controls.instance_min_count.updateValueAndValidity();
      }
      return invalid ? { alertInvalidPolicyMaximumRange: { value: control.value } } : null;
    };
  }
}
