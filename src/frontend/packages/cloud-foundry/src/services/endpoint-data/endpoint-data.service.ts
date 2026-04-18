import { HttpClient } from '@angular/common/http';
import { computed, signal, Signal } from '@angular/core';
import { EMPTY, merge, Observable, Subject } from 'rxjs';
import { catchError, finalize, tap, timeout } from 'rxjs/operators';
import { EndpointDataShim } from './endpoint-data.shim';
import { StApp, StEndpointData, StError, StOrg } from './stratos-types';

export class EndpointDataService {
  private readonly _orgs = signal<StOrg[]>([]);
  private readonly _apps = signal<StApp[]>([]);
  private readonly _routeCount = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errors = signal<StError[]>([]);
  private readonly _lastFetched = signal<Date | null>(null);

  readonly orgs: Signal<StOrg[]> = this._orgs.asReadonly();
  readonly apps: Signal<StApp[]> = this._apps.asReadonly();
  readonly routeCount: Signal<number> = this._routeCount.asReadonly();
  readonly orgCount = computed(() => this._orgs().length);
  readonly appCount = computed(() => this._apps().length);
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly errors: Signal<StError[]> = this._errors.asReadonly();
  readonly lastFetched: Signal<Date | null> = this._lastFetched.asReadonly();

  readonly loaded$ = new Subject<void>();

  constructor(
    private readonly http: HttpClient,
    private readonly shim: EndpointDataShim,
    readonly guid: string,
  ) {}

  load(): Observable<void> {
    this._isLoading.set(true);
    this._errors.set([]);

    return merge(
      this.http.get<{ resources: StOrg[]; totalResults: number }>(`/pp/v1/cf/orgs/${this.guid}`).pipe(
        tap(resp => this._orgs.set(resp.resources)),
        catchError(err => { this.addError('orgs', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StApp[]; totalResults: number }>(`/pp/v1/cf/apps/${this.guid}`).pipe(
        tap(resp => this._apps.set(resp.resources)),
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

  currentData(): StEndpointData {
    return {
      orgs: this._orgs(),
      apps: this._apps(),
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
