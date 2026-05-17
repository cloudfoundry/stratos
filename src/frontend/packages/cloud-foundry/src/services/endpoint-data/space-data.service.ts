import { HttpClient } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { EMPTY, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, finalize, shareReplay, tap, timeout } from 'rxjs/operators';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { StError, StSpace } from './stratos-types';

// V3-native space-detail data source. Backs CloudFoundrySpaceService.space$
// once the V2-includes URL path is retired (Phase B of the
// v2-includes-migration). Mirrors OrgDataService — same in-flight dedup +
// warm-cache short-circuit pattern so concurrent callers share one HTTP
// fan-out.
export class SpaceDataService {
  private readonly _space = signal<StSpace | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errors = signal<StError[]>([]);
  private readonly _lastFetched = signal<Date | null>(null);

  readonly space: Signal<StSpace | null> = this._space.asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly errors: Signal<StError[]> = this._errors.asReadonly();
  readonly lastFetched: Signal<Date | null> = this._lastFetched.asReadonly();

  readonly loaded$ = new ReplaySubject<void>(1);

  private _inFlightLoad: Observable<void> | null = null;

  constructor(
    private readonly http: HttpClient,
    readonly cnsiGuid: string,
    readonly spaceGuid: string,
    private readonly diagnostics?: StratosDiagnostics,
  ) {}

  load(): Observable<void> {
    this.diagnostics?.emitCounter('service-call-count', { service: 'SpaceDataService', method: 'load' });
    if (this._lastFetched() !== null && this._space() !== null) {
      this.diagnostics?.emitCounter('cache-hit', { service: 'SpaceDataService', method: 'load' });
      return of(undefined);
    }
    if (this._inFlightLoad) {
      this.diagnostics?.emitCounter('in-flight-hit', { service: 'SpaceDataService', method: 'load' });
      return this._inFlightLoad;
    }
    this.diagnostics?.emitCounter('cache-miss', { service: 'SpaceDataService', method: 'load' });
    this._isLoading.set(true);
    this._errors.set([]);

    this._inFlightLoad = this.http.get<StSpace>(`/pp/v1/cf/spaces/${this.cnsiGuid}/${this.spaceGuid}`).pipe(
      // Backend echoes cnsiGuid on StSpace; no client-side stamp.
      tap(space => this._space.set(space)),
      catchError(err => { this.addError('space', err); return EMPTY; }),
      timeout(60_000),
      finalize(() => {
        this._isLoading.set(false);
        this._lastFetched.set(new Date());
        this.loaded$.next();
        this._inFlightLoad = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    ) as Observable<void>;
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
