import { CommonModule } from '@angular/common';
import { AppInputDirective, CustomFormFieldComponent, MatLabelComponent } from '@stratosui/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterContentInit, Component, Input, OnDestroy, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { AbstractControl, ValidatorFn, Validators, ReactiveFormsModule, FormsModule, FormControl, FormGroup } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { toObservable } from '@angular/core/rxjs-interop';

import {
  combineLatest as observableCombineLatest,
  from,
  Observable,
  Subscription,
} from 'rxjs';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  share,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import { safeStringToObj } from '../../../../../../core/src/core/utils.service';
import { StepOnNextResult } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { TailwindSnackBarService } from '../../../../../../core/src/shared/services/tailwind-snackbar.service';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { StServiceInstance, StServicePlan } from '../../../../services/endpoint-data/stratos-types';
import { AsyncJobResult, StratosJobError } from '../../../../services/async-jobs/async-job.types';
import { writeWithJob } from '../../../../services/async-jobs/write-with-job';
import { SchemaFormComponent, SchemaFormConfig } from '../../schema-form/schema-form.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CreateServiceFormMode, CsiModeService } from '../csi-mode.service';
import { CsiState, CsiStateService } from '../csi-state.service';

@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    MatLabelComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    SchemaFormComponent
  ]
})
export class SpecifyDetailsStepComponent implements OnDestroy, AfterContentInit {
  private cSIHelperServiceFactory = inject(CreateServiceInstanceHelperServiceFactory);
  private csiGuidsService = inject(CsiGuidsService);
  private csiState = inject(CsiStateService);
  modeService = inject(CsiModeService);
  private http = inject(HttpClient);
  private snackBar = inject(TailwindSnackBarService);
  // toObservable() must run inside an injection context — lift to a class
  // field. Reused by selectCreateInstance$ and onNext below.
  private csiState$ = toObservable(this.csiState.state);

  serviceInstancesInit$: Observable<boolean>;
  hasInstances$: Observable<boolean>;
  serviceInstanceName!: string;
  serviceInstanceGuid!: string;
  selectCreateInstance$: Observable<CsiState>;
  formModes = [
    {
      label: 'Create and Bind to a new Service Instance',
      key: CreateServiceFormMode.CreateServiceInstance
    },
    {
      label: 'Bind to an Existing Service Instance',
      key: CreateServiceFormMode.BindServiceInstance
    }
  ];
  @Input()
  showModeSelection = false;

  @Input() appId!: string;

  formMode!: CreateServiceFormMode;

  selectExistingInstanceForm!: FormGroup<{
    serviceInstance: FormControl<string>;
  }>;
  createNewInstanceForm!: FormGroup<{
    name: FormControl<string>;
    servicePlan: FormControl<string>;
    spaceGuid: FormControl<string>;
    params: FormControl<object>;
    tags: FormControl<string[]>;
  }>;
  serviceInstances$: Observable<StServiceInstance[]>;
  bindableServiceInstances$: Observable<StServiceInstance[]>;
  cSIHelperService!: CreateServiceInstanceHelper;
  allServiceInstances$!: Observable<StServiceInstance[]>;
  private _validate = signal<boolean>(false);
  validate = toObservable(this._validate);
  allServiceInstanceNames!: string[];
  tagsVisible = true;
  tagsSelectable = true;
  tagsRemovable = true;
  tagsAddOnBlur = true;
  tags: string[] = [];
  spaceScopeSub!: Subscription;
  bindExistingInstance = false;
  subscriptions: Subscription[] = [];
  private _serviceParamsValid = signal<boolean>(false);
  serviceParamsValid = toObservable(this._serviceParamsValid);
  serviceParams: object = {};
  schemaFormConfig!: SchemaFormConfig;


  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any, } =>
      !this.checkName(formField.value) ? { nameTaken: { value: formField.value } } : null;
  };

  constructor() {
    this.setupForms();

    this.selectCreateInstance$ = this.csiState$.pipe(
      filter(p => !!p && !!p.servicePlanGuid && !!p.spaceGuid && !!p.cfGuid && !!p.serviceGuid),
      share(),
    );
    this.serviceInstances$ = this.selectCreateInstance$.pipe(
      distinctUntilChanged((x, y) => {
        return (x.servicePlanGuid === y.servicePlanGuid && x.spaceGuid === y.spaceGuid);
      }),
      switchMap(guids => {
        this.cSIHelperService = this.cSIHelperServiceFactory.create(guids.cfGuid, guids.serviceGuid);
        return this.cSIHelperService.serviceInstances$(guids.servicePlanGuid, guids.spaceGuid);
      }),
      publishReplay(1),
      refCount(),
    );

    this.serviceInstancesInit$ = this.serviceInstances$.pipe(
      filter(p => !!p),
      map(_o => false),
      startWith(false)
    );
    this.hasInstances$ = this.serviceInstances$.pipe(
      filter(p => !!p),
      map(p => p.length > 0),
    );

    // V3 StServiceInstance doesn't carry inline service_bindings (bindings
    // are loaded per-app via /cf/apps/:cnsiGuid/:appGuid/service_bindings).
    // The legacy "(Already bound)" annotation is dropped here; the bind
    // call surfaces a clear error if the user picks an instance that is
    // already bound. Re-introduce the annotation when this stepper
    // integrates with the bindings-per-app signal.
    this.bindableServiceInstances$ = this.serviceInstances$;
  }

  onEnter = (selectedServicePlan: StServicePlan) => {
    const schema = this.modeService.isEditServiceInstanceMode() ?
      selectedServicePlan?.schemas?.serviceInstance?.update?.parameters :
      selectedServicePlan?.schemas?.serviceInstance?.create?.parameters;

    if (!this.schemaFormConfig) {
      // Create new config
      this.schemaFormConfig = {
        schema
      };
    } else {
      // Update existing config (retaining any existing config)
      this.schemaFormConfig = {
        ...this.schemaFormConfig,
        initialData: this.serviceParams,
        schema
      };
    }

    this.formMode = CreateServiceFormMode.CreateServiceInstance;
    this.allServiceInstances$ = this.cSIHelperService.serviceInstances$();
    if (this.modeService.isEditServiceInstanceMode()) {
      this.csiState$.pipe(
        take(1),
        tap(state => {
          this.createNewInstanceForm.controls.name.setValue(state.name);

          this.schemaFormConfig.initialData = safeStringToObj(state.parameters) || this.serviceParams;

          this.serviceInstanceGuid = state.serviceInstanceGuid;
          this.serviceInstanceName = state.name;
          this.createNewInstanceForm.updateValueAndValidity();
          if (state.tags) {
            this.tags = [].concat(state.tags);
          }
        })
      ).subscribe();
    }
    this.subscriptions.push(this.setupFormValidatorData());
  };

  setServiceParams(data: any) {
    // schema-form emits `null`/`undefined` when the JSON editor is empty,
    // and buildWriteBody later runs `Object.keys(params)` which throws
    // "Cannot convert undefined or null to object" on a nullish value.
    // Coerce to {} so the no-params path is the same as an empty object.
    this.serviceParams = data ?? {};
  }

  setParamsValid(valid: boolean) {
    // Service-instance params are optional when the plan exposes no
    // schema (or only optional fields). schema-form's pValidChange seeds
    // at false and only flips true on a real value change, which never
    // fires for an empty/no-schema editor. Without this guard the Create
    // button stays disabled even though the user has nothing to enter.
    if (!valid && !this.schemaFormConfig?.schema) {
      this._serviceParamsValid.set(true);
      return;
    }
    this._serviceParamsValid.set(valid);
  }

  resetForms = (mode: CreateServiceFormMode) => {
    this._validate.set(false);
    this.createNewInstanceForm.reset();
    this.selectExistingInstanceForm.reset();
    if (mode === CreateServiceFormMode.CreateServiceInstance) {
      this.tags = [];
      this.bindExistingInstance = false;
    } else if (mode === CreateServiceFormMode.BindServiceInstance) {
      this.bindExistingInstance = true;
    }
  };

  private setupFormValidatorData(): Subscription {
    return this.allServiceInstances$.pipe(
      combineLatest(this.csiState$),
      filter(([, state]) => !!state.spaceGuid),
      map(([instances, state]) => instances.filter(s => {
        let filterSelf = false;
        if (this.modeService.isEditServiceInstanceMode()) {
          filterSelf = s.name === state.name;
        }
        return s.space?.guid === state.spaceGuid && !filterSelf;
      })),
      tap(o => {
        this.allServiceInstanceNames = o.map(s => s.name);
      }),
    ).subscribe();
  }

  private setupForms() {
    this.createNewInstanceForm = new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, this.nameTakenValidator(), Validators.maxLength(50)] }),
      servicePlan: new FormControl('', { nonNullable: true }),
      spaceGuid: new FormControl('', { nonNullable: true }),
      params: new FormControl({}, { nonNullable: true }),
      tags: new FormControl<string[]>([], { nonNullable: true }),
    });
    this.selectExistingInstanceForm = new FormGroup({
      serviceInstance: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
  }

  setOrg = (guid: string) => this.csiState.setOrg(guid);

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  ngAfterContentInit() {
    this.setupValidate();
  }

  // Single signal-native write path: POST or PATCH /pp/v1/cf/service_instances
  // wrapped in writeWithJob. Replaces the prior ngrx
  // cfEntityCatalog.serviceInstance.actions.create/update pipeline plus the
  // separate LongRunningCfOperationsService handoff — writeWithJob's
  // fast-path-then-poll contract is the long-running mechanism now.
  onNext = (): Observable<StepOnNextResult> => {
    return this.csiState$.pipe(
      filter(p => !!p),
      take(1),
      switchMap(state => from(this.executeWrite(state))),
    );
  };

  routeToServices = (successMessage?: string): StepOnNextResult => {
    if (successMessage) {
      // Stepper redirects on success but doesn't surface a confirmation;
      // without this snackbar the user sees the wizard "blink" back to
      // the marketplace with no feedback that the instance / binding
      // actually succeeded.
      this.snackBar.open(successMessage, 'Dismiss', { duration: 4000 });
    }
    return {
      success: true,
      // We should always go back to where we came from, aka 'cancel' location.
      redirect: true,
    };
  };

  private async executeWrite(state: CsiState): Promise<StepOnNextResult> {
    // "Bind to existing instance" branch: skip the SI write entirely; the
    // selected instance already exists. Just trigger the bind flow.
    if (this.bindExistingInstance) {
      const existingGuid = this.selectExistingInstanceForm.controls.serviceInstance.value;
      return this.bindAppIfRequested(existingGuid, state);
    }

    const isEditMode = this.modeService.isEditServiceInstanceMode();
    const verb = isEditMode ? 'update' : 'create';
    const body = this.buildWriteBody(state, isEditMode);

    const url = isEditMode
      ? `/pp/v1/cf/service_instances/${state.cfGuid}/${state.serviceInstanceGuid}`
      : `/pp/v1/cf/service_instances/${state.cfGuid}`;
    const call = isEditMode
      ? this.http.patch(url, body, { observe: 'response' as const })
      : this.http.post(url, body, { observe: 'response' as const });

    let result: AsyncJobResult<unknown>;
    try {
      result = await writeWithJob<unknown>(this.http, call);
    } catch (err: unknown) {
      return {
        success: false,
        message: `Failed to ${verb} service instance: ${extractErrorMessage(err)}`,
      };
    }

    if (isEditMode) {
      return this.routeToServices(`Service instance "${state.name}" updated.`);
    }

    // Create path: try to extract the new SI's guid for the bind-after-create
    // follow-up. UNKNOWN (HA-degradation) and slow-async paths without a
    // resource link both leave the guid undefined — in that case the SI will
    // appear in the services wall once CF settles and the user binds manually.
    const newGuid = extractCreatedSiGuid(result);
    if (newGuid) {
      this.csiState.setServiceInstanceGuid(newGuid);
    }
    return this.bindAppIfRequested(newGuid, state);
  }

  private async bindAppIfRequested(siGuid: string | undefined, state: CsiState): Promise<StepOnNextResult> {
    const siName = state.name || 'Service instance';
    if (!state.bindAppGuid || !siGuid) {
      return this.routeToServices(`Service instance "${siName}" created.`);
    }
    const bindResult = await this.modeService.createApplicationServiceBinding(
      siGuid,
      state.cfGuid,
      state.bindAppGuid,
      state.bindAppParams,
    ).pipe(take(1)).toPromise() as { success: boolean; message?: string };
    if (!bindResult?.success) {
      return {
        success: false,
        message: `Failed to create service instance binding: ${bindResult?.message ?? 'unknown error'}`,
      };
    }
    // Refetch env vars for app, since they have been changed by CF
    cfEntityCatalog.appEnvVar.api.getMultiple(state.bindAppGuid, state.cfGuid);
    return this.routeToServices(`Service instance "${siName}" created and bound.`);
  }

  private buildWriteBody(state: CsiState, isEditMode: boolean): Record<string, unknown> {
    const name = this.createNewInstanceForm.controls.name.value;
    const params = this.serviceParams;
    const tags = this.tags.length > 0 ? [...this.tags] : [];

    if (isEditMode) {
      // PATCH: only include fields the user can edit. Plan/space relations
      // stay fixed via the v3 PATCH semantics on managed instances.
      const body: Record<string, unknown> = { name };
      if (Object.keys(params).length > 0) body.parameters = params;
      body.tags = tags;
      return body;
    }

    // POST: managed-instance v3 shape.
    const body: Record<string, unknown> = {
      type: 'managed',
      name,
      relationships: {
        space: { data: { guid: state.spaceGuid } },
        service_plan: { data: { guid: state.servicePlanGuid } },
      },
    };
    if (Object.keys(params).length > 0) body.parameters = params;
    if (tags.length > 0) body.tags = tags;
    return body;
  }

  private setupValidate() {
    // For a new service instance the step is valid if the form and service params are both valid
    this.subscriptions.push(
      observableCombineLatest([
        this.serviceParamsValid,
        this.createNewInstanceForm.statusChanges
      ]).pipe(
        map(([serviceParamsValid, _b]) => this._validate.set(serviceParamsValid && this.createNewInstanceForm.valid))
      ).subscribe()
    );
    // For existing service instance the step is valid if the form is (there's no service params)
    this.subscriptions.push(this.selectExistingInstanceForm.statusChanges.pipe(
      map(() => this._validate.set(this.selectExistingInstanceForm.valid))
    ).subscribe());
  }

  addTagFromInput(event: KeyboardEvent): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if ((value || '').trim()) {
      this.tags.push(value.trim());
      this.updateTagsFormControl();
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
      this.updateTagsFormControl();
    }
  }

  private updateTagsFormControl(): void {
    this.createNewInstanceForm.controls.tags.setValue(this.tags);
    this.createNewInstanceForm.controls.tags.markAsTouched();
  }

  checkName = (value: string = null) => {
    if (this.allServiceInstanceNames) {
      const specifiedName = value || this.createNewInstanceForm.controls.name.value;
      if (this.modeService.isEditServiceInstanceMode() && specifiedName === this.serviceInstanceName) {
        return true;
      }
      return this.allServiceInstanceNames.indexOf(value || this.createNewInstanceForm.controls.name.value) === -1;
    }
    return true;
  };

}

// Pulls the new service-instance guid out of writeWithJob's terminal result.
// translateCFJobResult emits `links.service_instance: '/v3/service_instances/<guid>'`
// on managed creates; writeWithJob normalises both fast-path and polled
// shapes to that bare-result level. UNKNOWN status / missing links return
// undefined and the caller skips auto-bind.
function extractCreatedSiGuid(result: AsyncJobResult<unknown>): string | undefined {
  if (result.status !== 'COMPLETE' || !result.state) return undefined;
  const links = (result.state as { links?: Record<string, string> }).links;
  const href = links?.service_instance;
  if (!href) return undefined;
  const m = href.match(/\/([^/]+)\/?$/);
  return m?.[1];
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof StratosJobError) return err.message;
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      // Backend can respond with three shapes:
      //  - CF passthrough: { errors: [{ detail, title, code }] }
      //  - Stratos job envelope: { state, errors: [{ message, code, detail }] }
      //  - handleCapiError fallback: { error: "..." }
      // Walk all three so the user sees what actually broke instead of
      // Angular's generic "Http failure response for ... 502 OK".
      const errors = (body as { errors?: Array<{ detail?: unknown; title?: string; message?: string }> }).errors;
      const first = errors?.[0];
      if (first) {
        if (typeof first.detail === 'string' && first.detail) return first.detail;
        if (first.title) return first.title;
        if (first.message) return first.message;
      }
      const top = body as { message?: string; error?: string };
      if (top.message) return top.message;
      if (top.error) return top.error;
    }
    if (typeof body === 'string' && body) return body;
    return err.statusText && err.statusText !== 'OK'
      ? `HTTP ${err.status} ${err.statusText}`
      : `HTTP ${err.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'unknown error';
}
