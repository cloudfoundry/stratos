import { HttpClient } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { EMPTY, merge, Observable, Subject } from 'rxjs';
import { catchError, finalize, tap, timeout } from 'rxjs/operators';
import { EndpointDataShim } from './endpoint-data.shim';
import { StApp, StEndpointData, StError, StOrg } from './stratos-types';

export class EndpointDataService {
  private readonly _orgs = signal<StOrg[]>([]);
  private readonly _orgCount = signal<number>(0);
  private readonly _apps = signal<StApp[]>([]);
  private readonly _appCount = signal<number>(0);
  private readonly _routeCount = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errors = signal<StError[]>([]);
  private readonly _lastFetched = signal<Date | null>(null);

  readonly orgs: Signal<StOrg[]> = this._orgs.asReadonly();
  readonly apps: Signal<StApp[]> = this._apps.asReadonly();
  readonly orgCount: Signal<number> = this._orgCount.asReadonly();
  readonly appCount: Signal<number> = this._appCount.asReadonly();
  readonly routeCount: Signal<number> = this._routeCount.asReadonly();
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
        tap(resp => {
          this._orgs.set(resp.resources);
          this._orgCount.set(resp.totalResults);
        }),
        catchError(err => { this.addError('orgs', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StApp[]; totalResults: number }>(`/pp/v1/cf/apps/${this.guid}`).pipe(
        tap(resp => {
          this._apps.set(resp.resources);
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
      // finalize runs on completion, error, AND timeout — shim.write intentionally
      // fires in all cases so sticky signals are written even on partial failure.
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
      orgCount: this._orgCount(),
      apps: this._apps(),
      appCount: this._appCount(),
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
