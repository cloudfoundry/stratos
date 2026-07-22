import { HttpClient } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { EMPTY, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap, timeout } from 'rxjs/operators';

import { ICfV2Info } from '../../cf-api.types';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { StError } from './stratos-types';

// V3-native CF info data source. Hits /pp/v1/cf/info/:cnsiGuid (handled by
// getNativeCFInfo in native_info.go) which projects /v3/info + the root
// link map into the legacy /v2/info wire shape — same field names, V3
// data underneath. Replaces cfEntityCatalog.cfInfo.store.getEntityService
// (the last V2-era info fetcher).
//
// Mirrors OrgDataService — same in-flight dedup + warm-cache short-circuit
// pattern so concurrent callers share one HTTP fan-out.
export class CfInfoDataService {
  private readonly _info = signal<ICfV2Info | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errors = signal<StError[]>([]);
  private readonly _lastFetched = signal<Date | null>(null);

  readonly info: Signal<ICfV2Info | null> = this._info.asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly errors: Signal<StError[]> = this._errors.asReadonly();
  readonly lastFetched: Signal<Date | null> = this._lastFetched.asReadonly();

  readonly loaded$ = new ReplaySubject<void>(1);

  private _inFlightLoad: Observable<void> | null = null;

  constructor(
    private readonly http: HttpClient,
    readonly cnsiGuid: string,
    private readonly diagnostics?: StratosDiagnostics,
  ) {}

  /**
   * Bypass the warm-cache short-circuit and force a fresh `/pp/v1/cf/info/{cnsi}`
   * fetch. Used by the CF endpoint health-check pulse — load() would otherwise
   * return the cached value forever once warm. In-flight dedup still applies.
   */
  refresh(): Observable<void> {
    this._lastFetched.set(null);
    return this.load();
  }

  load(): Observable<void> {
    this.diagnostics?.emitCounter('service-call-count', { service: 'CfInfoDataService', method: 'load' });
    if (this._lastFetched() !== null && this._info() !== null) {
      this.diagnostics?.emitCounter('cache-hit', { service: 'CfInfoDataService', method: 'load' });
      return of(undefined);
    }
    if (this._inFlightLoad) {
      this.diagnostics?.emitCounter('in-flight-hit', { service: 'CfInfoDataService', method: 'load' });
      return this._inFlightLoad;
    }
    this.diagnostics?.emitCounter('cache-miss', { service: 'CfInfoDataService', method: 'load' });
    this._isLoading.set(true);
    this._errors.set([]);

    this._inFlightLoad = this.http.get<ICfV2Info>(`/pp/v1/cf/info/${this.cnsiGuid}`).pipe(
      tap(info => this._info.set(info)),
      catchError(err => { this.addError('info', err); return EMPTY; }),
      timeout(60_000),
      map(() => undefined),
      finalize(() => {
        this._isLoading.set(false);
        this._lastFetched.set(new Date());
        this.loaded$.next();
        this._inFlightLoad = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this._inFlightLoad;
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
