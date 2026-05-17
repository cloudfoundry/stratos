import { HttpClient } from '@angular/common/http';
import { computed, signal, Signal } from '@angular/core';
import { EMPTY, merge, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, finalize, shareReplay, tap, timeout } from 'rxjs/operators';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { StError, StOrgDetail, StSpace } from './stratos-types';

export class OrgDataService {
  private readonly _org = signal<StOrgDetail | null>(null);
  private readonly _spaces = signal<StSpace[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errors = signal<StError[]>([]);
  private readonly _lastFetched = signal<Date | null>(null);

  readonly org: Signal<StOrgDetail | null> = this._org.asReadonly();
  readonly spaces: Signal<StSpace[]> = this._spaces.asReadonly();
  readonly spaceCount = computed(() => this._spaces().length);
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly errors: Signal<StError[]> = this._errors.asReadonly();
  readonly lastFetched: Signal<Date | null> = this._lastFetched.asReadonly();

  // ReplaySubject so late subscribers see the last completion immediately
  // (matches EndpointDataService convention).
  readonly loaded$ = new ReplaySubject<void>(1);

  // In-flight dedup. Concurrent callers before the first HTTP completes share
  // the same Observable instead of each firing their own fan-out — mirrors
  // EndpointDataService.load(), which exists for the same reason.
  private _inFlightLoad: Observable<void> | null = null;

  constructor(
    private readonly http: HttpClient,
    readonly cnsiGuid: string,
    readonly orgGuid: string,
    private readonly diagnostics?: StratosDiagnostics,
  ) {}

  load(): Observable<void> {
    this.diagnostics?.emitCounter('service-call-count', { service: 'OrgDataService', method: 'load' });
    // Warm-cache short-circuit: signals already populated, no network needed.
    if (this._lastFetched() !== null && this._org() !== null) {
      this.diagnostics?.emitCounter('cache-hit', { service: 'OrgDataService', method: 'load' });
      return of(undefined);
    }
    if (this._inFlightLoad) {
      this.diagnostics?.emitCounter('in-flight-hit', { service: 'OrgDataService', method: 'load' });
      return this._inFlightLoad;
    }
    this.diagnostics?.emitCounter('cache-miss', { service: 'OrgDataService', method: 'load' });
    this._isLoading.set(true);
    this._errors.set([]);

    // Backend echoes cnsiGuid on StOrg + StSpace; no client-side stamping.
    this._inFlightLoad = merge(
      this.http.get<StOrgDetail>(`/pp/v1/cf/org/${this.cnsiGuid}/${this.orgGuid}`).pipe(
        tap(org => this._org.set(org)),
        catchError(err => { this.addError('org', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StSpace[]; totalResults: number }>(
        `/pp/v1/cf/org/${this.cnsiGuid}/${this.orgGuid}/spaces`,
      ).pipe(
        tap(resp => this._spaces.set(resp.resources)),
        catchError(err => { this.addError('spaces', err); return EMPTY; }),
      ),
    ).pipe(
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
