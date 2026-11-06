import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Signal, signal } from '@angular/core';
import { firstValueFrom, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { KubeListResponse, KUBE_LIST_DEFAULT_LIMIT } from './kube-paged-response';
import {
  KubeEndpointData,
  KubeNamespace,
  KubeVersionInfo,
  StratosError,
} from './kube-types';

// Per-endpoint signal cache for cluster-scoped k8s state. Mirrors CF's
// `EndpointDataService` 1:1 — counts + lists exposed as readonly signals,
// load() / refresh() drive HTTP, errors collected into a tristate-friendly
// envelope.
//
// Wire model:
//   - K8s API calls go through the Jetstream proxy at /pp/v1/proxy/...
//   - Auth is attached server-side; the client identifies the target
//     endpoint via the `x-cap-cnsi-list` header rather than a path
//     segment. (Original design doc had `/proxy/${kubeGuid}/...` — the
//     existing kubernetes effects show the actual contract is header-
//     based; honoring that contract here.)
//   - 403 / 404 / network errors on individual sub-fetches push a
//     StratosError onto the `_errors` signal AND tag the affected
//     field name in `_unavailable` so consumers can render "Not
//     Available" instead of crashing on an empty signal.
//
// Plain class, not @Injectable — instances are vended by
// KubeEndpointDataRegistry per (kubeGuid). DI is bypassed by design so
// the registry can pass the kubeGuid in the constructor.

export class KubeEndpointDataService {
  private readonly _kubeVersion = signal<string | null>(null);
  private readonly _nodeCount = signal<number>(0);
  private readonly _namespaces = signal<KubeNamespace[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _errors = signal<StratosError[]>([]);
  private readonly _unavailable = signal<string[]>([]);
  private readonly _lastFetched = signal<Date | null>(null);

  readonly kubeVersion: Signal<string | null> = this._kubeVersion.asReadonly();
  readonly nodeCount: Signal<number> = this._nodeCount.asReadonly();
  readonly namespaces: Signal<KubeNamespace[]> = this._namespaces.asReadonly();
  readonly namespaceCount: Signal<number> = signal(0).asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly errors: Signal<StratosError[]> = this._errors.asReadonly();
  readonly unavailable: Signal<string[]> = this._unavailable.asReadonly();
  readonly lastFetched: Signal<Date | null> = this._lastFetched.asReadonly();

  // ReplaySubject(1) — late subscribers get the last emission so they
  // don't hang on a stream that already completed before they wired up.
  readonly loaded$ = new ReplaySubject<void>(1);

  // `clusterName` is just the kubeGuid for now — k8s has no global
  // "cluster name" field on /version, so the human-friendly endpoint
  // name comes from the EndpointModel up the stack. We expose it as a
  // signal for consumers that already have a KubeEndpointDataService
  // handle but no EndpointDataService.
  private readonly _clusterName = signal<string>('');
  readonly clusterName: Signal<string> = this._clusterName.asReadonly();

  constructor(
    private readonly http: HttpClient,
    readonly kubeGuid: string,
  ) {
    this._clusterName.set(kubeGuid);
  }

  // load() fetches the cluster-scoped state in parallel: version, nodes
  // (count only, full list lives in KubeNodeDataService), and the
  // namespace list. Each leg is independently catchable so a 403 on
  // /version doesn't kill the namespace fetch.
  load(): Observable<void> {
    if (this._isLoading()) {
      // Already loading — return the in-flight loaded$ stream so the
      // caller resolves on the same completion.
      return new Observable<void>(sub => {
        const inner = this.loaded$.subscribe(() => { sub.next(); sub.complete(); });
        return () => inner.unsubscribe();
      });
    }
    this._isLoading.set(true);
    this._errors.set([]);
    this._unavailable.set([]);

    const headers = new HttpHeaders({ 'x-cap-cnsi-list': this.kubeGuid });

    const versionReq = this.http.get<{ [cnsi: string]: KubeVersionInfo }>(
      '/pp/v1/proxy/version',
      { headers },
    ).pipe(
      tap(resp => {
        const info = resp?.[this.kubeGuid];
        const v = info?.gitVersion ?? this.composeVersion(info);
        this._kubeVersion.set(v || null);
      }),
      catchError((err: HttpErrorResponse | unknown) => {
        this.markUnavailable('kubeVersion', err, 'kube-version');
        return of(null);
      }),
      map(() => undefined as void),
    );

    const namespacesReq = this.http.get<{ [cnsi: string]: KubeListResponse<KubeNamespace> }>(
      `/pp/v1/proxy/api/v1/namespaces?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
      { headers },
    ).pipe(
      tap(resp => {
        const list = resp?.[this.kubeGuid];
        const items = (list?.items ?? []).map(ns => ({
          ...ns,
          kubeGuid: this.kubeGuid,
          metadata: { ...(ns.metadata ?? { name: '' }), kubeId: this.kubeGuid },
        }));
        this._namespaces.set(items);
      }),
      catchError((err: HttpErrorResponse | unknown) => {
        this.markUnavailable('namespaces', err, 'kube-namespaces');
        this._namespaces.set([]);
        return of(null);
      }),
      map(() => undefined as void),
    );

    const nodesReq = this.http.get<{ [cnsi: string]: KubeListResponse<unknown> }>(
      `/pp/v1/proxy/api/v1/nodes?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
      { headers },
    ).pipe(
      tap(resp => {
        const list = resp?.[this.kubeGuid];
        this._nodeCount.set(list?.items?.length ?? 0);
      }),
      catchError((err: HttpErrorResponse | unknown) => {
        this.markUnavailable('nodeCount', err, 'kube-nodes');
        this._nodeCount.set(0);
        return of(null);
      }),
      map(() => undefined as void),
    );

    // Sequence: kick off the three legs as Promises so we can finalize
    // once they all settle without falling into rxjs `merge` complete-
    // semantics edge cases.
    const all = Promise.all([
      firstValueFrom(versionReq),
      firstValueFrom(namespacesReq),
      firstValueFrom(nodesReq),
    ]);

    return new Observable<void>(sub => {
      all.then(() => {
        this._isLoading.set(false);
        this._lastFetched.set(new Date());
        this.loaded$.next();
        sub.next();
        sub.complete();
      }).catch((err) => {
        // Defensive — individual legs swallow errors via catchError, so
        // landing here means something synchronous threw. Surface it as
        // a single envelope error and finalize.
        this.addError({
          scope: 'envelope',
          code: 'FETCH_ERROR',
          title: 'kube-load',
          detail: err instanceof Error ? err.message : String(err),
        });
        this._isLoading.set(false);
        this._lastFetched.set(new Date());
        this.loaded$.next();
        sub.next();
        sub.complete();
      });
    }).pipe(finalize(() => undefined));
  }

  // refresh() re-runs load() (or a scoped subset). For wave-1 we only
  // need the full reload; per-scope refresh lands with the wave-2
  // domain services that own each slice.
  async refresh(scope?: 'all' | 'namespaces' | 'version'): Promise<void> {
    if (scope === 'version') {
      const headers = new HttpHeaders({ 'x-cap-cnsi-list': this.kubeGuid });
      try {
        const resp = await firstValueFrom(this.http.get<{ [cnsi: string]: KubeVersionInfo }>(
          '/pp/v1/proxy/version',
          { headers },
        ));
        const info = resp?.[this.kubeGuid];
        this._kubeVersion.set(info?.gitVersion ?? this.composeVersion(info) ?? null);
        this.clearUnavailable('kubeVersion');
      } catch (err) {
        this.markUnavailable('kubeVersion', err, 'kube-version');
      }
      return;
    }
    if (scope === 'namespaces') {
      const headers = new HttpHeaders({ 'x-cap-cnsi-list': this.kubeGuid });
      try {
        const resp = await firstValueFrom(this.http.get<{ [cnsi: string]: KubeListResponse<KubeNamespace> }>(
          `/pp/v1/proxy/api/v1/namespaces?limit=${KUBE_LIST_DEFAULT_LIMIT}`,
          { headers },
        ));
        const list = resp?.[this.kubeGuid];
        const items = (list?.items ?? []).map(ns => ({
          ...ns,
          kubeGuid: this.kubeGuid,
          metadata: { ...(ns.metadata ?? { name: '' }), kubeId: this.kubeGuid },
        }));
        this._namespaces.set(items);
        this.clearUnavailable('namespaces');
      } catch (err) {
        this.markUnavailable('namespaces', err, 'kube-namespaces');
      }
      return;
    }
    // Default 'all' — invalidate timestamp so load() doesn't short-
    // circuit, then re-run.
    this.invalidate();
    await firstValueFrom(this.load());
  }

  invalidate(): void {
    this._lastFetched.set(null);
  }

  currentData(): KubeEndpointData {
    return {
      kubeGuid: this.kubeGuid,
      kubeVersion: this._kubeVersion(),
      nodeCount: this._nodeCount(),
      namespaceCount: this._namespaces().length,
      namespaces: this._namespaces(),
      errors: this._errors(),
    };
  }

  private composeVersion(info?: KubeVersionInfo): string | null {
    if (!info) return null;
    if (info.major && info.minor) return `${info.major}.${info.minor}`;
    return null;
  }

  private addError(err: StratosError): void {
    this._errors.update(curr => [...curr, err].slice(0, 50));
  }

  private markUnavailable(field: string, err: unknown, title: string): void {
    this._unavailable.update(curr => curr.includes(field) ? curr : [...curr, field]);
    const status = (err as HttpErrorResponse)?.status;
    const code: StratosError['code'] =
      status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
    this.addError({
      scope: 'envelope',
      code,
      title,
      detail: (err as Error)?.message ?? String(err),
      affected: [field],
    });
  }

  private clearUnavailable(field: string): void {
    this._unavailable.update(curr => curr.filter(f => f !== field));
    this._errors.update(curr => curr.filter(e => !(e.affected ?? []).includes(field)));
  }
}
