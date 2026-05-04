import { Injectable, computed, effect, inject, signal, Signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AppDetailPrefs } from './app-detail-prefs.service';
import { AppLifecycleStateService } from './app-lifecycle-state.service';
import { ApplicationStateService, ApplicationStateData } from '../../shared/services/application-state.service';
import { IApp, IAppSummary, IDomain, IOrganization, ISpace } from '../../cf-api.types';
import { APIResource } from '@stratosui/store';
import { EnvVarStratosProject } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import {
  StAppDetail,
  StAppRoutesResponse,
  StAppStat,
  StEnvVars,
  StRoute,
  StratosError,
} from '../../services/endpoint-data/stratos-types';
import { stToLegacy } from '../../services/v3-to-legacy-adapter';

export type EntityKind = 'app' | 'stats' | 'envVars' | 'space' | 'org' | 'domains' | 'routes';

interface StAppStatsResponse {
  instances: StAppStat[];
}

/**
 * AppDetailDataService — component-scoped page data source for the app detail page.
 *
 * Stratos data model is the canonical wire contract. The primary signals
 * here are V3-shaped (`StAppDetail`, `StEnvVars`, `StAppStat[]`)
 * sourced from Jetstream-native handlers (`/pp/v1/cf/apps/{cnsi}/{guid}` etc.).
 * Legacy v2-shape views (`app()`, `summary()`) are exposed as computed
 * signals via the `stToLegacy` adapter so unmigrated cards/tabs keep
 * reading their familiar shape during the migration.
 *
 * Space / org / domains stay v2-shaped for now — those are addressed in
 * a later slice when the org/space detail pages migrate.
 *
 * Provide at application-base.component so signals are torn down when the
 * user navigates away from the app detail page. DO NOT add `providedIn:'root'`.
 */
@Injectable()
export class AppDetailDataService {
  private readonly http = inject(HttpClient);
  private readonly prefs = inject(AppDetailPrefs);
  private readonly lifecycle = inject(AppLifecycleStateService);
  private readonly appStateService = inject(ApplicationStateService);

  cnsiGuid!: string;
  appGuid!: string;

  // ---------------------------------------------------------------------------
  // Primary signal sources — V3-shaped, writable inside the service.
  // ---------------------------------------------------------------------------
  private readonly _appDetail = signal<StAppDetail | undefined>(undefined);
  private readonly _envVars = signal<StEnvVars | undefined>(undefined);
  private readonly _stats = signal<StAppStat[]>([]);

  // Space / org / domains stay V2-shaped — out of scope for slice 1 commit 4.
  // These switch to V3 native handlers when the org/space detail pages migrate.
  private readonly _space = signal<APIResource<ISpace> | undefined>(undefined);
  private readonly _org = signal<APIResource<IOrganization> | undefined>(undefined);
  private readonly _domains = signal<IDomain[]>([]);

  // Per-app routes — V3-shaped via the native handler. Null until first load
  // so consumers can distinguish "haven't fetched yet" from "fetched, empty".
  private readonly _routes = signal<StRoute[] | null>(null);

  private readonly _loading = signal<Record<EntityKind, boolean>>({
    app: false, stats: false, envVars: false,
    space: false, org: false, domains: false, routes: false,
  });
  private readonly _errors = signal<Record<EntityKind, StratosError | null>>({
    app: null, stats: null, envVars: null,
    space: null, org: null, domains: null, routes: null,
  });

  // lastPolledAt — consumed by card-app-status "updating…" threshold.
  private readonly _lastPolledAt = signal<Date | null>(null);

  /**
   * Focus-priority set — consumers that are actively viewing a kind raise
   * its priority via `raiseFocusPriority(kind)` to opt that kind into a
   * faster continuous poll cadence (5s) for as long as the consumer is
   * alive. The slice-1 settling-poll cadence (`_pollEffect` below) is
   * unchanged; focus priority is purely additive.
   *
   * Currently only `stats` honours focus priority — that's the slice-2
   * Instances tab use case. Other kinds can opt in by extending the
   * `_focusPollEffect` switch when their consumers need it.
   *
   * Multiple consumers can hold focus on the same kind concurrently;
   * `_focusRefCount` tracks how many holders each kind has so the public
   * `_focusPriority` set keeps the kind for as long as ANY holder is alive.
   */
  private readonly _focusPriority = signal<Set<EntityKind>>(new Set());
  private readonly _focusRefCount = new Map<EntityKind, number>();

  // ---------------------------------------------------------------------------
  // Public readonly views
  // ---------------------------------------------------------------------------

  /** Stratos-shape composed app detail. Primary V3 signal — Task F templates read this directly. */
  readonly appDetail: Signal<StAppDetail | undefined> = this._appDetail.asReadonly();

  /** V3-shape env vars envelope. */
  readonly envVars: Signal<StEnvVars | undefined> = this._envVars.asReadonly();

  /** Trimmed V3 stats — one row per running instance with `{ index, state }`. */
  readonly stats: Signal<StAppStat[]> = this._stats.asReadonly();

  readonly space: Signal<APIResource<ISpace> | undefined> = this._space.asReadonly();
  readonly org: Signal<APIResource<IOrganization> | undefined> = this._org.asReadonly();
  readonly domains: Signal<IDomain[]> = this._domains.asReadonly();
  readonly loading: Signal<Record<EntityKind, boolean>> = this._loading.asReadonly();
  readonly errors: Signal<Record<EntityKind, StratosError | null>> = this._errors.asReadonly();
  readonly lastPolledAt: Signal<Date | null> = this._lastPolledAt.asReadonly();

  /**
   * Per-app routes signal. Null until the first fetch resolves so the
   * Routes tab can render a "loading" affordance distinct from "no routes".
   * Mutations land via `removeRoute(guid)` — single-CNSI, in-memory cache
   * eviction called from `AppRouteActionsService` on verb success (slice 3).
   */
  readonly routes: Signal<StRoute[] | null> = this._routes.asReadonly();
  readonly routesLoading: Signal<boolean> = computed(() => this._loading().routes);
  readonly routesError: Signal<unknown | null> = computed(() => this._errors().routes);

  /**
   * Legacy `APIResource<IApp>` view computed via the V3→legacy adapter.
   * Exists so unmigrated cards/components reading `dataService.app()` keep
   * working. Each consumer's migration to read `appDetail()` directly
   * shrinks this view's audience; once there are no consumers, this
   * accessor and the adapter entry can be removed together.
   */
  readonly app: Signal<APIResource<IApp> | undefined> = computed(() =>
    stToLegacy.appDetail(this._appDetail()) ?? undefined,
  );

  /**
   * Legacy `IAppSummary` view computed via the adapter. Slice 1 doesn't
   * fetch a separate /summary endpoint — the StAppDetail composed envelope
   * already carries every Summary-tab field, and the adapter manufactures
   * the legacy shape on demand for the facade.
   */
  readonly summary: Signal<IAppSummary | undefined> = computed(() =>
    stToLegacy.appSummary(this._appDetail()) ?? undefined,
  );

  // ---------------------------------------------------------------------------
  // Derived computed signals
  // ---------------------------------------------------------------------------

  /** True when the app's state is STARTED. */
  readonly running = computed(() => this._appDetail()?.app.state === 'STARTED');

  /**
   * First route URL from the composed StAppDetail, prepended with the
   * `https://` scheme so consumers (action-bar Visit button) can use it
   * directly as an `<a href>`. CF v3's rendered route URL is bare
   * (`host.domain[/path]` or `domain:port` for TCP) — without a scheme
   * the browser treats the value as a relative path and navigates back
   * to Stratos. The list-shape `StAppRoute` doesn't carry a port, so we
   * can't reliably filter TCP from HTTP here; if the URL already has a
   * scheme we leave it alone, otherwise we assume HTTPS (modern CF
   * deployments serve HTTP routes over TLS). Slice 2's StRoute carries
   * port; if a future template needs the TCP filter back, that's the
   * shape to read from.
   */
  readonly url = computed((): string | null => {
    const routes = this._appDetail()?.app.routes ?? [];
    const raw = routes[0]?.url;
    if (!raw) {
      return null;
    }
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  });

  /**
   * Stratos deploy-source metadata extracted from VCAP env vars.
   * Null if the app was not deployed via Stratos or env vars are not loaded.
   * V3 env vars come through with mixed-typed values; STRATOS_PROJECT is
   * stored as a JSON-encoded string by the deploy step, so we parse on
   * read. Tolerates the field already arriving as an object (e.g. if a
   * future deploy step writes it pre-parsed).
   */
  readonly stratosProject = computed((): EnvVarStratosProject | null => {
    const env = this._envVars();
    if (!env) {
      return null;
    }
    const raw = env.environment?.STRATOS_PROJECT ?? null;
    if (!raw) {
      return null;
    }
    if (typeof raw === 'object') {
      return raw as EnvVarStratosProject;
    }
    try {
      return JSON.parse(String(raw)) as EnvVarStratosProject;
    } catch {
      return null;
    }
  });

  /**
   * Application state metadata derived from app entity + instance stats.
   * The legacy `ApplicationStateService.get()` is V2-shape native, so we
   * convert via the adapter. When ApplicationStateService migrates to V3,
   * this collapses into a direct read.
   */
  readonly state = computed((): ApplicationStateData => {
    const detail = this._appDetail();
    const legacyApp = detail ? stToLegacy.appDetail(detail)?.entity ?? null : null;
    const stats = this._stats();
    const legacyStats = stats.length
      ? stToLegacy.appStats(stats, this.cnsiGuid, this.appGuid)
      : null;
    return this.appStateService.get(legacyApp, legacyStats);
  });

  /** True when any entity fetch is in progress. */
  readonly fetching = computed(() => Object.values(this._loading()).some(v => v));

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  initialize(cnsi: string, appGuid: string): void {
    this.cnsiGuid = cnsi;
    this.appGuid = appGuid;
    void this.refresh('all');
  }

  // ---------------------------------------------------------------------------
  // Focus priority
  // ---------------------------------------------------------------------------

  /**
   * Raise the focus priority for `kind`, opting it into a 5s continuous
   * poll while the returned callback is held. Multiple consumers can raise
   * the same kind concurrently — the focus is held as long as at least one
   * consumer hasn't unsubscribed. The returned callback is idempotent;
   * calling it twice is a no-op.
   */
  raiseFocusPriority(kind: EntityKind): () => void {
    const next = (this._focusRefCount.get(kind) ?? 0) + 1;
    this._focusRefCount.set(kind, next);
    if (next === 1) {
      this._focusPriority.update(s => {
        const n = new Set(s);
        n.add(kind);
        return n;
      });
    }
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      const cur = this._focusRefCount.get(kind) ?? 0;
      if (cur <= 1) {
        this._focusRefCount.delete(kind);
        this._focusPriority.update(s => {
          const n = new Set(s);
          n.delete(kind);
          return n;
        });
      } else {
        this._focusRefCount.set(kind, cur - 1);
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  /**
   * Fetch one or all entity kinds.
   *
   * scope === 'all':
   *   Phase 1a (parallel): app + envVars
   *   Phase 1b (conditional): stats — only when state is STARTED to avoid
   *     a noisy 400 from CF's CF-AppStoppedStatsError on stopped apps.
   *   Phase 2 (sequential): space (needs app.spaceGuid), then org (needs
   *     space.organization_guid), then domains (needs org.guid).
   */
  async refresh(scope: EntityKind | 'all' = 'all'): Promise<void> {
    if (scope === 'all') {
      await Promise.all([
        this.fetchAppDetail(),
        this.fetchEnvVars(),
      ]);

      if (this.shouldFetchStats()) {
        await this.fetchStats();
      } else {
        this._stats.set([]);
      }

      await this.fetchSpace();
      await this.fetchOrg();
      await this.fetchDomains();
    } else {
      const fetchers: Record<EntityKind, () => Promise<void>> = {
        app:     () => this.fetchAppDetail(),
        stats:   () => this.shouldFetchStats() ? this.fetchStats() : (this._stats.set([]), Promise.resolve()),
        envVars: () => this.fetchEnvVars(),
        space:   () => this.fetchSpace(),
        org:     () => this.fetchOrg(),
        domains: () => this.fetchDomains(),
        routes:  () => this.fetchRoutes(),
      };
      await fetchers[scope]();
    }

    this._lastPolledAt.set(new Date());
  }

  // ---------------------------------------------------------------------------
  // URL helpers
  //
  // App detail / env / stats now hit Jetstream native handlers — the cnsi
  // is in the path, no x-cap-passthrough header needed. Space / org /
  // domains still hit the V2 proxy until those pages migrate (slice 2+).
  // ---------------------------------------------------------------------------

  private nativeAppDetailUrl(): string {
    return `/pp/v1/cf/apps/${this.cnsiGuid}/${this.appGuid}?return=details`;
  }

  private nativeAppEnvUrl(): string {
    return `/pp/v1/cf/apps/${this.cnsiGuid}/${this.appGuid}/env`;
  }

  private nativeAppStatsUrl(): string {
    return `/pp/v1/cf/app-stats/${this.cnsiGuid}/${this.appGuid}`;
  }

  private nativeAppRoutesUrl(): string {
    return `/pp/v1/cf/apps/${this.cnsiGuid}/${this.appGuid}/routes`;
  }

  private spaceUrl(spaceGuid: string): string {
    return `/pp/v1/proxy/v2/spaces/${spaceGuid}`;
  }

  private orgUrl(orgGuid: string): string {
    return `/pp/v1/proxy/v2/organizations/${orgGuid}`;
  }

  private orgDomainsUrl(orgGuid: string): string {
    return `/pp/v1/proxy/v2/organizations/${orgGuid}/domains`;
  }

  /**
   * Headers required by the V2 proxy paths (space / org / domains). Native
   * handlers don't need these — cnsi is in the path and the response is
   * the raw shape, no envelope.
   */
  private v2ProxyHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'x-cap-cnsi-list': this.cnsiGuid,
        'x-cap-passthrough': 'true',
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // Fetch helpers
  // ---------------------------------------------------------------------------

  private async fetchAppDetail(): Promise<void> {
    this._loading.update(m => ({ ...m, app: true }));
    this._errors.update(m => ({ ...m, app: null }));
    const t0 = performance.now();
    const url = this.nativeAppDetailUrl();
    try {
      const value = await firstValueFrom(this.http.get<StAppDetail>(url));
      this._appDetail.set(value);
      this.debugTrace('app', url, 'ok', performance.now() - t0);
    } catch (err: unknown) {
      this._errors.update(m => ({ ...m, app: this.toStratosError('app', err) }));
      this.debugTrace('app', url, 'err', performance.now() - t0, err);
    } finally {
      this._loading.update(m => ({ ...m, app: false }));
    }
  }

  private async fetchEnvVars(): Promise<void> {
    this._loading.update(m => ({ ...m, envVars: true }));
    this._errors.update(m => ({ ...m, envVars: null }));
    const t0 = performance.now();
    const url = this.nativeAppEnvUrl();
    try {
      const value = await firstValueFrom(this.http.get<StEnvVars>(url));
      this._envVars.set(value);
      this.debugTrace('envVars', url, 'ok', performance.now() - t0);
    } catch (err: unknown) {
      this._errors.update(m => ({ ...m, envVars: this.toStratosError('envVars', err) }));
      this.debugTrace('envVars', url, 'err', performance.now() - t0, err);
    } finally {
      this._loading.update(m => ({ ...m, envVars: false }));
    }
  }

  /**
   * Fetch /cf/app-stats/{cnsi}/{appGuid}. The native handler returns
   * `{ instances: [{ index, state }] }` — extract the array. Apps in
   * states that don't support stats (STOPPED, etc.) are filtered out
   * before the request via shouldFetchStats(); a residual 4xx still
   * lands here harmlessly because the handler swallows that case
   * server-side.
   */
  private async fetchStats(): Promise<void> {
    this._loading.update(m => ({ ...m, stats: true }));
    this._errors.update(m => ({ ...m, stats: null }));
    const t0 = performance.now();
    const url = this.nativeAppStatsUrl();
    try {
      const raw = await firstValueFrom(this.http.get<StAppStatsResponse>(url));
      this._stats.set(raw?.instances ?? []);
      this.debugTrace('stats', url, 'ok', performance.now() - t0);
    } catch (err: unknown) {
      this._stats.set([]);
      if (!this.isStoppedAppError(err)) {
        this._errors.update(m => ({ ...m, stats: this.toStratosError('stats', err) }));
      }
      this.debugTrace('stats', url, 'err', performance.now() - t0, err);
    } finally {
      this._loading.update(m => ({ ...m, stats: false }));
    }
  }

  /**
   * Diagnostic trace. Gated on localStorage.stratosDebug to keep the
   * production console clean.
   */
  private debugTrace(kind: EntityKind, url: string, outcome: 'ok' | 'err', ms: number, err?: unknown): void {
    try {
      if (typeof localStorage === 'undefined' || !localStorage.getItem('stratosDebug')) {
        return;
      }
      // eslint-disable-next-line no-console
      console.debug('[AppDetailData]', kind, outcome, `${ms.toFixed(0)}ms`, url, err ?? '');
    } catch {
      // localStorage may throw in private-mode browsers; ignore.
    }
  }

  private async fetchSpace(): Promise<void> {
    const spaceGuid = this._appDetail()?.app.spaceGuid;
    if (!spaceGuid) {
      return;
    }
    this._loading.update(m => ({ ...m, space: true }));
    this._errors.update(m => ({ ...m, space: null }));
    try {
      const value = await firstValueFrom(
        this.http.get<APIResource<ISpace>>(this.spaceUrl(spaceGuid), this.v2ProxyHeaders())
      );
      this._space.set(value);
    } catch (err: unknown) {
      this._errors.update(m => ({ ...m, space: this.toStratosError('space', err) }));
    } finally {
      this._loading.update(m => ({ ...m, space: false }));
    }
  }

  private async fetchOrg(): Promise<void> {
    const orgGuid = this._space()?.entity?.organization_guid;
    if (!orgGuid) {
      return;
    }
    this._loading.update(m => ({ ...m, org: true }));
    this._errors.update(m => ({ ...m, org: null }));
    try {
      const value = await firstValueFrom(
        this.http.get<APIResource<IOrganization>>(this.orgUrl(orgGuid), this.v2ProxyHeaders())
      );
      this._org.set(value);
    } catch (err: unknown) {
      this._errors.update(m => ({ ...m, org: this.toStratosError('org', err) }));
    } finally {
      this._loading.update(m => ({ ...m, org: false }));
    }
  }

  private async fetchRoutes(): Promise<void> {
    this._loading.update(m => ({ ...m, routes: true }));
    this._errors.update(m => ({ ...m, routes: null }));
    const t0 = performance.now();
    const url = this.nativeAppRoutesUrl();
    try {
      const value = await firstValueFrom(this.http.get<StAppRoutesResponse>(url));
      this._routes.set(value?.resources ?? []);
      this.debugTrace('routes', url, 'ok', performance.now() - t0);
    } catch (err: unknown) {
      this._errors.update(m => ({ ...m, routes: this.toStratosError('routes', err) }));
      this.debugTrace('routes', url, 'err', performance.now() - t0, err);
    } finally {
      this._loading.update(m => ({ ...m, routes: false }));
    }
  }

  /**
   * Remove a route from the local cache without re-fetching. Called from
   * `AppRouteActionsService` after a successful unmap or delete so the
   * Routes tab updates synchronously. Idempotent: removing an absent guid
   * is a no-op (no signal tick) so concurrent verbs don't double-emit.
   */
  removeRoute(guid: string): void {
    const current = this._routes();
    if (!current) {
      return;
    }
    const next = current.filter(r => r.guid !== guid);
    if (next.length === current.length) {
      return;
    }
    this._routes.set(next);
  }

  /**
   * Append a freshly-attached route to the local cache without re-fetching.
   * Called from `AppRouteActionsService` after a successful attach or
   * create-and-attach. Mutates BOTH route signals so each consumer view
   * updates synchronously:
   *
   *   - `_routes` — drives the per-app Routes tab list (slice 3 read path)
   *   - `_appDetail.app.routes` — drives the build-tab Routes count
   *     metadata-item (consumer-audit row)
   *
   * Mutating only one would leave the other view stale until the next
   * full refresh. Idempotent on guid match per signal (no signal tick when
   * the route is already present). Each signal updates independently so
   * a partial pre-existing state (route in one signal but not the other)
   * still converges. No-op on `_appDetail.app.routes` when `_appDetail()`
   * is null; no-op on `_routes` when `_routes()` is null.
   */
  addRoute(route: StRoute): void {
    this._appDetail.update(detail => {
      if (!detail) {
        return detail;
      }
      const existing = detail.app.routes ?? [];
      if (existing.some(r => r.guid === route.guid)) {
        return detail;
      }
      return { ...detail, app: { ...detail.app, routes: [...existing, route] } };
    });
    const currentRoutes = this._routes();
    if (currentRoutes && !currentRoutes.some(r => r.guid === route.guid)) {
      this._routes.set([...currentRoutes, route]);
    }
  }

  private async fetchDomains(): Promise<void> {
    const orgGuid = this._org()?.metadata?.guid;
    if (!orgGuid) {
      return;
    }
    this._loading.update(m => ({ ...m, domains: true }));
    this._errors.update(m => ({ ...m, domains: null }));
    try {
      const result = await firstValueFrom(
        this.http.get<{ resources: IDomain[] }>(this.orgDomainsUrl(orgGuid), this.v2ProxyHeaders())
      );
      this._domains.set(result?.resources ?? []);
    } catch (err: unknown) {
      this._errors.update(m => ({ ...m, domains: this.toStratosError('domains', err) }));
    } finally {
      this._loading.update(m => ({ ...m, domains: false }));
    }
  }

  // ---------------------------------------------------------------------------
  // Background polling effect
  // ---------------------------------------------------------------------------

  private readonly _pollEffect = effect((onCleanup) => {
    if (!this.prefs.enabled()) {
      return;
    }
    const seconds = this.lifecycle.inFlight()
      ? this.prefs.activeSeconds()
      : this.prefs.idleSeconds();
    if (seconds <= 0) {
      return;
    }

    const id = setInterval(() => {
      if (this.fetching()) {
        return; // skip-if-still-fetching guard
      }
      void this.refresh('all');
    }, seconds * 1000);

    onCleanup(() => clearInterval(id));
  });

  /**
   * Focus-driven continuous poll for `stats`. Runs at 5s while at least one
   * consumer has raised focus priority on `stats` (the slice-2 Instances
   * tab is the first such consumer). Independent of `_pollEffect` and
   * `prefs.enabled()` — focus means a consumer is actively watching, so we
   * keep the data fresh regardless of the user's auto-refresh preference.
   *
   * The slice-1 settling cadence and this focus poll de-dup naturally via
   * the `_loading.stats` guard inside `fetchStats()` (concurrent in-flight
   * is suppressed by `refresh('stats')` flow).
   */
  private readonly _focusStatsPollEffect = effect((onCleanup) => {
    if (!this._focusPriority().has('stats')) {
      return;
    }
    const id = setInterval(() => {
      if (this.fetching()) {
        return; // skip-if-still-fetching guard
      }
      void this.refresh('stats');
    }, 5000);
    onCleanup(() => clearInterval(id));
  });

  // ---------------------------------------------------------------------------
  // Error helpers
  // ---------------------------------------------------------------------------

  private toStratosError(kind: EntityKind, err: unknown): StratosError {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      scope: 'envelope',
      code: 'FETCH_ERROR',
      title: `Failed to load ${kind}`,
      detail,
    };
  }

  private shouldFetchStats(): boolean {
    const state = this._appDetail()?.app.state;
    if (!state) return true;
    return state === 'STARTED';
  }

  private isStoppedAppError(err: unknown): boolean {
    if (err && typeof err === 'object') {
      const status = (err as any)?.status;
      const message = (err as any)?.error?.description ?? (err as any)?.message ?? '';
      return status === 400 && String(message).toLowerCase().includes('started');
    }
    return false;
  }
}
