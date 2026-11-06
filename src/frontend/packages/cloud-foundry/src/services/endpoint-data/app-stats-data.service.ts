import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, signal, Signal } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap, timeout } from 'rxjs/operators';
import { StAppStat } from './stratos-types';

interface StAppStatsResponse {
  instances?: StAppStat[];
}

// Per-app stats source. One instance per (cnsi, appGuid) — registry-owned.
// Reads /pp/v1/cf/app-stats/:cnsi/:appGuid (the native handler that fronts
// /v3/apps/:guid/processes/web/stats). Cards / list cells call load() on
// init and read `running`/`stats` as Signals.
export class AppStatsDataService {
  private readonly _stats = signal<StAppStat[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<HttpErrorResponse | null>(null);
  private readonly _lastFetched = signal<Date | null>(null);

  readonly stats: Signal<StAppStat[]> = this._stats.asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly error: Signal<HttpErrorResponse | null> = this._error.asReadonly();
  readonly lastFetched: Signal<Date | null> = this._lastFetched.asReadonly();

  readonly running = computed(() =>
    this._stats().filter(s => (s.state || '').toUpperCase() === 'RUNNING').length,
  );

  private _inFlightLoad: Observable<void> | null = null;

  constructor(
    private readonly http: HttpClient,
    readonly cnsiGuid: string,
    readonly appGuid: string,
  ) {}

  load(): Observable<void> {
    if (this._lastFetched() !== null) {
      return of(undefined);
    }
    return this.fetch();
  }

  /**
   * Force a refetch. Used after lifecycle actions (start/stop/restart/restage/scale)
   * to keep cards showing the post-action running count without waiting
   * for the cache to expire.
   */
  refresh(): Observable<void> {
    this._lastFetched.set(null);
    return this.fetch();
  }

  private fetch(): Observable<void> {
    if (this._inFlightLoad) {
      return this._inFlightLoad;
    }
    this._isLoading.set(true);
    this._error.set(null);

    this._inFlightLoad = this.http.get<StAppStatsResponse>(
      `/pp/v1/cf/app-stats/${this.cnsiGuid}/${this.appGuid}`,
    ).pipe(
      tap(resp => this._stats.set(resp?.instances ?? [])),
      catchError((err: HttpErrorResponse) => {
        // STOPPED apps and similar 4xx land here; backend already
        // swallows CF-AppStoppedStatsError but a stray status code
        // shouldn't poison the running count. Leave _stats at [].
        this._stats.set([]);
        this._error.set(err);
        return EMPTY;
      }),
      timeout(60_000),
      map((): void => undefined),
      finalize(() => {
        this._isLoading.set(false);
        this._lastFetched.set(new Date());
        this._inFlightLoad = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    ) as Observable<void>;
    return this._inFlightLoad;
  }
}
