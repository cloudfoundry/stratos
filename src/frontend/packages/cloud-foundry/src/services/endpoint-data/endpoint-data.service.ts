import { HttpClient } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { EMPTY, merge, Observable, Subject } from 'rxjs';
import { catchError, finalize, tap, timeout } from 'rxjs/operators';
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

  readonly loaded$ = new Subject<void>();
  readonly detailsLoaded$ = new Subject<void>();

  constructor(
    private readonly http: HttpClient,
    private readonly shim: EndpointDataShim,
    readonly guid: string,
  ) {}

  // load() populates counts + the 10 most-recent apps via fast per_page=1/10
  // backend calls. Fires loadDetails() in the background on completion so
  // the full orgs/apps/spaces arrays are populated for detail views.
  load(): Observable<void> {
    this._isLoading.set(true);
    this._errors.set([]);

    return merge(
      this.http.get<{ resources: StOrg[]; totalResults: number }>(`/pp/v1/cf/orgs/${this.guid}?return=counts`).pipe(
        tap(resp => this._orgCount.set(resp.totalResults)),
        catchError(err => { this.addError('orgs', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StApp[]; totalResults: number }>(`/pp/v1/cf/apps/${this.guid}?return=recent`).pipe(
        tap(resp => {
          this._recentApps.set(resp.resources);
          this._appCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('apps', err); return EMPTY; }),
      ),
      this.http.get<{ totalResults: number }>(`/pp/v1/cf/routes/${this.guid}`).pipe(
        tap(resp => this._routeCount.set(resp.totalResults)),
        catchError(err => { this.addError('routes', err); return EMPTY; }),
      ),
    ).pipe(
      timeout(60_000),
      finalize(() => {
        this._isLoading.set(false);
        this._lastFetched.set(new Date());
        this.shim.write(this.guid, this.currentData());
        this.loaded$.next();
      }),
    ) as Observable<void>;
  }

  // loadDetails() fetches the full orgs/apps/spaces lists (paginated
  // server-side) for detail views and NGRX populate.
  loadDetails(): Observable<void> {
    this._isLoadingDetails.set(true);

    return merge(
      this.http.get<{ resources: StOrg[]; totalResults: number }>(`/pp/v1/cf/orgs/${this.guid}`).pipe(
        tap(resp => {
          this._orgs.set(resp.resources);
          this._orgCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('orgs-full', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StApp[]; totalResults: number }>(`/pp/v1/cf/apps/${this.guid}`).pipe(
        tap(resp => {
          this._apps.set(resp.resources);
          this._appCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('apps-full', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StSpace[]; totalResults: number }>(`/pp/v1/cf/spaces/${this.guid}`).pipe(
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
