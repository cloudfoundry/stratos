import { AsyncPipe, CommonModule, TitleCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, of as observableOf, Subject, Subscription, firstValueFrom } from 'rxjs';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';

import {
  CfOrgSpaceDataService,
} from '../../../../../../cloud-foundry/src/shared/data-services/cf-org-space-service.service';
import { getIdFromRoute } from '../../../../../../core/src/core/utils.service';
import { PageHeaderComponent } from '../../../../../../core/src/shared/components/page-header/page-header.component';
import { SignalStepHandle, StepComponent } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IApp } from '../../../../cf-api.types';
import { ServiceCatalogDataService, SignalSource } from '../../../../services/endpoint-data/service-catalog-data.service';
import { SpaceDataRegistry } from '../../../../services/endpoint-data/space-data.registry';
import { StApp, StServiceInstance, StSpace } from '../../../../services/endpoint-data/stratos-types';
import { CreateApplicationStep1Component } from '../../create-application/create-application-step1/create-application-step1.component';
import { SelectServiceComponent } from '../../select-service/select-service.component';
import { AUTO_SELECT_CF_URL_PARAM } from '../../../../features/applications/new-application-base-step/new-application-base-step.component';
import { SERVICE_INSTANCE_TYPES, SERVICE_PLAN_URL_PARAM } from '../add-service-instance-base-step/add-service-instance.types';
import { BindAppsStepComponent } from '../bind-apps-step/bind-apps-step.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { CsiStateService } from '../csi-state.service';
import { SelectPlanStepComponent } from '../select-plan-step/select-plan-step.component';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';
import { SpecifyUserProvidedDetailsComponent } from '../specify-user-provided-details/specify-user-provided-details.component';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  providers: [
    CreateServiceInstanceHelperServiceFactory,
    TitleCasePipe,
    CsiGuidsService,
    CsiModeService,
    CsiStateService,
    CfOrgSpaceDataService
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateApplicationStep1Component,
    SelectServiceComponent,
    SelectPlanStepComponent,
    BindAppsStepComponent,
    SpecifyDetailsStepComponent,
    SpecifyUserProvidedDetailsComponent
]
})
export class AddServiceInstanceComponent implements OnInit, OnDestroy {
  private cSIHelperServiceFactory = inject(CreateServiceInstanceHelperServiceFactory);
  private activatedRoute = inject(ActivatedRoute);
  cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private csiGuidsService = inject(CsiGuidsService);
  private csiState = inject(CsiStateService);
  modeService = inject(CsiModeService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private serviceCatalog = inject(ServiceCatalogDataService);
  private spaceRegistry = inject(SpaceDataRegistry);
  private injector = inject(Injector);

  apps$!: Observable<APIResource<IApp>[]>;
  skipApps$!: Observable<boolean>;
  marketPlaceMode!: boolean;
  cSIHelperService!: CreateServiceInstanceHelper;
  // Use signal for imperative title updates without change detection errors
  private _title = signal<string>('');
  title$ = toObservable(this._title);
  // Service offering name resolved by the helper, used both for the
  // page title and the stepper context summary. Updated alongside _title.
  private _serviceName = signal<string>('');
  // Stepper context summary parts — "what am I creating, where" — surfaced
  // above the step headers via the new <app-steppers [contextSummary]>.
  // CF / Org / Space come from the picker selections; service / instance
  // name come from csiState as the user advances.
  readonly contextSummaryParts: Signal<string[]> = computed(() => {
    const parts: string[] = [];
    const cfGuid = this.cfOrgSpaceService.cf.select();
    const orgGuid = this.cfOrgSpaceService.org.select();
    const spaceGuid = this.cfOrgSpaceService.space.select();
    if (cfGuid) {
      const cf = this.cfOrgSpaceService.cf.list().find(c => c.guid === cfGuid);
      if (cf?.name) parts.push(cf.name);
    }
    if (orgGuid) {
      const org = this.cfOrgSpaceService.org.list().find(o => o.guid === orgGuid);
      if (org?.name) parts.push(org.name);
    }
    if (spaceGuid) {
      const space = this.cfOrgSpaceService.space.list().find(s => s.guid === spaceGuid);
      if (space?.name) parts.push(space.name);
    }
    const svc = this._serviceName();
    if (svc) parts.push(svc);
    const instanceName = this.csiState.state().name;
    if (instanceName) parts.push(`"${instanceName}"`);
    return parts;
  });
  servicesWallCreateInstance = false;
  stepperText = 'Select a Cloud Foundry instance, organization and space for the service instance.';
  bindAppStepperText = 'Bind App (Optional)';
  appId!: string;
  serviceInstanceId!: string;
  public inMarketplaceMode: boolean;
  public serviceType: SERVICE_INSTANCE_TYPES;
  public serviceTypes = SERVICE_INSTANCE_TYPES;
  private cfDetails$ = toObservable(this.csiState.state);
  // Lifecycle management for subscriptions - must be declared before use in property initializers
  private destroyed$ = new Subject<void>();
  // Loading state for applications - used to track async app fetching
  private _appsLoading = signal<boolean>(false);
  // toObservable() must run inside an injection context (constructor /
  // field initializer / runInInjectionContext) — Angular 21 enforces this
  // strictly. Calling toObservable() from onNext (an event handler) throws
  // NG0203. Lift the conversion up here where field initializers execute
  // during construction and have the injection context available, then
  // reuse this single observable from onNext.
  private appsLoading$ = toObservable(this._appsLoading);

  // Initialisation state is signal-native. Set by runInitialisation()
  // (mode-specific async setup); the template reads it via `@if
  // (initialisedService(); as inited)`.
  private _initialisedService = signal<boolean>(false);
  readonly initialisedService: Signal<boolean> = this._initialisedService.asReadonly();

  public cfGuid$: Observable<string>;
  public spaceGuid$ = this.cfDetails$.pipe(
    map(details => details?.spaceGuid),
    takeUntil(this.destroyed$)
  );
  public errorMessage: string | null = null;

  // FWT-959 Part 2 (Partition B): SignalStepHandle wiring for the
  // add-service-instance flow (up to 5 steps across two service-type
  // branches: managed service vs user-provided service). Cross-step
  // state lives in CsiStateService (signal-driven), CsiGuidsService
  // (route-derived guids), and CsiModeService (mode + cancelUrl).
  // Children read state via signals on CsiStateService and mutate via
  // its imperative setters.
  //
  // The steppers component renders only the active step's content
  // template at any given time (steppers.component.html line 71:
  // `<span *ngTemplateOutlet="steps[currentIndex].content">`), so child
  // components are instantiated lazily on activation. We use ViewChild
  // *setters* so the bridge subscription is wired the moment the child
  // becomes available — and torn down when the user navigates away.
  // This is the only pattern that consistently works for lazily-
  // instantiated step children under OnPush + zoneless change
  // detection (signal-handle onEnter is not yet routed by the
  // SteppersComponent).
  //
  // Mode branching (showSelectCf, showSelectService, showBindApp) is
  // already gated by @if blocks in the template so the per-step
  // handles only need to express validity / blocked / submit — no
  // skipIf is needed.
  // The four child refs that drive a `valid: computed(() => !!this._ref?.validate())`
  // handle predicate live in WritableSignals, not plain fields. Plain fields
  // don't notify the computed when reassigned, so the steppers component's
  // initial valid() read (before the lazy ViewChild for the next step has
  // fired) memoizes the computed with zero signal dependencies — and never
  // re-runs even after the child's validate flips. _selectCF and
  // _specifyDetails stay plain because their handles use a bridged signal
  // pattern (subscribe-to-validate inside the setter), not a computed wrap.
  private _selectCF?: CreateApplicationStep1Component;
  private _selectService = signal<SelectServiceComponent | undefined>(undefined);
  private _selectPlan = signal<SelectPlanStepComponent | undefined>(undefined);
  private _bindApp = signal<BindAppsStepComponent | undefined>(undefined);
  private _specifyDetails?: SpecifyDetailsStepComponent;
  private _supd = signal<SpecifyUserProvidedDetailsComponent | undefined>(undefined);

  private selectCFValid = signal<boolean>(false);
  private selectServiceFetching = signal<boolean>(false);
  private selectPlanFetching = signal<boolean>(false);
  private specifyDetailsValid = signal<boolean>(false);
  private specifyDetailsInit = signal<boolean>(true);

  private selectCFSub?: Subscription;
  private selectServiceFetchSub?: Subscription;
  private specifyDetailsValidSub?: Subscription;
  private specifyDetailsInitSub?: Subscription;

  private isLoadingSignal = this.cfOrgSpaceService.isLoading;
  private skipAppsSignal = signal<boolean>(false);
  private skipAppsSub?: Subscription;

  // The selected plan flows from select-plan-step's onNext result to
  // bind-apps-step.onEnter and specify-details-step.onEnter. The legacy
  // stepper relayed this via `enterData` → next step.onEnter(enterData);
  // signal-handle submit() drops the `data` channel, so we capture the
  // plan here and forward it on activation of each downstream step.
  private selectedPlan?: unknown;
  // Pending onEnter targets — set in upstream step submit()s, consumed
  // by downstream ViewChild setters. Mirrors the legacy framework call:
  // "after upstream onNext succeeds, call downstream.onEnter(data)" —
  // signal-handle submit() drops that wiring so we replicate it here.
  // Without this, ViewChild setters firing on first construction would
  // call downstream onEnter() with stale/missing context (e.g. before
  // the user has actually selected a plan). Cross-step onEnter delivery
  // is owned by `signalHandle.onEnter` — the framework routes the prior
  // step's `submit()` return-value `data` field through `pOnEnter` into
  // the next handle's onEnter, so the legacy pendingX-flag pattern is
  // unnecessary.

  @ViewChild('selectCF', { static: false })
  set selectCFRef(v: CreateApplicationStep1Component | undefined) {
    this._selectCF = v;
    this.selectCFSub?.unsubscribe();
    this.selectCFSub = undefined;
    if (v) {
      // Replicate the legacy [onEnter]="resetStoreData" — clears stale
      // service-instance state when the user re-enters the CF step.
      this.resetStoreData();
      this.selectCFSub = v.validate.subscribe(valid => {
        this.selectCFValid.set(!!valid);
        this.cdr.markForCheck();
      });
    } else {
      this.selectCFValid.set(false);
    }
  }

  @ViewChild('selectService', { static: false })
  set selectServiceRef(v: SelectServiceComponent | undefined) {
    this._selectService.set(v);
    this.selectServiceFetchSub?.unsubscribe();
    this.selectServiceFetchSub = undefined;
    if (v) {
      // SelectService.validate is already a Signal — handle reads it
      // directly. We only bridge isFetching$ for the blocked predicate.
      this.selectServiceFetchSub = v.isFetching$.subscribe(b => {
        this.selectServiceFetching.set(!!b);
        this.cdr.markForCheck();
      });
    } else {
      this.selectServiceFetching.set(false);
    }
  }

  @ViewChild('selectPlan', { static: false })
  set selectPlanRef(v: SelectPlanStepComponent | undefined) {
    this._selectPlan.set(v);
    // onEnter is driven by an effect — see constructor — so swapping flag
    // state (or having the child appear later) reliably reaches the
    // child's onEnter regardless of which signal lands first.
  }

  @ViewChild('bindApp', { static: false })
  set bindAppRef(v: BindAppsStepComponent | undefined) {
    this._bindApp.set(v);
  }

  @ViewChild('specifyDetails', { static: false })
  set specifyDetailsRef(v: SpecifyDetailsStepComponent | undefined) {
    this._specifyDetails = v;
    this.specifyDetailsValidSub?.unsubscribe();
    this.specifyDetailsInitSub?.unsubscribe();
    this.specifyDetailsValidSub = undefined;
    this.specifyDetailsInitSub = undefined;
    if (v) {
      this.specifyDetailsValidSub = v.validate.subscribe(valid => {
        this.specifyDetailsValid.set(!!valid);
        this.cdr.markForCheck();
      });
      this.specifyDetailsInitSub = v.serviceInstancesInit$.subscribe(init => {
        this.specifyDetailsInit.set(!!init);
        this.cdr.markForCheck();
      });
    } else {
      this.specifyDetailsValid.set(false);
      this.specifyDetailsInit.set(true);
    }
  }

  @ViewChild('supd', { static: false })
  set supdRef(v: SpecifyUserProvidedDetailsComponent | undefined) {
    this._supd.set(v);
    // supd.validate is already a signal — no bridge needed beyond the
    // ViewChild capture for submit().
  }

  selectCFHandle: SignalStepHandle = {
    valid: this.selectCFValid.asReadonly(),
    blocked: computed(() => !!this.isLoadingSignal()),
    submit: async () => {
      const result = await firstValueFrom(this.onNext());
      if (!result.success) {
        throw new Error(this.errorMessage || 'Failed to save Cloud Foundry details');
      }
    },
  };

  selectServiceHandle: SignalStepHandle = {
    // SelectService exposes validate as a signal directly. The wrapping
    // computed reads `this._selectService()` (signal call) so reassigning
    // the ref via the ViewChild setter triggers re-evaluation.
    valid: computed(() => !!this._selectService()?.validate()),
    blocked: this.selectServiceFetching.asReadonly(),
    submit: async () => {
      const result = await firstValueFrom(this._selectService()!.onNext());
      if (!result.success) {
        throw new Error(result.message || 'Failed to select service');
      }
    },
  };

  selectPlanHandle: SignalStepHandle = {
    valid: computed(() => !!this._selectPlan()?.validate()),
    blocked: computed(() => !this._initialisedService()),
    cancelButtonText: signal('Cancel').asReadonly(),
    onEnter: () => this._selectPlan()?.onEnter(),
    submit: async () => {
      const result = await firstValueFrom(this._selectPlan()!.onNext());
      if (!result.success) {
        throw new Error(result.message || 'Failed to select plan');
      }
      // Stash the plan locally so downstream submit handlers / template
      // bindings can read it synchronously. The stepper framework also
      // carries this `data` through `enterData` into the next step's
      // signalHandle.onEnter — see bindAppHandle.onEnter +
      // specifyDetailsHandle.onEnter below.
      this.selectedPlan = result.data;
      return { data: result.data };
    },
  };

  bindAppHandle: SignalStepHandle = {
    valid: computed(() => !!this._bindApp()?.validate()),
    skipIf: this.skipAppsSignal.asReadonly(),
    cancelButtonText: signal('Cancel').asReadonly(),
    onEnter: (plan) => this._bindApp()?.onEnter(plan as any),
    submit: async () => {
      const result = await firstValueFrom(this._bindApp()!.submit());
      if (!result.success) {
        throw new Error(result.message || 'Failed to bind app');
      }
    },
  };

  specifyDetailsHandle: SignalStepHandle = {
    valid: this.specifyDetailsValid.asReadonly(),
    blocked: this.specifyDetailsInit.asReadonly(),
    cancelButtonText: signal('Cancel ').asReadonly(),
    nextButtonText: signal('Create ').asReadonly(),
    onEnter: (plan) => this._specifyDetails?.onEnter(plan as any),
    submit: async () => {
      const result = await firstValueFrom(this._specifyDetails!.onNext());
      if (!result.success) {
        throw new Error(result.message || 'Failed to create service instance');
      }
      // Return the full result so stepper sees redirect/redirectPayload —
      // routeToServices sets redirect:true to navigate out of the wizard
      // post-create. Without returning here, the redirect flag is lost and
      // the wizard sits on the last step after a successful submit.
      return result;
    },
  };

  supdHandle: SignalStepHandle = {
    valid: computed(() => !!this._supd()?.validate()),
    submit: async () => {
      const result = await firstValueFrom(this._supd()!.onNext());
      if (!result.success) {
        throw new Error(result.message || 'Failed to create user-provided service instance');
      }
    },
  };

  constructor() {
    const route = inject(ActivatedRoute);

    const cfGuid = getIdFromRoute(this.activatedRoute, 'endpointId');
    this.cfGuid$ = cfGuid ? observableOf(cfGuid) : this.cfDetails$.pipe(
      map(details => details?.cfGuid),
      catchError(error => {
        console.error('constructor: Error retrieving CF GUID from store', error);
        this.errorMessage = 'Failed to retrieve Cloud Foundry endpoint information';
        return observableOf(null);
      }),
      takeUntil(this.destroyed$)
    );
    this.inMarketplaceMode = this.modeService.isMarketplaceMode();
    this.serviceType = route.snapshot.params.type || SERVICE_INSTANCE_TYPES.SERVICE;

    // Honor the per-CF-tab Add affordance: when a per-CF Marketplace /
    // Services tab navigates here, it forwards its CNSI via the
    // `auto-select-endpoint` query param (the same convention the app
    // deploy wizard uses). Pre-select the CF in the org/space picker so
    // step 1 lands on the right context — no re-pick required when the
    // user clearly came from a CF-scoped surface.
    const autoSelectCf = route.snapshot.queryParams[AUTO_SELECT_CF_URL_PARAM];
    if (autoSelectCf) {
      this.cfOrgSpaceService.cf.select.set(autoSelectCf);
    }
  }

  ngOnInit(): void {
    // Initialise apps$ / skipApps$ for the bind-apps step. Hits the
    // signal-native /pp/v1/cf/apps/<cnsi>?space_guids=<guid> handler.
    // We map to the {metadata, entity} APIResource shape the bind-apps
    // template still consumes.
    this.apps$ = this.cfDetails$.pipe(
      filter(csi => !!csi && !!csi.spaceGuid && !!csi.cfGuid),
      distinctUntilChanged((x, y) => x.cfGuid + x.spaceGuid === y.cfGuid + y.spaceGuid),
      tap(() => this._appsLoading.set(true)),
      switchMap(csi => this.http.get<{ resources: Array<{ guid: string; name: string }> }>(
        `/pp/v1/cf/apps/${csi.cfGuid}?space_guids=${csi.spaceGuid}&per_page=500&page=1`,
      ).pipe(
        map(resp => (resp.resources ?? []).map(r => ({
          metadata: { guid: r.guid, url: '', created_at: '', updated_at: '' },
          entity: { name: r.name } as IApp,
        }) as APIResource<IApp>)),
      )),
      tap(() => this._appsLoading.set(false)),
      catchError(error => {
        console.error('Error fetching applications for space:', error);
        this.errorMessage = 'Failed to fetch applications. Please try again.';
        this._appsLoading.set(false);
        return observableOf([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
      takeUntil(this.destroyed$)
    );
    this.skipApps$ = this.apps$.pipe(
      map(apps => apps?.length === 0),
      catchError(() => observableOf(true)),
      shareReplay({ bufferSize: 1, refCount: true }),
      takeUntil(this.destroyed$)
    );
    // Mirror skipApps$ into a signal so bindAppHandle.skipIf stays
    // reactive without leaking an async pipe into the template.
    this.skipAppsSub = this.skipApps$.subscribe(skip => {
      this.skipAppsSignal.set(!!skip);
      this.cdr.markForCheck();
    });

    // Mode-specific initialisation runs as an async chain that resolves
    // _initialisedService(true) on success. The template @if gate is the
    // signal call.
    void this.runInitialisation();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Mode dispatch
  // ─────────────────────────────────────────────────────────────────────

  private async runInitialisation(): Promise<void> {
    try {
      let ok = true;
      if (this.inMarketplaceMode) {
        ok = await this.initialiseForMarketplaceMode();
      } else if (this.modeService.isEditServiceInstanceMode()) {
        ok = await this.configureForEditServiceInstanceMode();
      } else if (this.modeService.isAppServicesMode()) {
        ok = await this.setupForAppServiceMode();
      } else if (this.modeService.isServicesWallMode()) {
        this.servicesWallCreateInstance = true;
        // setTimeout pushes the title update past the current change
        // detection cycle to avoid ExpressionChangedAfterItHasBeenChecked.
        setTimeout(() => this._title.set('Create Service Instance'), 0);
      }
      this._initialisedService.set(ok);
      this.cdr.markForCheck();
    } catch (error) {
      console.error('runInitialisation: error during mode setup', error);
      this.errorMessage = 'Failed to initialize service instance creation';
      this._initialisedService.set(false);
      this.cdr.markForCheck();
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────

  // Promise wrapper for a SignalSource: resolves once isLoading flips to
  // false. Rejects if the source surfaces an http error.
  private awaitSignalSource<T>(source: SignalSource<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      runInInjectionContext(this.injector, () => {
        const ref = effect(() => {
          if (source.isLoading()) return;
          ref.destroy();
          const err = source.error();
          if (err) reject(err);
          else resolve(source.value());
        });
      });
    });
  }

  // Promise wrapper for SpaceDataRegistry.acquire+load. Releases the
  // registry refcount in `finally` so warm caches stay shared but the
  // dispatcher's transient interest is correctly dropped.
  private async awaitSpaceLoad(cfId: string, spaceGuid: string): Promise<StSpace> {
    const sd = this.spaceRegistry.acquire(cfId, spaceGuid);
    try {
      await firstValueFrom(sd.load());
      const space = sd.space();
      if (!space) {
        const errs = sd.errors();
        throw new Error(errs[0]?.message ?? 'Failed to load space');
      }
      return space;
    } finally {
      this.spaceRegistry.release(cfId, spaceGuid);
    }
  }

  private failSetup(logMessage: string, userMessage: string): Promise<boolean> {
    console.error(logMessage);
    this.errorMessage = userMessage;
    return Promise.resolve(false);
  }

  // Resolves once a Signal<T[]> emits a non-empty array. Returns
  // immediately if the signal already holds entries. Used to wait on
  // upstream signal-backed lists (e.g. CfOrgSpaceDataService.cf.list)
  // before proceeding with selection.
  private awaitNonEmpty<T>(sig: Signal<T[]>): Promise<T[]> {
    const initial = sig();
    if (initial && initial.length > 0) return Promise.resolve(initial);
    return new Promise(resolve => {
      runInInjectionContext(this.injector, () => {
        const ref = effect(() => {
          const v = sig();
          if (v && v.length > 0) {
            ref.destroy();
            resolve(v);
          }
        });
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Step-driven event handlers
  // ─────────────────────────────────────────────────────────────────────

  onNext = () => {
    try {
      const cfGuid = this.cfOrgSpaceService.cf.select();
      const orgGuid = this.cfOrgSpaceService.org.select();
      const spaceGuid = this.cfOrgSpaceService.space.select();

      if (!cfGuid) {
        console.error('onNext: Cloud Foundry endpoint not selected');
        this.errorMessage = 'Please select a Cloud Foundry endpoint';
        return observableOf({ success: false });
      }

      if (!orgGuid) {
        console.error('onNext: Organization not selected');
        this.errorMessage = 'Please select an organization';
        return observableOf({ success: false });
      }

      if (!spaceGuid) {
        console.error('onNext: Space not selected');
        this.errorMessage = 'Please select a space';
        return observableOf({ success: false });
      }

      this.csiState.setCFDetails(cfGuid, orgGuid, spaceGuid);
    } catch (error) {
      console.error('onNext: Error dispatching CF details', error);
      this.errorMessage = 'Failed to save Cloud Foundry details';
      return observableOf({ success: false });
    }

    return this.appsLoading$.pipe(
      filter(loading => !loading),
      delay(1),
      map(() => ({ success: true })),
      catchError(error => {
        console.error('onNext: Error waiting for applications to load', error);
        this.errorMessage = 'Failed to load applications';
        return observableOf({ success: false });
      }),
      takeUntil(this.destroyed$)
    );
  }

  resetStoreData = () => {
    try {
      if (this.inMarketplaceMode) {
        this.csiState.resetOrgAndSpace();
      } else if (this.modeService.isServicesWallMode()) {
        this.csiState.reset();
      }
    } catch (error) {
      console.error('resetStoreData: Error resetting store state', error);
      // Non-critical operation, just log the error
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Mode-specific setup
  // ─────────────────────────────────────────────────────────────────────

  // App-services mode: route param `id` is the app guid; we read the app
  // detail (default `?return=` mode composes space + org refs) so the
  // wizard can pre-fill the CF/org/space context for the subsequent
  // bind step.
  private async setupForAppServiceMode(): Promise<boolean> {
    const appId = getIdFromRoute(this.activatedRoute, 'id');
    const cfId = getIdFromRoute(this.activatedRoute, 'endpointId');

    if (!appId) {
      return this.failSetup(
        'setupForAppServiceMode: Application ID is missing from route params',
        'Cannot bind service instance: Application ID is required',
      );
    }
    if (!cfId) {
      return this.failSetup(
        'setupForAppServiceMode: Cloud Foundry endpoint ID is missing from route params',
        'Cannot bind service instance: Cloud Foundry endpoint ID is required',
      );
    }

    this.appId = appId;
    this.bindAppStepperText = 'Binding Params (Optional)';

    let app: StApp;
    try {
      app = await this.loadAppDetail(cfId, appId);
    } catch (error) {
      return this.failSetup(
        `setupForAppServiceMode: Failed to fetch application detail (appId=${appId}, cfId=${cfId}): ${error instanceof Error ? error.message : String(error)}`,
        'Failed to load application details. Please try again.',
      );
    }
    if (!app?.spaceGuid) {
      return this.failSetup(
        `setupForAppServiceMode: Space GUID missing from application (appId=${appId})`,
        'Application space information is missing',
      );
    }
    if (!app?.orgGuid) {
      return this.failSetup(
        `setupForAppServiceMode: Organization GUID missing from application (appId=${appId})`,
        'Organization information is missing from application space',
      );
    }

    this.applyAppServiceModeState(cfId, app);
    return true;
  }

  private loadAppDetail(cfId: string, appId: string): Promise<StApp> {
    return firstValueFrom(this.http.get<StApp>(`/pp/v1/cf/apps/${cfId}/${appId}`));
  }

  private applyAppServiceModeState(cfId: string, app: StApp): void {
    this.csiState.setCFDetails(cfId, app.orgGuid!, app.spaceGuid);
    // setTimeout pushes the title update past the current change
    // detection cycle to avoid ExpressionChangedAfterItHasBeenChecked.
    setTimeout(() => {
      this._title.set(`Create and/or Bind Service Instance to '${app.name || 'Application'}'`);
    }, 0);
  }

  // Edit-service-instance mode dispatcher: validates route params, then
  // dispatches to the user-provided or managed branch. The user-provided
  // branch needs no remote reads — it just stamps the ids onto csiState
  // and lets the user-provided form take over. The managed branch is
  // factored into runManagedEditSetup() for readability.
  private async configureForEditServiceInstanceMode(): Promise<boolean> {
    const { endpointId, serviceInstanceId } = this.activatedRoute.snapshot.params;

    if (!endpointId) {
      return this.failSetup(
        'configureForEditServiceInstanceMode: endpointId is missing from route params',
        'Cannot edit service instance: Cloud Foundry endpoint ID is required',
      );
    }
    if (!serviceInstanceId) {
      return this.failSetup(
        'configureForEditServiceInstanceMode: serviceInstanceId is missing from route params',
        'Cannot edit service instance: Service instance ID is required',
      );
    }

    if (this.serviceType === this.serviceTypes.USER_SERVICE) {
      this.serviceInstanceId = serviceInstanceId;
      setTimeout(() => this._title.set('Edit User Provided Service Instance'), 0);
      return true;
    }

    return this.runManagedEditSetup(endpointId, serviceInstanceId);
  }

  private async runManagedEditSetup(endpointId: string, serviceInstanceId: string): Promise<boolean> {
    let si: StServiceInstance | null;
    try {
      si = await this.loadServiceInstanceForEdit(endpointId, serviceInstanceId);
    } catch (error) {
      return this.failSetup(
        `runManagedEditSetup: Failed to fetch service instance (id=${serviceInstanceId}, cnsi=${endpointId}): ${error instanceof Error ? error.message : String(error)}`,
        'Failed to load service instance for editing. Please try again.',
      );
    }
    if (!si) {
      return this.failSetup(
        `runManagedEditSetup: Service instance entity not found (id=${serviceInstanceId})`,
        'Service instance not found',
      );
    }

    const serviceGuid = si.servicePlan?.serviceOffering?.guid;
    if (!serviceGuid) {
      return this.failSetup(
        `runManagedEditSetup: serviceOffering.guid missing from service instance (id=${serviceInstanceId})`,
        'Cannot edit service instance: Service GUID is required but missing from service instance data',
      );
    }
    const spaceGuid = si.space?.guid;
    if (!spaceGuid) {
      return this.failSetup(
        `runManagedEditSetup: space.guid missing from service instance (id=${serviceInstanceId})`,
        'Cannot edit service instance: Space GUID is required but missing from service instance data',
      );
    }

    this.applyManagedEditModeState(endpointId, si, serviceGuid, spaceGuid);

    let space: StSpace;
    try {
      space = await this.loadSpaceForInstance(endpointId, spaceGuid);
    } catch (error) {
      return this.failSetup(
        `runManagedEditSetup: Failed to fetch space (spaceGuid=${spaceGuid}, cnsi=${endpointId}): ${error instanceof Error ? error.message : String(error)}`,
        'Failed to load space information for service instance.',
      );
    }
    if (!space.orgGuid) {
      return this.failSetup(
        `runManagedEditSetup: orgGuid missing from space (spaceGuid=${spaceGuid})`,
        'Organization GUID is missing from space entity',
      );
    }
    this.csiState.setCFDetails(endpointId, space.orgGuid, space.guid);
    return true;
  }

  private loadServiceInstanceForEdit(endpointId: string, serviceInstanceId: string): Promise<StServiceInstance | null> {
    return this.awaitSignalSource(this.serviceCatalog.serviceInstance(endpointId, serviceInstanceId));
  }

  private loadSpaceForInstance(endpointId: string, spaceGuid: string): Promise<StSpace> {
    return this.awaitSpaceLoad(endpointId, spaceGuid);
  }

  private applyManagedEditModeState(
    endpointId: string,
    si: StServiceInstance,
    serviceGuid: string,
    spaceGuid: string,
  ): void {
    this.csiGuidsService.cfGuid = endpointId;
    this.csiGuidsService.serviceGuid = serviceGuid;
    this.cSIHelperService = this.cSIHelperServiceFactory.create(endpointId, serviceGuid);
    void this.cSIHelperService.load();
    this.csiState.setServiceGuid(serviceGuid);
    // setAll's last arg IS the serviceInstanceGuid — it overwrites whatever was
    // there (default null). Pass si.guid here so the edit-mode PATCH targets the
    // real instance; a separate setServiceInstanceGuid() before setAll would be
    // immediately clobbered back to null, sending PATCH .../null → CF 404 (#5412).
    this.csiState.setAll(si.name, spaceGuid, si.tags ?? [], '', false, si.guid);
    if (si.servicePlan?.guid) {
      this.csiState.setServicePlan(si.servicePlan.guid);
    }
    setTimeout(() => {
      this._title.set(`Edit Service Instance: ${si.name}`);
    }, 0);
  }

  // Marketplace mode setup. Resolves the route params, primes csi state,
  // awaits the connected CF endpoint list signal, and selects the
  // requested endpoint. The serviceName$ subscription stays — it just
  // imperatively updates the title as the helper resolves.
  private async initialiseForMarketplaceMode(): Promise<boolean> {
    const { endpointId, serviceId } = this.activatedRoute.snapshot.params;

    if (!endpointId) {
      return this.failSetup(
        'initialiseForMarketplaceMode: endpointId is missing from route params',
        'Cannot initialize service instance creation: Cloud Foundry endpoint ID is required',
      );
    }
    if (!serviceId) {
      return this.failSetup(
        'initialiseForMarketplaceMode: serviceId is missing from route params',
        'Cannot initialize service instance creation: Service ID is required',
      );
    }

    try {
      this.csiGuidsService.cfGuid = endpointId;
      this.csiGuidsService.serviceGuid = serviceId;
      this.cSIHelperService = this.cSIHelperServiceFactory.create(endpointId, serviceId);
      void this.cSIHelperService.load();
      if (this.modeService.spaceScopedDetails.isSpaceScoped) {
        this.csiState.setCFDetails(
          endpointId,
          this.modeService.spaceScopedDetails.orgGuid,
          this.modeService.spaceScopedDetails.spaceGuid,
        );
      } else {
        this.csiState.setCFDetails(endpointId);
      }
      this.csiState.setServiceGuid(serviceId);
      const planGuid = this.activatedRoute.snapshot.queryParams[SERVICE_PLAN_URL_PARAM];
      if (planGuid) {
        this.csiState.setServicePlan(planGuid);
      }
    } catch (error) {
      return this.failSetup(
        `initialiseForMarketplaceMode: Error during service configuration (endpointId=${endpointId}, serviceId=${serviceId}): ${error instanceof Error ? error.message : String(error)}`,
        'Failed to configure service instance creation.',
      );
    }

    // Title is set imperatively as the helper resolves the service name.
    // setTimeout pushes each update past the current change-detection
    // cycle to avoid ExpressionChangedAfterItHasBeenChecked.
    this.cSIHelperService.serviceName$.pipe(
      catchError(error => {
        console.error('initialiseForMarketplaceMode: Failed to fetch service name', {
          serviceId,
          endpointId,
          error
        });
        return observableOf('');
      }),
      takeUntil(this.destroyed$)
    ).subscribe(label => {
      const title = `Create Instance: ${label || 'Service'}`;
      setTimeout(() => {
        this._title.set(title);
        this._serviceName.set(label || '');
      }, 0);
    });
    this.marketPlaceMode = true;

    let endpoints: ReadonlyArray<unknown>;
    try {
      endpoints = await this.awaitNonEmpty(this.cfOrgSpaceService.cf.list);
    } catch (error) {
      return this.failSetup(
        `initialiseForMarketplaceMode: Failed to await connected CF endpoints (endpointId=${endpointId}): ${error instanceof Error ? error.message : String(error)}`,
        'Failed to initialize service creation. Please ensure your Cloud Foundry connection is active.',
      );
    }
    if (endpoints.length === 0) {
      return this.failSetup(
        'initialiseForMarketplaceMode: No Cloud Foundry endpoints available',
        'No Cloud Foundry endpoints available',
      );
    }
    this.cfOrgSpaceService.cf.select.set(endpointId);
    return true;
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.selectCFSub?.unsubscribe();
    this.selectServiceFetchSub?.unsubscribe();
    this.specifyDetailsValidSub?.unsubscribe();
    this.specifyDetailsInitSub?.unsubscribe();
    this.skipAppsSub?.unsubscribe();
    try {
      this.csiState.reset();
    } catch (error) {
      console.error('ngOnDestroy: Error resetting CSI state', error);
      // Non-critical during cleanup, just log
    }
  }

  isSpaceScoped = () => this.modeService.spaceScopedDetails.isSpaceScoped;
}
