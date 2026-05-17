import { HttpClient } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { EMPTY, firstValueFrom, from, merge, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, finalize, map, mergeMap, reduce, shareReplay, switchMap, tap, timeout } from 'rxjs/operators';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { EndpointDataShim } from './endpoint-data.shim';
import {
  StApp,
  StEndpointData,
  StError,
  StOrg,
  StServiceBroker,
  StServiceCredentialBinding,
  StServiceInstance,
  StServiceOffering,
  StServicePlan,
  StSpace,
} from './stratos-types';

export class EndpointDataService {
  // Counts + recent apps populated by load() (home card fast path).
  private readonly _orgCount = signal<number>(0);
  private readonly _appCount = signal<number>(0);
  private readonly _recentApps = signal<StApp[]>([]);
  private readonly _routeCount = signal<number>(0);

  // Full lists populated by loadDetails() for detail views / NGRX populate.
  private readonly _orgs = signal<StOrg[]>([]);
  private readonly _apps = signal<StApp[]>([]);
  private readonly _spaces = signal<StSpace[]>([]);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _isLoadingDetails = signal<boolean>(false);
  private readonly _errors = signal<StError[]>([]);
  private readonly _lastFetched = signal<Date | null>(null);
  private readonly _detailsLastFetched = signal<Date | null>(null);

  // Services-domain entities (signal+V3 slice). Counts populated by
  // loadServicesCounts() (home-card fast path); full lists populated by
  // per-entity load methods added per handler rework. List signals remain
  // empty until their handler is reworked end-to-end. Bindings are app-
  // scoped on the wire so no CNSI-level binding count is computed here —
  // bindings counts derive from the loaded list filtered per app.
  private readonly _serviceInstancesCount = signal<number>(0);
  private readonly _serviceOfferingsCount = signal<number>(0);
  private readonly _servicePlansCount = signal<number>(0);
  private readonly _serviceBrokersCount = signal<number>(0);

  private readonly _serviceInstances = signal<StServiceInstance[]>([]);
  private readonly _serviceOfferings = signal<StServiceOffering[]>([]);
  private readonly _servicePlans = signal<StServicePlan[]>([]);
  private readonly _serviceBrokers = signal<StServiceBroker[]>([]);
  private readonly _serviceCredentialBindings = signal<StServiceCredentialBinding[]>([]);

  private readonly _isLoadingServicesCounts = signal<boolean>(false);
  private readonly _servicesCountsLastFetched = signal<Date | null>(null);
  private readonly _isLoadingServicesDetails = signal<boolean>(false);
  private readonly _servicesDetailsLastFetched = signal<Date | null>(null);

  readonly orgs: Signal<StOrg[]> = this._orgs.asReadonly();
  readonly apps: Signal<StApp[]> = this._apps.asReadonly();
  readonly recentApps: Signal<StApp[]> = this._recentApps.asReadonly();
  readonly spaces: Signal<StSpace[]> = this._spaces.asReadonly();
  readonly orgCount: Signal<number> = this._orgCount.asReadonly();
  readonly appCount: Signal<number> = this._appCount.asReadonly();
  readonly routeCount: Signal<number> = this._routeCount.asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly isLoadingDetails: Signal<boolean> = this._isLoadingDetails.asReadonly();
  readonly errors: Signal<StError[]> = this._errors.asReadonly();
  readonly lastFetched: Signal<Date | null> = this._lastFetched.asReadonly();
  readonly detailsLastFetched: Signal<Date | null> = this._detailsLastFetched.asReadonly();

  readonly serviceInstances: Signal<StServiceInstance[]> = this._serviceInstances.asReadonly();
  readonly serviceOfferings: Signal<StServiceOffering[]> = this._serviceOfferings.asReadonly();
  readonly servicePlans: Signal<StServicePlan[]> = this._servicePlans.asReadonly();
  readonly serviceBrokers: Signal<StServiceBroker[]> = this._serviceBrokers.asReadonly();
  readonly serviceCredentialBindings: Signal<StServiceCredentialBinding[]> = this._serviceCredentialBindings.asReadonly();
  readonly serviceInstancesCount: Signal<number> = this._serviceInstancesCount.asReadonly();
  readonly serviceOfferingsCount: Signal<number> = this._serviceOfferingsCount.asReadonly();
  readonly servicePlansCount: Signal<number> = this._servicePlansCount.asReadonly();
  readonly serviceBrokersCount: Signal<number> = this._serviceBrokersCount.asReadonly();
  readonly isLoadingServicesCounts: Signal<boolean> = this._isLoadingServicesCounts.asReadonly();
  readonly servicesCountsLastFetched: Signal<Date | null> = this._servicesCountsLastFetched.asReadonly();
  readonly isLoadingServicesDetails: Signal<boolean> = this._isLoadingServicesDetails.asReadonly();
  readonly servicesDetailsLastFetched: Signal<Date | null> = this._servicesDetailsLastFetched.asReadonly();

  // ReplaySubject(1) — late subscribers (e.g. the home card's async pipe
  // subscribing after the HTTP has already completed) immediately receive the
  // last emission so they don't hang forever on a stream that already fired.
  readonly loaded$ = new ReplaySubject<void>(1);
  readonly detailsLoaded$ = new ReplaySubject<void>(1);

  // In-flight dedup. Concurrent callers before the first HTTP completes share
  // the same Observable instead of each firing their own fan-out — without
  // this, multiple subscribers (org-list + endpoint summary + recents) each
  // start fresh requests; teardown of the first subscriber aborts its in-
  // flight requests (ERR_ABORTED), leaving only the last to complete.
  private _inFlightLoad: Observable<void> | null = null;
  private _inFlightLoadDetails: Observable<void> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly shim: EndpointDataShim,
    readonly guid: string,
    private readonly diagnostics?: StratosDiagnostics,
  ) {}

  // load() populates counts + the 10 most-recent apps via fast per_page=1/10
  // backend calls. Fires loadDetails() in the background on completion so
  // the full orgs/apps/spaces arrays are populated for detail views.
  load(): Observable<void> {
    this.diagnostics?.emitCounter('service-call-count', { service: 'EndpointDataService', method: 'load' });
    // Warm-cache short-circuit: signals already populated, no network needed.
    // Without this, every consumer that calls load() fires the full HTTP
    // fan-out — measured as ~3-15s per endpoint on adepttech.
    if (this._lastFetched() !== null && this._recentApps().length > 0) {
      this.diagnostics?.emitCounter('cache-hit', { service: 'EndpointDataService', method: 'load' });
      return of(undefined);
    }
    if (this._inFlightLoad) {
      this.diagnostics?.emitCounter('in-flight-hit', { service: 'EndpointDataService', method: 'load' });
      return this._inFlightLoad;
    }
    this.diagnostics?.emitCounter('cache-miss', { service: 'EndpointDataService', method: 'load' });
    this._isLoading.set(true);
    this._errors.set([]);

    this._inFlightLoad = merge(
      this.http.get<{ resources: StOrg[]; totalResults: number }>(`/pp/v1/cf/orgs/${this.guid}?return=counts`).pipe(
        tap(resp => this._orgCount.set(resp.totalResults)),
        catchError(err => { this.addError('orgs', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StApp[]; totalResults: number }>(`/pp/v1/cf/apps/${this.guid}?return=recent`).pipe(
        tap(resp => {
          // Backend echoes cnsiGuid on every StApp; no client-side stamp.
          this._recentApps.set(resp.resources);
          this._appCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('apps', err); return EMPTY; }),
      ),
      // ?return=counts hits the backend per_page=1 fast path — without it
      // we fall through to the full route list + ListDestinations path,
      // which delays the home-card route count behind the apps fetch.
      this.http.get<{ totalResults: number }>(`/pp/v1/cf/routes/${this.guid}?return=counts`).pipe(
        tap(resp => this._routeCount.set(resp.totalResults)),
        catchError(err => { this.addError('routes', err); return EMPTY; }),
      ),
    ).pipe(
      timeout(60_000),
      finalize(() => {
        this._isLoading.set(false);
        this._lastFetched.set(new Date());
        // Shim write-through is intentionally NOT called here. Counts + recent
        // apps populate service signals for the home card directly; the NGRX
        // pagination store only needs the full lists, which loadDetails()
        // dispatches via shim.write() in its own finalize().
        this.loaded$.next();
        this._inFlightLoad = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    ) as Observable<void>;
    return this._inFlightLoad;
  }

  // loadDetails() fetches the full orgs/apps/spaces lists (paginated
  // server-side) for detail views and NGRX populate.
  loadDetails(): Observable<void> {
    this.diagnostics?.emitCounter('service-call-count', { service: 'EndpointDataService', method: 'loadDetails' });
    if (this._detailsLastFetched() !== null && this._orgs().length > 0) {
      this.diagnostics?.emitCounter('cache-hit', { service: 'EndpointDataService', method: 'loadDetails' });
      return of(undefined);
    }
    if (this._inFlightLoadDetails) {
      this.diagnostics?.emitCounter('in-flight-hit', { service: 'EndpointDataService', method: 'loadDetails' });
      return this._inFlightLoadDetails;
    }
    this.diagnostics?.emitCounter('cache-miss', { service: 'EndpointDataService', method: 'loadDetails' });
    this._isLoadingDetails.set(true);

    // Full-drain pagination: fetch page 1, then pages 2..N in parallel with
    // bounded concurrency. Replaces the previous ?page=1 single-page cap
    // that silently truncated lists to 500 rows on CFs with more orgs /
    // apps / spaces than fit in one page — that was a live regression on
    // the prod orgs list page (CloudFoundryOrganizationsSignalComponent),
    // not just the home card.
    //
    // 500 per page balances per-request latency vs round-trip count.
    // Concurrency cap of 4 keeps parallel page fetches from saturating
    // the connection or hitting gorouter back-pressure on slow CFs.
    // Backend echoes cnsiGuid on every StOrg/StApp/StSpace; no
    // client-side stamping needed here.
    this._inFlightLoadDetails = merge(
      this.drainPages<StOrg>(`/pp/v1/cf/orgs/${this.guid}`).pipe(
        tap(resp => {
          this._orgs.set(resp.resources);
          this._orgCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('orgs-full', err); return EMPTY; }),
      ),
      this.drainPages<StApp>(`/pp/v1/cf/apps/${this.guid}`).pipe(
        tap(resp => {
          this._apps.set(resp.resources);
          this._appCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('apps-full', err); return EMPTY; }),
      ),
      this.drainPages<StSpace>(`/pp/v1/cf/spaces/${this.guid}`).pipe(
        tap(resp => this._spaces.set(resp.resources)),
        catchError(err => { this.addError('spaces-full', err); return EMPTY; }),
      ),
    ).pipe(
      timeout(120_000),
      finalize(() => {
        this._isLoadingDetails.set(false);
        this._detailsLastFetched.set(new Date());
        this.shim.write(this.guid, this.currentData());
        this.detailsLoaded$.next();
        this._inFlightLoadDetails = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    ) as Observable<void>;
    return this._inFlightLoadDetails;
  }

  // Drain all pages for a Stratos-shape list endpoint. Page 1 inline,
  // pages 2..N in parallel (concurrency=4). Reads totalPages from the
  // StratosPagedResponse pagination meta (stratos_paging.go:68). Reduces
  // to a single {resources, totalResults, totalPages} envelope so the
  // caller can populate count signals from page-1 metadata without an
  // extra fetch. Tolerates both StratosPagedResponse and the older
  // flat-envelope shape (totalResults at the top level) — the backend
  // PR #5337 era still has handlers in transition.
  private drainPages<T>(urlBase: string): Observable<{ resources: T[]; totalResults: number; totalPages: number }> {
    const perPage = 500;
    type Paged<U> = { resources: U[]; totalResults?: number; pagination?: { totalResults?: number; totalPages?: number } };
    const totalResultsOf = <U>(r: Paged<U>): number => r.pagination?.totalResults ?? r.totalResults ?? r.resources.length;
    const fetchPage = (page: number) =>
      this.http.get<Paged<T>>(`${urlBase}?per_page=${perPage}&page=${page}`);
    return fetchPage(1).pipe(
      switchMap(firstResp => {
        const totalResults = totalResultsOf(firstResp);
        const totalPages = firstResp.pagination?.totalPages ?? 1;
        const firstResources = firstResp.resources;
        if (totalPages <= 1) {
          return of({ resources: firstResources, totalResults, totalPages });
        }
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        return from(remainingPages).pipe(
          mergeMap(p => fetchPage(p).pipe(map(r => r.resources)), 4 /* concurrency */),
          reduce((acc, resources) => [...acc, ...resources], [...firstResources]),
          map(allResources => ({ resources: allResources, totalResults, totalPages })),
        );
      }),
    );
  }

  // loadServicesCounts() fetches the four cnsi-scoped services-domain counts
  // in parallel via the existing `?return=counts` convention. Used by the
  // home-card services tile and by anywhere else that needs cheap totals
  // before the full lists are loaded. Per-entity errors are captured but
  // do not block the other counts. Returns Promise<void> rather than
  // Observable<void> — no legacy consumer needs the Observable wrapper
  // (services slice convention).
  //
  // Bindings are app-scoped on the wire (no cnsi-scoped credential-bindings
  // endpoint exists) so no binding count is computed here. Bindings counts
  // derive from the per-app loaded list as needed.
  async loadServicesCounts(): Promise<void> {
    this.diagnostics?.emitCounter('service-call-count', { service: 'EndpointDataService', method: 'loadServicesCounts' });
    this._isLoadingServicesCounts.set(true);

    type CountsResp = { totalResults: number };
    const fetch = (path: string, errKey: string): Promise<CountsResp> => firstValueFrom(
      this.http.get<CountsResp>(path).pipe(
        catchError(err => {
          this.addError(errKey, err);
          return of({ totalResults: 0 } as CountsResp);
        }),
      ),
    );

    try {
      const [insts, offerings, plans, brokers] = await Promise.all([
        fetch(`/pp/v1/cf/service_instances/${this.guid}?return=counts`, 'service-instances-counts'),
        fetch(`/pp/v1/cf/service_offerings/${this.guid}?return=counts`, 'service-offerings-counts'),
        fetch(`/pp/v1/cf/service_plans/${this.guid}?return=counts`, 'service-plans-counts'),
        fetch(`/pp/v1/cf/service_brokers/${this.guid}?return=counts`, 'service-brokers-counts'),
      ]);
      this._serviceInstancesCount.set(insts.totalResults);
      this._serviceOfferingsCount.set(offerings.totalResults);
      this._servicePlansCount.set(plans.totalResults);
      this._serviceBrokersCount.set(brokers.totalResults);
    } finally {
      this._isLoadingServicesCounts.set(false);
      this._servicesCountsLastFetched.set(new Date());
    }
  }

  // loadServicesDetails() fetches the four cnsi-scoped services-domain lists
  // (instances, offerings, plans, brokers) at ?return=summary so consumers
  // get name + ref-chain population in one round-trip per list. Mirrors
  // loadDetails()'s warm-cache short-circuit + bounded per_page semantics.
  // Bindings stay app-scoped on the wire — load them per-app where needed.
  async loadServicesDetails(): Promise<void> {
    this.diagnostics?.emitCounter('service-call-count', { service: 'EndpointDataService', method: 'loadServicesDetails' });
    if (this._servicesDetailsLastFetched() !== null && this._servicePlans().length > 0) {
      this.diagnostics?.emitCounter('cache-hit', { service: 'EndpointDataService', method: 'loadServicesDetails' });
      return;
    }
    this.diagnostics?.emitCounter('cache-miss', { service: 'EndpointDataService', method: 'loadServicesDetails' });
    this._isLoadingServicesDetails.set(true);

    const detailPerPage = 500;
    type Paged<T> = { resources: T[]; totalResults?: number; pagination?: { totalResults?: number } };
    const totalOf = <T>(r: Paged<T>): number => r.pagination?.totalResults ?? r.totalResults ?? r.resources.length;
    const fetch = <T>(path: string, errKey: string): Promise<Paged<T>> => firstValueFrom(
      this.http.get<Paged<T>>(path).pipe(
        catchError(err => {
          this.addError(errKey, err);
          return of({ resources: [], totalResults: 0 } as Paged<T>);
        }),
      ),
    );

    try {
      const [insts, offerings, plans, brokers] = await Promise.all([
        fetch<StServiceInstance>(`/pp/v1/cf/service_instances/${this.guid}?return=summary&per_page=${detailPerPage}&page=1`, 'service-instances-full'),
        fetch<StServiceOffering>(`/pp/v1/cf/service_offerings/${this.guid}?return=summary&per_page=${detailPerPage}&page=1`, 'service-offerings-full'),
        fetch<StServicePlan>(`/pp/v1/cf/service_plans/${this.guid}?return=summary&per_page=${detailPerPage}&page=1`, 'service-plans-full'),
        fetch<StServiceBroker>(`/pp/v1/cf/service_brokers/${this.guid}?return=summary&per_page=${detailPerPage}&page=1`, 'service-brokers-full'),
      ]);
      this._serviceInstances.set(insts.resources.map(si => ({ ...si, cnsiGuid: this.guid })));
      this._serviceOfferings.set(offerings.resources.map(o => ({ ...o, cnsiGuid: this.guid })));
      this._servicePlans.set(plans.resources.map(p => ({ ...p, cnsiGuid: this.guid })));
      this._serviceBrokers.set(brokers.resources.map(b => ({ ...b, cnsiGuid: this.guid })));
      this._serviceInstancesCount.set(totalOf(insts));
      this._serviceOfferingsCount.set(totalOf(offerings));
      this._servicePlansCount.set(totalOf(plans));
      this._serviceBrokersCount.set(totalOf(brokers));
    } finally {
      this._isLoadingServicesDetails.set(false);
      this._servicesDetailsLastFetched.set(new Date());
    }
  }

  // Read accessor for the offerings + plans bundle. Returns null when no
  // services-details fetch has completed yet (cache cold). Used by the
  // marketplace signal-config to decide whether to pre-seed its
  // CnsiServiceOfferingsSource from the registry's pre-warmed cache
  // instead of re-firing the offerings HTTP call.
  serviceOfferingsAndPlans(): { offerings: StServiceOffering[], plans: StServicePlan[] } | null {
    if (this._servicesDetailsLastFetched() === null) return null;
    return { offerings: this._serviceOfferings(), plans: this._servicePlans() };
  }

  // Read accessor for the instances + brokers bundle. Returns null when no
  // services-details fetch has completed yet (cache cold). Used by the
  // services-instances signal-config to decide whether to pre-seed its
  // CnsiServiceInstancesSource from the registry's pre-warmed cache
  // instead of re-firing the instances HTTP call.
  serviceInstancesAndBrokers(): { instances: StServiceInstance[], brokers: StServiceBroker[] } | null {
    if (this._servicesDetailsLastFetched() === null) return null;
    return { instances: this._serviceInstances(), brokers: this._serviceBrokers() };
  }

  // Setter used by the marketplace signal-config after its orchestrator
  // load() completes. Stamps the services-details timestamp so subsequent
  // reads via serviceOfferingsAndPlans() see a hot cache. Plans may be []
  // when the writer only had offerings in scope — that's fine; the cache
  // gate is the timestamp, not array length.
  setServiceOfferingsAndPlans(offerings: StServiceOffering[], plans: StServicePlan[]): void {
    this._serviceOfferings.set(offerings);
    this._servicePlans.set(plans);
    this._servicesDetailsLastFetched.set(new Date());
  }

  // Setter used by the services-instances signal-config after its
  // orchestrator load() completes. Mirrors the offerings setter shape;
  // brokers may be [] when the writer only had instances in scope.
  setServiceInstancesAndBrokers(instances: StServiceInstance[], brokers: StServiceBroker[]): void {
    this._serviceInstances.set(instances);
    this._serviceBrokers.set(brokers);
    this._servicesDetailsLastFetched.set(new Date());
  }

  currentData(): StEndpointData {
    return {
      orgs: this._orgs(),
      orgCount: this._orgCount(),
      apps: this._apps(),
      recentApps: this._recentApps(),
      appCount: this._appCount(),
      spaces: this._spaces(),
      routeCount: this._routeCount(),
    };
  }

  private addError(resource: string, err: unknown): void {
    this._errors.update(errors => [...errors, {
      resource,
      severity: 'error' as const,
      message: err instanceof Error ? err.message : String(err),
      recoverable: true,
      detail: err,
    }]);
  }
}
