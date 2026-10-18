import { CommonModule } from '@angular/common';
import { AppErrorComponent, AppInputDirective, CustomFormFieldComponent, MatLabelComponent } from '@stratosui/core';
import { HttpClient } from '@angular/common/http';
import { AfterContentInit, Component, DestroyRef, ElementRef, Injector, afterNextRender, computed, effect, input, signal, viewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule, FormsModule, FormControl, FormGroup } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import {
  combineLatest as observableCombineLatest,
  firstValueFrom,
  from,
  Observable,
  Subscription,
} from 'rxjs';
import {
  combineLatestWith,
  distinctUntilChanged,
  filter,
  map,
  share,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import { safeStringToObj } from '../../../../../../core/src/core/utils.service';
import { StepOnNextResult } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { TailwindSnackBarRef, TailwindSnackBarService } from '../../../../../../core/src/shared/services/tailwind-snackbar.service';
import { ServiceCatalogDataService, SignalSource } from '../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceInstance, StServicePlan } from '../../../../services/endpoint-data/stratos-types';
import { AsyncJobResult } from '../../../../services/async-jobs/async-job.types';
import { unknownHow, unknownOutcomeMessage } from '../../../../services/async-jobs/unknown-outcome-message';
import { SignedOutError, jobTrackingLimitMs, writeWithJob } from '../../../../services/async-jobs/write-with-job';
import { TrackedJob, TrackedJobsService, coarseElapsed } from '../../../../services/async-jobs/tracked-jobs.service';
import { SchemaFormComponent, SchemaFormConfig } from '../../schema-form/schema-form.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CreateServiceFormMode, CsiModeService } from '../csi-mode.service';
import { CsiState, CsiStateService } from '../csi-state.service';
import { extractHttpErrorMessage } from '@stratosui/store';

// Local view of the schema-form config while it is being assembled: the
// broker schema may not have arrived (or may not exist for the plan).
// SchemaFormComponent.config tolerates an absent schema.
type SchemaFormConfigState = Omit<SchemaFormConfig, 'schema'> & { schema?: object };

// How long the wizard holds the user on a write before asking whether to keep
// waiting. The broker decides how long CF takes: a 15 s broker operation
// already takes about a minute in CF, and real brokers take minutes.
const HAND_OFF_AFTER_MS = 30_000;
// Every wait is bounded: the user picks the next one from this range, and a
// question nobody answers within PROMPT_ANSWER_S hands the write off.
const MIN_WAIT_S = 30;
const MAX_WAIT_S = 600;
const PROMPT_ANSWER_S = 30;

type WaitAnswer = number | 'background';

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
    AppErrorComponent,
    AppInputDirective,
    CustomFormFieldComponent,
    MatLabelComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    SchemaFormComponent
  ]
})
export class SpecifyDetailsStepComponent implements AfterContentInit {
  private cSIHelperServiceFactory = inject(CreateServiceInstanceHelperServiceFactory);
  private csiGuidsService = inject(CsiGuidsService);
  private csiState = inject(CsiStateService);
  private serviceCatalog = inject(ServiceCatalogDataService);
  modeService = inject(CsiModeService);
  private http = inject(HttpClient);
  private snackBar = inject(TailwindSnackBarService);
  private destroyRef = inject(DestroyRef);
  private trackedJobs = inject(TrackedJobsService);
  private readonly slowWriteQuestion = viewChild<ElementRef<HTMLElement>>('slowWriteQuestion');
  private injector = inject(Injector);

  // The question shown while a write outlasts the wait; null when not asking.
  readonly slowWrite = signal<{ text: string; answerIn: number } | null>(null);
  readonly waitSeconds = signal<number>(60);
  readonly waitSecondsValid = computed(() => {
    const s = this.waitSeconds();
    return Number.isInteger(s) && s >= MIN_WAIT_S && s <= MAX_WAIT_S;
  });
  readonly minWaitS = MIN_WAIT_S;
  readonly maxWaitS = MAX_WAIT_S;
  private answerSlowWrite?: (answer: WaitAnswer) => void;
  private answerCountdown?: ReturnType<typeof setInterval>;
  // Snackbars stack: the hand-off notice comes down before the outcome shows.
  private handOffNotice?: TailwindSnackBarRef<unknown>;
  // toObservable() must run inside an injection context — lift to a class
  // field. Reused by selectCreateInstance$ and onNext below.
  private csiState$ = toObservable(this.csiState.state);

  serviceInstancesInit$: Observable<boolean>;
  hasInstances$: Observable<boolean>;
  serviceInstanceName!: string;
  // Only populated in edit mode (from the wizard state, which may carry a
  // null/undefined guid until the SI is resolved).
  serviceInstanceGuid?: string | null;
  selectCreateInstance$: Observable<CsiState & {
    servicePlanGuid: string; spaceGuid: string; cfGuid: string; serviceGuid: string;
  }>;
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
  readonly showModeSelection = input(false);

  // Signal (not a plain field): the stepper delivers onEnter after this
  // component's activating render, outside change detection. The first
  // render happens with formMode unset (every @if false), so under
  // zoneless+OnPush a plain-field write in onEnter would never re-render
  // the template — the step stayed empty in app-bind mode.
  formMode = signal<CreateServiceFormMode | undefined>(undefined);

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
  // Signal: seeded from wizard state in an async callback, which a plain
  // field would not re-render under zoneless+OnPush.
  readonly tags = signal<string[]>([]);
  bindExistingInstance = false;
  private formValidatorData?: Subscription;
  private _serviceParamsValid = signal<boolean>(false);
  serviceParamsValid = toObservable(this._serviceParamsValid);
  serviceParams: object = {};
  // Signal (not a plain field): the schema arrives async from the
  // details-tier plan fetch below, and under zoneless+OnPush a plain
  // field reassignment would never reach the <app-schema-form> input.
  // schema is optional at this layer: a plan with no broker-advertised
  // parameter schema degrades the form to the JSON textbox, and
  // SchemaFormComponent.config already treats `schema` as absent-tolerant.
  schemaFormConfig = signal<SchemaFormConfigState | undefined>(undefined);
  // The selected plan's details-tier fetch. The wizard's plan list is
  // summary-tier, which omits `schemas` — without this second fetch the
  // schema-driven parameter form always degraded to the JSON textbox.
  private detailedPlanSource = signal<SignalSource<StServicePlan | null> | null>(null);


  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): ValidationErrors | null =>
      !this.checkName(formField.value) ? { nameTaken: { value: formField.value } } : null;
  };

  constructor() {
    this.setupForms();

    this.selectCreateInstance$ = this.csiState$.pipe(
      filter((p): p is CsiState & {
        servicePlanGuid: string; spaceGuid: string; cfGuid: string; serviceGuid: string;
      } => !!p && !!p.servicePlanGuid && !!p.spaceGuid && !!p.cfGuid && !!p.serviceGuid),
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
      shareReplay({ bufferSize: 1, refCount: true }),
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

    // Graft the details-tier schema onto the form config once the plan
    // fetch kicked off in onEnter lands. Preserves any initialData the
    // edit-mode seeding set in the meantime.
    effect(() => {
      const src = this.detailedPlanSource();
      if (!src || src.isLoading()) {
        return;
      }
      const schema = this.planSchema(src.value() ?? undefined);
      if (!schema) {
        return;
      }
      this.schemaFormConfig.update(cfg => ({ ...(cfg ?? {}), schema }));
    });
  }

  // The schema driving the parameter form — create or update flavor
  // depending on the wizard mode.
  private planSchema(plan?: StServicePlan): object | undefined {
    return this.modeService.isEditServiceInstanceMode() ?
      plan?.schemas?.serviceInstance?.update?.parameters :
      plan?.schemas?.serviceInstance?.create?.parameters;
  }

  // onEnter can run before the serviceInstances$ chain above (whose
  // switchMap lazily constructs the helper on first subscription) has
  // emitted — entering the step then dereferenced an undefined helper
  // and threw. Build it deterministically from the wizard state instead.
  private ensureHelper(): CreateServiceInstanceHelper | undefined {
    if (!this.cSIHelperService) {
      const state = this.csiState.state();
      if (state?.cfGuid && state?.serviceGuid) {
        this.cSIHelperService = this.cSIHelperServiceFactory.create(state.cfGuid, state.serviceGuid);
      }
    }
    return this.cSIHelperService;
  }

  onEnter = (selectedServicePlan: StServicePlan) => {
    const schema = this.planSchema(selectedServicePlan);

    const current = this.schemaFormConfig();
    this.schemaFormConfig.set(current
      // Update existing config (retaining any existing config)
      ? { ...current, initialData: this.serviceParams, schema }
      : { schema });

    // The plan handed over by the select-plan step comes from the
    // summary-tier list cache, which omits `schemas` — fetch the
    // selected plan at details so a broker-advertised parameter schema
    // can drive the form (the constructor effect grafts it on). The
    // stepper only relays the plan into the *next* step's onEnter, so
    // when the bind-app step sits in between this step enters with no
    // arg — fall back to the wizard state for the plan/cnsi guids.
    if (!schema) {
      const state = this.csiState.state();
      const planGuid = selectedServicePlan?.guid || state?.servicePlanGuid;
      const cnsiGuid = selectedServicePlan?.cnsiGuid || state?.cfGuid;
      if (planGuid && cnsiGuid) {
        this.detailedPlanSource.set(this.serviceCatalog.servicePlan(cnsiGuid, planGuid));
      }
    }

    this.formMode.set(CreateServiceFormMode.CreateServiceInstance);
    const helper = this.ensureHelper();
    if (helper) {
      this.allServiceInstances$ = helper.serviceInstances$();
      // Re-entering the step replaces the previous subscription.
      this.formValidatorData?.unsubscribe();
      this.formValidatorData = this.setupFormValidatorData();
    }
    if (this.modeService.isEditServiceInstanceMode()) {
      this.csiState$.pipe(
        take(1),
        tap(state => {
          this.createNewInstanceForm.controls.name.setValue(state.name);

          this.schemaFormConfig.update(cfg => ({
            ...(cfg ?? { schema }),
            initialData: (state.parameters ? safeStringToObj(state.parameters) : null) || this.serviceParams,
          }));

          this.serviceInstanceGuid = state.serviceInstanceGuid;
          this.serviceInstanceName = state.name;
          this.createNewInstanceForm.updateValueAndValidity();
          if (state.tags) {
            this.tags.set([...state.tags]);
          }
        })
      ).subscribe();
    }
  };

  setServiceParams(data: any) {
    // schema-form emits `null`/`undefined` when the JSON editor is empty,
    // and buildWriteBody later runs `Object.keys(params)` which throws
    // "Cannot convert undefined or null to object" on a nullish value.
    // Coerce to {} so the no-params path is the same as an empty object.
    this.serviceParams = data ?? {};
  }

  setParamsValid(valid: boolean) {
    // The schema-form wrapper's validChange/pValidChange now signals parse
    // validity only: true when the JSON editor is empty or contains valid
    // JSON, false when the user has typed unparseable JSON. We trust that
    // signal unconditionally — empty params are always parse-valid (true),
    // so the Create button is never blocked by an untouched editor.
    // Unparseable JSON blocks the step regardless of whether the plan has
    // a broker-advertised schema.
    this._serviceParamsValid.set(valid);
  }

  resetForms = (mode: CreateServiceFormMode) => {
    this._validate.set(false);
    this.createNewInstanceForm.reset();
    this.selectExistingInstanceForm.reset();
    if (mode === CreateServiceFormMode.CreateServiceInstance) {
      this.tags.set([]);
      this.bindExistingInstance = false;
    } else if (mode === CreateServiceFormMode.BindServiceInstance) {
      this.bindExistingInstance = true;
    }
  };

  private setupFormValidatorData(): Subscription {
    return this.allServiceInstances$.pipe(
      combineLatestWith(this.csiState$),
      filter(([, state]) => !!state.spaceGuid),
      map(([instances, state]) => instances.filter(s => {
        let filterSelf = false;
        if (this.modeService.isEditServiceInstanceMode()) {
          filterSelf = s.name === state.name;
        }
        return s.space?.guid === state.spaceGuid && !filterSelf;
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(o => {
      this.allServiceInstanceNames = o.map(s => s.name);
    });
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
      switchMap(state => from(this.handOffIfSlow(this.executeWrite(state)))),
    );
  };

  // A write still running after HAND_OFF_AFTER_MS asks the user whether to
  // keep waiting, and for how long. Continue in background, or no answer,
  // hands it off: the wizard closes and names where to watch it, tracking
  // carries on, and the outcome is reported wherever the user is. Leaving
  // the wizard (Cancel, another page) hands it off the same way, so a late
  // failure is never lost.
  private async handOffIfSlow(outcome: Promise<StepOnNextResult>): Promise<StepOnNextResult> {
    const startedAt = Date.now();
    let handedOff = false;
    const handOff = () => {
      if (handedOff) return;
      handedOff = true;
      this.closeSlowWrite('background');
      this.handOffNotice = this.snackBar.open(
        `${this.writeDescription()} carries on in the background. ${this.whereToWatch()} shows its progress, `
          + 'and a message will say how it ended.',
        'Dismiss', { duration: 10000 },
      );
      // A success reports itself (routeToServices); a failure or unknown
      // result would go to a step nobody is looking at.
      outcome.then(r => {
        if (!r.success) {
          this.handOffNotice?.dismiss();
          this.snackBar.error(r.message ?? 'The operation failed.');
        }
      });
    };
    const stopWatchingDestroy = this.destroyRef.onDestroy(handOff);
    const handedOffResult: StepOnNextResult = { success: true, redirect: true };
    try {
      let waitMs = HAND_OFF_AFTER_MS;
      for (;;) {
        const first = await this.outcomeWithin(outcome, waitMs);
        if (first) return first;
        if (handedOff) return handedOffResult;
        const answer = await Promise.race([outcome, this.askSlowWrite(Date.now() - startedAt)]);
        if (typeof answer === 'object') return answer;
        if (answer === 'background' || handedOff) {
          handOff();
          return handedOffResult;
        }
        waitMs = answer * 1000;
      }
    } finally {
      this.closeSlowWrite('background');
      if (!handedOff) stopWatchingDestroy();
    }
  }

  // The outcome, or null once ms pass without one.
  private async outcomeWithin(outcome: Promise<StepOnNextResult>, ms: number): Promise<StepOnNextResult | null> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const slow = new Promise<null>(resolve => { timeout = setTimeout(() => resolve(null), ms); });
    try {
      return await Promise.race([outcome, slow]);
    } finally {
      clearTimeout(timeout);
    }
  }

  private askSlowWrite(elapsedMs: number): Promise<WaitAnswer> {
    return new Promise<WaitAnswer>(resolve => {
      this.answerSlowWrite = resolve;
      let answerIn = PROMPT_ANSWER_S;
      this.slowWrite.set({
        text: `${this.writeDescription()} is still running after ${coarseElapsed(elapsedMs)}.`,
        answerIn,
      });
      // The question sits below the form, which can be taller than the
      // screen; unseen, its countdown would hand the write off unasked. As
      // an alert dialog it takes focus, so it is read out and answerable from
      // the keyboard.
      afterNextRender(() => {
        const question = this.slowWriteQuestion()?.nativeElement;
        question?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        question?.querySelector<HTMLElement>('#slow-write-seconds')?.focus({ preventScroll: true });
      }, { injector: this.injector });
      this.answerCountdown = setInterval(() => {
        answerIn--;
        if (answerIn <= 0) {
          this.closeSlowWrite('background');
        } else {
          this.slowWrite.update(q => q && { ...q, answerIn });
        }
      }, 1000);
    });
  }

  private closeSlowWrite(answer: WaitAnswer): void {
    clearInterval(this.answerCountdown);
    this.answerCountdown = undefined;
    this.slowWrite.set(null);
    const resolve = this.answerSlowWrite;
    this.answerSlowWrite = undefined;
    resolve?.(answer);
  }

  keepWaiting(): void {
    if (this.slowWrite() && this.waitSecondsValid()) {
      this.closeSlowWrite(this.waitSeconds());
    }
  }

  continueInBackground(): void {
    this.closeSlowWrite('background');
  }

  private writeDescription(): string {
    if (this.bindExistingInstance) {
      return 'Binding the service instance to the application';
    }
    const verb = this.modeService.isEditServiceInstanceMode() ? 'Updating' : 'Creating';
    return `${verb} service instance "${this.createNewInstanceForm.controls.name.value}"`;
  }

  private whereToWatch(): string {
    return this.modeService.isAppServicesMode() ? 'The application\'s Services tab' : 'The Services list';
  }

  routeToServices = (successMessage?: string): StepOnNextResult => {
    if (successMessage) {
      // Stepper redirects on success but doesn't surface a confirmation;
      // without this snackbar the user sees the wizard "blink" back to
      // the marketplace with no feedback that the instance / binding
      // actually succeeded.
      this.handOffNotice?.dismiss();
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
      const instances = await firstValueFrom(this.bindableServiceInstances$);
      const existingName = instances.find(si => si.guid === existingGuid)?.name ?? existingGuid;
      return this.bindAppIfRequested(existingGuid, state, existingName, false);
    }

    // Name messages after what the form sent: wizard state carries no name
    // on create, and the instance's old name when it is renamed on edit.
    const name = this.createNewInstanceForm.controls.name.value;
    const isEditMode = this.modeService.isEditServiceInstanceMode();
    const verb = isEditMode ? 'update' : 'create';
    const body = this.buildWriteBody(state, isEditMode);

    const url = isEditMode
      ? `/pp/v1/cf/service_instances/${state.cfGuid}/${state.serviceInstanceGuid}`
      : `/pp/v1/cf/service_instances/${state.cfGuid}`;
    const call = isEditMode
      ? this.http.patch(url, body, { observe: 'response' as const })
      : this.http.post(url, body, { observe: 'response' as const });

    // Kept while the write runs, so a reload or a new sign-in can still
    // report how it ended (TrackedJobsService); it says the bind did not run,
    // as only this wizard binds.
    const track: Omit<TrackedJob, 'jobId'> = {
      startedAt: Date.now(),
      running: this.writeDescription(),
      done: `Service instance "${name}" ${isEditMode ? 'updated' : 'created'}.`
        + (!isEditMode && state.bindAppGuid
          ? ' It was not bound to the application: the wizard that would bind it closed before the instance was ready.'
          : ''),
      failed: `Failed to ${verb} service instance "${name}"`,
      unknown: `${isEditMode ? 'Update' : 'Create'} service instance "${name}"`,
      where: 'The Services list',
    };
    let jobId: string | undefined;
    let release: (() => void) | undefined;
    let signedOut = false;
    let result: AsyncJobResult<unknown>;
    try {
      result = await writeWithJob<unknown>(this.http, call, {
        deadlineAt: track.startedAt + jobTrackingLimitMs(),
        pauseOnSignOut: true,
        onProgress: job => {
          if (!jobId) {
            jobId = job.id;
            release = this.trackedJobs.hold(jobId);
            this.trackedJobs.following.add(jobId);
            this.trackedJobs.remember({ jobId, ...track });
          }
        },
      });
    } catch (err: unknown) {
      if (err instanceof SignedOutError) {
        signedOut = true;
        return { success: false, message: this.trackedJobs.signedOut(track) };
      }
      return {
        success: false,
        message: `${track.failed}: ${extractHttpErrorMessage(err)}`,
      };
    } finally {
      if (jobId) {
        this.trackedJobs.following.delete(jobId);
        if (!signedOut) {
          this.trackedJobs.forget(jobId);
        }
        release?.();   // after forget: a tab waiting on it must find the record gone
      }
    }

    if (result.status === 'UNKNOWN') {
      // Result unknown (ended, or still running in CF when the limit was
      // reached): never claim it was created or updated, and say a
      // requested bind was not attempted.
      const notBound = !isEditMode && state.bindAppGuid ? ' It was not bound to the application.' : '';
      return { success: false, message: unknownOutcomeMessage(track.unknown, track.where, unknownHow(result)) + notBound };
    }

    if (isEditMode) {
      return this.routeToServices(`Service instance "${name}" updated.`);
    }

    // Create path: try to extract the new SI's guid for the bind-after-create
    // follow-up. A slow-async path without a resource link leaves the guid
    // undefined — in that case the SI will appear in the services wall once
    // CF settles and the user binds manually.
    const newGuid = extractCreatedSiGuid(result);
    if (newGuid) {
      this.csiState.setServiceInstanceGuid(newGuid);
    }
    return this.bindAppIfRequested(newGuid, state, name, true);
  }

  private async bindAppIfRequested(
    siGuid: string | undefined,
    state: CsiState,
    siName: string,
    created: boolean,
  ): Promise<StepOnNextResult> {
    if (!state.bindAppGuid || !siGuid) {
      return this.routeToServices(`Service instance "${siName}" created.`);
    }
    const bindResult = await firstValueFrom(this.modeService.createApplicationServiceBinding(
      siGuid,
      // strict: a service instance can only be created/bound within a CF
      // context, so cfGuid is always set by the time a bind is requested.
      state.cfGuid!,
      state.bindAppGuid,
      state.bindAppParams,
    ).pipe(take(1)));
    if (bindResult?.unknown) {
      return {
        success: false,
        message: unknownOutcomeMessage(
          created
            ? `Service instance "${siName}" was created. Binding it to the application`
            : `Binding service instance "${siName}" to the application`,
          'The application\'s Services tab',
          bindResult.unknown,
        ),
      };
    }
    if (!bindResult?.success) {
      const reason = bindResult?.message ?? 'unknown error';
      return {
        success: false,
        message: created
          ? `Service instance "${siName}" was created, but binding it to the application failed: ${reason}`
          : `Failed to bind service instance "${siName}" to the application: ${reason}`,
      };
    }
    // CF mutated VCAP_SERVICES on the bound app. We routeToServices below
    // (away from any app-detail route), so the legacy ngrx prefetch was
    // priming state nothing on this navigation reads. The app's env-vars
    // tab fetches fresh on next mount via AppDetailDataService —
    // dropping the prefetch is functionally a no-op.
    return this.routeToServices(created
      ? `Service instance "${siName}" created and bound.`
      : `Service instance "${siName}" bound to the application.`);
  }

  private buildWriteBody(state: CsiState, isEditMode: boolean): Record<string, unknown> {
    const name = this.createNewInstanceForm.controls.name.value;
    const params = this.serviceParams;
    const tags = [...this.tags()];

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
    observableCombineLatest([
      this.serviceParamsValid,
      this.createNewInstanceForm.statusChanges,
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([serviceParamsValid]) =>
      this._validate.set(serviceParamsValid && this.createNewInstanceForm.valid));
    // For existing service instance the step is valid if the form is (there's no service params)
    this.selectExistingInstanceForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this._validate.set(this.selectExistingInstanceForm.valid));
  }

  // (keydown.*) template events are typed as plain Event by the compiler
  addTagFromInput(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if ((value || '').trim()) {
      this.tags.update(tags => [...tags, value.trim()]);
      this.updateTagsFormControl();
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    if (this.tags().includes(tag)) {
      this.tags.update(tags => tags.filter(t => t !== tag));
      this.updateTagsFormControl();
    }
  }

  private updateTagsFormControl(): void {
    this.createNewInstanceForm.controls.tags.setValue(this.tags());
    this.createNewInstanceForm.controls.tags.markAsTouched();
  }

  checkName = (value: string | null = null) => {
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
// CF names the job link after its resource type, so a create or update job
// carries `links.service_instances: '/v3/service_instances/<guid>'` (plural;
// only the delete job uses `service_instance`). translateCFJobResult passes it
// through unchanged, and writeWithJob normalises both fast-path and polled
// shapes to that bare-result level. UNKNOWN status / missing links return
// undefined and the caller skips auto-bind.
function extractCreatedSiGuid(result: AsyncJobResult<unknown>): string | undefined {
  if (result.status !== 'COMPLETE' || !result.state) return undefined;
  const links = (result.state as { links?: Record<string, string> }).links;
  const href = links?.service_instances;
  if (!href) return undefined;
  const m = href.match(/\/([^/]+)\/?$/);
  return m?.[1];
}

