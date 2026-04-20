import { HttpClient } from '@angular/common/http';
import { computed, signal, Signal } from '@angular/core';
import { EMPTY, merge, Observable } from 'rxjs';
import { catchError, finalize, tap, timeout } from 'rxjs/operators';
import { StError, StOrgDetail, StSpace } from './stratos-types';

export class OrgDataService {
  private readonly _org = signal<StOrgDetail | null>(null);
  private readonly _spaces = signal<StSpace[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errors = signal<StError[]>([]);

  readonly org: Signal<StOrgDetail | null> = this._org.asReadonly();
  readonly spaces: Signal<StSpace[]> = this._spaces.asReadonly();
  readonly spaceCount = computed(() => this._spaces().length);
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly errors: Signal<StError[]> = this._errors.asReadonly();

  constructor(
    private readonly http: HttpClient,
    readonly cnsiGuid: string,
    readonly orgGuid: string,
  ) {}

  load(): Observable<void> {
    this._isLoading.set(true);
    this._errors.set([]);

    return merge(
      this.http.get<StOrgDetail>(`/pp/v1/cf/org/${this.cnsiGuid}/${this.orgGuid}`).pipe(
        tap(org => this._org.set({
          ...org,
          cnsiGuid: this.cnsiGuid,
          spaces: (org.spaces ?? []).map(space => ({ ...space, cnsiGuid: this.cnsiGuid })),
        })),
        catchError(err => { this.addError('org', err); return EMPTY; }),
      ),
      this.http.get<{ resources: StSpace[]; totalResults: number }>(
        `/pp/v1/cf/org/${this.cnsiGuid}/${this.orgGuid}/spaces`,
      ).pipe(
        tap(resp => this._spaces.set(resp.resources.map(space => ({ ...space, cnsiGuid: this.cnsiGuid })))),
        catchError(err => { this.addError('spaces', err); return EMPTY; }),
      ),
    ).pipe(
      timeout(60_000),
      finalize(() => this._isLoading.set(false)),
    ) as Observable<void>;
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
