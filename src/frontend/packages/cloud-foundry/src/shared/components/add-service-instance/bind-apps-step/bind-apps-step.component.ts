import { CommonModule, AsyncPipe } from '@angular/common';
import { type AfterContentInit, Component, Input, type OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { type Observable, of as observableOf, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomFormFieldComponent, MatLabelComponent, CustomSelectComponent, CustomOptionComponent, pathGet, type StepOnNextResult } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import { SetCreateServiceInstanceApp } from '../../../../actions/create-service-instance.actions';
import type { CFAppState } from '../../../../cf-app-state';
import type { IServicePlan } from '../../../../cf-api-svc.types';
import type { IApp } from '../../../../cf-api.types';
import { SchemaFormComponent, type SchemaFormConfig } from '../../schema-form/schema-form.component';

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
  bindingParams: Record<string, unknown> = {};
  schemaFormConfig!: SchemaFormConfig;

  // Lifecycle management for subscriptions
  private destroyed$ = new Subject<void>();

  get apps(): FormControl<string | null> {
    return this.stepperForm.get('apps') as FormControl<string | null>;
  }

  constructor(
    private store: Store,
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
        schema: pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan) as object,
      };
    } else {
      // Update existing config (retaining any existing config)
      this.schemaFormConfig = {
        ...this.schemaFormConfig,
        initialData: this.bindingParams,
        schema: pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan) as object
      };
    }
  }

  setBindingParams(data: unknown) {
    this.bindingParams = data as Record<string, unknown>;
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
