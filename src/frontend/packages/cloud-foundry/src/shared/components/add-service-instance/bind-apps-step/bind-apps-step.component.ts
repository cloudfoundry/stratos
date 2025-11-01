import { CommonModule } from '@angular/common';
import { CustomFormFieldComponent, MatLabelComponent } from '@stratosui/core';
import { AfterContentInit, Component, Input, OnDestroy, signal,
  ChangeDetectionStrategy} from '@angular/core';
import { ReactiveFormsModule,FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SetCreateServiceInstanceApp } from '../../../../../../cloud-foundry/src/actions/create-service-instance.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { pathGet } from '../../../../../../core/src/core/utils.service';
import { StepOnNextResult } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServicePlan } from '../../../../cf-api-svc.types';
import { IApp } from '../../../../cf-api.types';
import { SchemaFormComponent, SchemaFormConfig } from '../../schema-form/schema-form.component';

interface BindAppsForm {
  apps: FormControl<string | null>;
}

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    MatLabelComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    SchemaFormComponent
  ]
})
export class BindAppsStepComponent implements OnDestroy, AfterContentInit {

  @Input()
  boundAppId!: string;

  @Input()
  apps$!: Observable<APIResource<IApp>[]>;

  validate = signal<boolean>(true);
  serviceInstanceGuid!: string;
  stepperForm!: FormGroup<BindAppsForm>;
  guideText = 'Specify the application to bind (Optional)';
  selectedServicePlan!: APIResource<IServicePlan>;
  bindingParams: object = {};
  schemaFormConfig!: SchemaFormConfig;

  // Lifecycle management for subscriptions
  private destroyed$ = new Subject<void>();

  get apps(): FormControl<string | null> {
    return this.stepperForm.get('apps') as FormControl<string | null>;
  }

  constructor(
    private store: Store<CFAppState>,
    private fb: FormBuilder,
  ) {
    this.stepperForm = this.fb.group<BindAppsForm>({
      apps: new FormControl<string | null>(null),
    });
  }

  private setBoundApp() {
    if (this.boundAppId) {
      this.apps.setValue(this.boundAppId);
      this.apps.disable();
      this.guideText = 'Specify binding params (optional)';
    }
  }

  ngAfterContentInit() {
    this.setBoundApp();

    // Validate step based on app selection
    this.apps.valueChanges.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(app => {
      if (!app) {
        // If there's no app selected the step will always be valid
        this.validate.set(true);
      }
    });
  }

  onEnter = (selectedServicePlan: APIResource<IServicePlan>) => {
    if (selectedServicePlan) {
      // Don't overwrite if it's null (we've returned to this step from the next)
      this.selectedServicePlan = selectedServicePlan;
    }

    if (!this.schemaFormConfig) {
      // Create new config
      this.schemaFormConfig = {
        schema: pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan),
      };
    } else {
      // Update existing config (retaining any existing config)
      this.schemaFormConfig = {
        ...this.schemaFormConfig,
        initialData: this.bindingParams,
        schema: pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan)
      };
    }
  }

  setBindingParams(data: any) {
    this.bindingParams = data;
  }

  setParamValid(valid: boolean) {
    this.validate.set(valid);
  }

  submit = (): Observable<StepOnNextResult> => {
    this.store.dispatch(new SetCreateServiceInstanceApp(this.apps.value, this.bindingParams));
    return observableOf({
      success: true,
      data: this.selectedServicePlan
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

}
