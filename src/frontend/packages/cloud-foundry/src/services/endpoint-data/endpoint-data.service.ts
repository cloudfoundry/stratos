import { HttpClient } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { EMPTY, merge, Observable, ReplaySubject } from 'rxjs';
import { catchError, finalize, tap, timeout } from 'rxjs/operators';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { EndpointDataShim } from './endpoint-data.shim';
import { StApp, StEndpointData, StError, StOrg, StSpace } from './stratos-types';

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

  // ReplaySubject(1) — late subscribers (e.g. the home card's async pipe
  // subscribing after the HTTP has already completed) immediately receive the
  // last emission so they don't hang forever on a stream that already fired.
  readonly loaded$ = new ReplaySubject<void>(1);
  readonly detailsLoaded$ = new ReplaySubject<void>(1);

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
    // Cache hit when we already have counts populated — the home card is
    // driven entirely by recentApps + counts, so a warm signal means no
    // network work is needed.
    if (this._lastFetched() !== null && this._recentApps().length > 0) {
      this.diagnostics?.emitCounter('cache-hit', { service: 'EndpointDataService', method: 'load' });
    } else {
      this.diagnostics?.emitCounter('cache-miss', { service: 'EndpointDataService', method: 'load' });
    }
    this._isLoading.set(true);
    this._errors.set([]);

    return merge(
      this.http.get<{ resources: StOrg[]; totalResults: number }>(`/pp/v1/cf/orgs/${this.guid}?return=counts`).pipe(
        tap(resp => this._orgCount.set(resp.totalResults)),
        catchError(err => { this.addError('orgs', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StApp[]; totalResults: number }>(`/pp/v1/cf/apps/${this.guid}?return=recent`).pipe(
        tap(resp => {
          this._recentApps.set(resp.resources.map(app => ({ ...app, cnsiGuid: this.guid })));
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
      }),
    ) as Observable<void>;
  }

  // loadDetails() fetches the full orgs/apps/spaces lists (paginated
  // server-side) for detail views and NGRX populate.
  loadDetails(): Observable<void> {
    this.diagnostics?.emitCounter('service-call-count', { service: 'EndpointDataService', method: 'loadDetails' });
    if (this._detailsLastFetched() !== null && this._orgs().length > 0) {
      this.diagnostics?.emitCounter('cache-hit', { service: 'EndpointDataService', method: 'loadDetails' });
    } else {
      this.diagnostics?.emitCounter('cache-miss', { service: 'EndpointDataService', method: 'loadDetails' });
    }
    this._isLoadingDetails.set(true);

    // Use the bounded ?per_page passthrough so each list call is one CAPI
    // page rather than a full-drain. On slow CFs the unbounded path could
    // hit gorouter's 30 s ceiling; even where it doesn't, a single bounded
    // page of 500 typically completes in well under 12 s. 500 covers most
    // CFs in one page; if a CF has more rows the home card shows the first
    // 500, accepted trade-off pending a guid-batch consolidation pattern.
    const detailPerPage = 500;
    return merge(
      this.http.get<{ resources: StOrg[]; totalResults: number }>(
        `/pp/v1/cf/orgs/${this.guid}?per_page=${detailPerPage}&page=1`,
      ).pipe(
        tap(resp => {
          this._orgs.set(resp.resources.map(org => ({ ...org, cnsiGuid: this.guid })));
          this._orgCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('orgs-full', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StApp[]; totalResults: number }>(
        `/pp/v1/cf/apps/${this.guid}?per_page=${detailPerPage}&page=1`,
      ).pipe(
        tap(resp => {
          this._apps.set(resp.resources.map(app => ({ ...app, cnsiGuid: this.guid })));
          this._appCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('apps-full', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StSpace[]; totalResults: number }>(
        `/pp/v1/cf/spaces/${this.guid}?per_page=${detailPerPage}&page=1`,
      ).pipe(
        tap(resp => this._spaces.set(resp.resources.map(space => ({ ...space, cnsiGuid: this.guid })))),
        catchError(err => { this.addError('spaces-full', err); return EMPTY; }),
      ),
    ).pipe(
      timeout(120_000),
      finalize(() => {
        this._isLoadingDetails.set(false);
        this._detailsLastFetched.set(new Date());
        this.shim.write(this.guid, this.currentData());
        this.detailsLoaded$.next();
      }),
    ) as Observable<void>;
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
