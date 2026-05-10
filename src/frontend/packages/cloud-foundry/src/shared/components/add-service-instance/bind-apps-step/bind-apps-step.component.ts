import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, Input, OnDestroy, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, of as observableOf, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomFormFieldComponent, MatLabelComponent, CustomSelectComponent, CustomOptionComponent, pathGet, StepOnNextResult } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IServicePlan } from '../../../../cf-api-svc.types';
import { IApp } from '../../../../cf-api.types';
import { SchemaFormComponent, SchemaFormConfig } from '../../schema-form/schema-form.component';
import { CsiStateService } from '../csi-state.service';

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
  private csiState = inject(CsiStateService);
  private fb = inject(FormBuilder);


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

  constructor() {
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

  onEnter = (selectedServicePlan: APIResource<IServicePlan> | any) => {
    if (selectedServicePlan) {
      // Don't overwrite if it's null (we've returned to this step from the next)
      this.selectedServicePlan = selectedServicePlan;
    }

    // Plan shape is APIResource<IServicePlan> in the legacy ngrx flow and
    // StServicePlan in the signal-native flow. The schema lives at
    // `entity.schemas.…` in the former and `schemas.…` in the latter; try
    // both. When neither has a schema (e.g. a plan with no
    // service_binding.create parameters) we leave schema undefined and
    // mark the step valid below — the binding-params editor is optional.
    const schema =
      pathGet('entity.schemas.service_binding.create.parameters', this.selectedServicePlan) ??
      pathGet('schemas.service_binding.create.parameters', this.selectedServicePlan);

    if (!this.schemaFormConfig) {
      this.schemaFormConfig = { schema };
    } else {
      this.schemaFormConfig = {
        ...this.schemaFormConfig,
        initialData: this.bindingParams,
        schema,
      };
    }

    // Schema-form's pValidChange BehaviorSubject seeds at false and only
    // flips true once a JSON change or validation pass fires. For plans
    // with no binding-params schema neither happens, so without this the
    // Next button would stay disabled forever after picking an app.
    if (!schema) {
      this.validate.set(true);
    }
  }

  setBindingParams(data: any) {
    this.bindingParams = data;
  }

  setParamValid(valid: boolean) {
    // Binding params are optional — only let an explicit invalid signal
    // gate Next when there's actually a schema to violate. Without this,
    // schema-form's seed `false` on init flips validate off and the Next
    // button stays disabled even though the user hasn't typed anything.
    if (!valid && !this.schemaFormConfig?.schema) return;
    this.validate.set(valid);
  }

  submit = (): Observable<StepOnNextResult> => {
    this.csiState.setApp(this.apps.value, this.bindingParams);
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
