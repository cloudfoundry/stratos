import { Injectable, Injector, Resource, ResourceRef, computed, effect, inject, linkedSignal, signal, Signal, untracked, WritableSignal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';

import { AppDetailPrefs } from './app-detail-prefs.service';
import { AppLifecycleStateService } from './app-lifecycle-state.service';
import { ApplicationStateService, ApplicationStateData } from '../../shared/services/application-state.service';
import { IApp, IAppSummary } from '../../cf-api.types';
import { APIResource, extractHttpErrorMessage } from '@stratosui/store';
import { CnsiAppsSource, PatchAppBody } from '../../services/data-sources/cnsi-apps-source';
import { EndpointDataRegistry } from '../../services/endpoint-data/endpoint-data.registry';
import { EnvVarStratosProject } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import {
  StAppDetail,
  StAppRoutesResponse,
  StAppStat,
  StDomain,
  StratosPagedResponse,
  StEnvVars,
  StOrg,
  StRoute,
  StServiceCredentialBinding,
  StServiceCredentialBindingsResponse,
  StSpace,
  StratosError,
} from '../../services/endpoint-data/stratos-types';
import { stToLegacy } from '../../services/v3-to-legacy-adapter';

export type EntityKind = 'app' | 'stats' | 'envVars' | 'space' | 'org' | 'domains' | 'routes' | 'serviceBindings';

interface StAppStatsResponse {
  instances: StAppStat[];
}

/**
 * One per-instance usage sample captured at poll time. Accumulated into a
 * capped ring buffer (`usageHistory`) while a consumer holds stats focus,
 * to feed live trend charts without a Prometheus dependency.
 */
export interface UsagePoint { t: number; cpu: number; mem: number; disk: number; }

/**
 * A route URL usable as an `<a href>`. CF v3 renders route URLs bare
 * (`host.domain[/path]`), which a browser treats as a relative path back to
 * Stratos. A URL that already has a scheme is kept; otherwise HTTPS is
 * assumed (modern CF deployments serve HTTP routes over TLS).
 */
export function routeHref(url: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
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
 * Space / org / domains are sourced from Jetstream native handlers and
 * exposed as Stratos-native shapes (`StSpace`, `StOrg`, `StDomain[]`).
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
  private readonly endpointDataRegistry = inject(EndpointDataRegistry);

  private readonly injector = inject(Injector);

  private readonly _ids = signal({ cnsi: '', app: '' });
  get cnsiGuid(): string { return this._ids().cnsi; }
  set cnsiGuid(cnsi: string) { this._ids.update(i => ({ ...i, cnsi })); }
  get appGuid(): string { return this._ids().app; }
  set appGuid(app: string) { this._ids.update(i => ({ ...i, app })); }

  // All entity fetches hit Jetstream native handlers: cnsi is in the path and
  // responses come back as Stratos-native shapes (no v2 wire, no passthrough
  // header). Each read is an httpResource; a dependent URL (space from
  // app.spaceGuid, org from space.orgGuid, domains from org.guid) is a
  // computed request, so a changed parameter aborts the in-flight request.
  // A kind is requested only once refresh() has asked for it ('all' covers all
  // but routes and serviceBindings, which wait for their own refresh(kind)).
  private readonly _wanted = signal<ReadonlySet<EntityKind>>(new Set());
  private readonly _urls: Partial<Record<EntityKind, string>> = {};
  private want(kind: EntityKind, url: () => string | undefined): () => string | undefined {
    return () => (this._urls[kind] = this._wanted().has(kind) ? url() : undefined);
  }
  private appUrl(path = ''): string | undefined {
    const { cnsi, app } = this._ids();
    return cnsi && app ? `/pp/v1/cf/apps/${cnsi}/${app}${path}` : undefined;
  }

  private readonly appRes = httpResource<StAppDetail>(this.want('app', () => this.appUrl('?return=details')));
  private readonly envRes = httpResource<StEnvVars>(this.want('envVars', () => this.appUrl('/env')));
  // Stats wait for the first app response, and are skipped for a state that
  // has none (STOPPED etc.), avoiding CF's noisy CF-AppStoppedStatsError 400.
  private readonly statsRes = httpResource<StAppStatsResponse>(this.want('stats', () =>
    this.appRes.status() !== 'loading' && this.shouldFetchStats()
      ? `/pp/v1/cf/app-stats/${this.cnsiGuid}/${this.appGuid}` : undefined));
  private readonly spaceRes = httpResource<StSpace>(this.want('space', () => {
    const guid = this._appDetail()?.app.spaceGuid;
    return guid ? `/pp/v1/cf/spaces/${this.cnsiGuid}/${guid}` : undefined;
  }));
  private readonly orgRes = httpResource<StOrg>(this.want('org', () => {
    const guid = this._space()?.orgGuid;
    return guid ? `/pp/v1/cf/org/${this.cnsiGuid}/${guid}` : undefined;
  }));
  private readonly domainsRes = httpResource<StratosPagedResponse<StDomain>>(this.want('domains', () => {
    const guid = this._org()?.guid;
    return guid ? `/pp/v1/cf/org/${this.cnsiGuid}/${guid}/private_domains` : undefined;
  }));
  private readonly routesRes = httpResource<StAppRoutesResponse>(this.want('routes', () => this.appUrl('/routes')));
  // Backend returns ?return=summary so serviceInstance.{name,type} + app.name
  // come back inline via v3's `included` block — one CAPI call.
  private readonly bindingsRes = httpResource<StServiceCredentialBindingsResponse>(
    this.want('serviceBindings', () => this.appUrl('/service_bindings?return=summary')));

  private readonly resources: Record<EntityKind, ResourceRef<unknown>> = {
    app: this.appRes, stats: this.statsRes, envVars: this.envRes, space: this.spaceRes,
    org: this.orgRes, domains: this.domainsRes, routes: this.routesRes, serviceBindings: this.bindingsRes,
  };

  /** The resource's value, kept across a failed reload (value() is unusable in the error state). */
  private latest<T>(res: Resource<T | undefined>): WritableSignal<T | undefined> {
    return linkedSignal<{ v: T | undefined; failed: boolean }, T | undefined>({
      source: () => ({ v: res.hasValue() ? res.value() : undefined, failed: res.status() === 'error' }),
      computation: (src, prev) => src.v ?? (src.failed ? prev?.value : undefined),
    });
  }

  private readonly _appDetail = this.latest(this.appRes);
  private readonly _envVars = this.latest(this.envRes);
  private readonly _space = this.latest(this.spaceRes);
  private readonly _org = this.latest(this.orgRes);
  private readonly _domainsRaw = this.latest(this.domainsRes);
  private readonly _domains = computed(() => this._domainsRaw()?.resources ?? []);
  private readonly _routesRaw = this.latest(this.routesRes);
  private readonly _bindingsRaw = this.latest(this.bindingsRes);

  // Per-app routes — null until first load so consumers can distinguish
  // "haven't fetched yet" from "fetched, empty". Same for service bindings
  // (type=app only).
  private readonly _routes = computed(() => this._routesRaw() ? this._routesRaw()!.resources ?? [] : null);
  private readonly _serviceBindings = computed(() => this._bindingsRaw() ? this._bindingsRaw()!.resources ?? [] : null);

  private readonly _loading = computed(() => this.perKind(res => res.isLoading()));
  // A resource wraps a non-Error rejection (an HttpErrorResponse) with the original as `cause`.
  private readonly _errors = computed(() => this.perKind((res, kind) => {
    const err = (res.error() as { cause?: unknown } | undefined)?.cause ?? res.error();
    return res.status() === 'error' && !(kind === 'stats' && this.isStoppedAppError(err))
      ? this.toStratosError(kind, err) : null;
  }));

  private perKind<T>(fn: (res: Resource<unknown>, kind: EntityKind) => T): Record<EntityKind, T> {
    return Object.fromEntries(
      (Object.keys(this.resources) as EntityKind[]).map(kind => [kind, fn(this.resources[kind], kind)]),
    ) as Record<EntityKind, T>;
  }

  // lastPolledAt — consumed by card-app-status "updating…" threshold.
  private readonly _lastPolledAt = signal<Date | null>(null);

  // _updating — flipped while a PATCH /pp/v1/cf/apps/:cnsi/:guid is in flight.
  // Surfaced via the public `updating` signal; consumed by tabs-base to dim
  // the summary section during edits.
  private readonly _updating = signal<boolean>(false);

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

  /** Cadence (ms) for the focus-driven stats poll. Adjustable from the UI. */
  private readonly _statsPollMs = signal(5000);

  /** Rolling cap (~30 min at 5s) so memory stays flat regardless of session length. */
  private readonly USAGE_HISTORY_CAP = 360;
  /** Per-instance usage samples accumulated while stats focus is raised. */
  private readonly _usageHistory = signal<Map<number, UsagePoint[]>>(new Map());
  /** Timestamp of the last successful stats fetch (drives the accordion "updated" label). */
  private readonly _statsFetchedAt = signal<Date | null>(null);

  // ---------------------------------------------------------------------------
  // Public readonly views
  // ---------------------------------------------------------------------------

  /** Stratos-shape composed app detail. Primary V3 signal — Task F templates read this directly. */
  readonly appDetail: Signal<StAppDetail | undefined> = this._appDetail;

  /** V3-shape env vars envelope. */
  readonly envVars: Signal<StEnvVars | undefined> = this._envVars;

  /** Trimmed V3 stats — one row per running instance with `{ index, state }`. */
  readonly stats: Signal<StAppStat[]> = computed(() => (this.statsRes.hasValue() ? this.statsRes.value()?.instances : undefined) ?? []);

  /** Per-instance usage history ring buffer — feeds live trend charts. Grows
   *  only while stats focus is raised; frozen on accordion collapse. */
  readonly usageHistory: Signal<ReadonlyMap<number, UsagePoint[]>> = this._usageHistory.asReadonly();
  /** Timestamp of the last successful stats fetch — drives "updated Ns ago". */
  readonly statsFetchedAt: Signal<Date | null> = this._statsFetchedAt.asReadonly();

  readonly space: Signal<StSpace | undefined> = this._space;
  readonly org: Signal<StOrg | undefined> = this._org;
  readonly domains: Signal<StDomain[]> = this._domains;
  readonly loading: Signal<Record<EntityKind, boolean>> = this._loading;
  readonly errors: Signal<Record<EntityKind, StratosError | null>> = this._errors;
  readonly lastPolledAt: Signal<Date | null> = this._lastPolledAt.asReadonly();
  readonly updating: Signal<boolean> = this._updating.asReadonly();

  /**
   * Per-app routes signal. Null until the first fetch resolves so the
   * Routes tab can render a "loading" affordance distinct from "no routes".
   * Mutations land via `removeRoute(guid)` — single-CNSI, in-memory cache
   * eviction called from `AppRouteActionsService` on verb success (slice 3).
   */
  readonly routes: Signal<StRoute[] | null> = this._routes;
  readonly routesLoading: Signal<boolean> = computed(() => this._loading().routes);
  readonly routesError: Signal<unknown | null> = computed(() => this._errors().routes);

  /** Per-app service credential bindings. Null = not yet fetched. */
  readonly serviceBindings: Signal<StServiceCredentialBinding[] | null> = this._serviceBindings;
  readonly serviceBindingsLoading: Signal<boolean> = computed(() => this._loading().serviceBindings);
  readonly serviceBindingsError: Signal<unknown | null> = computed(() => this._errors().serviceBindings);
  /** Reactive count of attached service bindings — drives the L5 sub-nav
   *  "Total Services" pill on the app-detail Services tab. Defaults to 0
   *  while the bindings haven't loaded so the cell renders cleanly. */
  readonly serviceBindingsCount: Signal<number> = computed(() => this._serviceBindings()?.length ?? 0);

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
    return raw ? routeHref(raw) : null;
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
    const stats = this.stats();
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
    this._ids.set({ cnsi, app: appGuid });
    // Reset per-app live state so a new app doesn't inherit the prior app's
    // usage samples or stale stats timestamp.
    this._usageHistory.set(new Map());
    this._statsFetchedAt.set(null);
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

  /**
   * Set the focus-driven stats poll cadence (ms). Clamped to >= 1000ms.
   * Non-finite input (NaN/Infinity) falls back to the 5000ms default so a
   * bad value can't leave setInterval running with a misbehaving cadence.
   */
  setStatsPollMs(ms: number): void {
    this._statsPollMs.set(Number.isFinite(ms) ? Math.max(1000, Math.floor(ms)) : 5000);
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
   *     space.orgGuid), then domains (needs org.guid).
   */
  async refresh(scope: EntityKind | 'all' = 'all'): Promise<void> {
    // app + envVars in parallel, then each kind that depends on the one before.
    const phases: EntityKind[][] = scope === 'all'
      ? [['app', 'envVars'], ['stats'], ['space'], ['org'], ['domains']] : [[scope]];
    this._wanted.update(kinds => new Set([...kinds, ...phases.flat()]));
    for (const phase of phases) {
      await Promise.all(phase.map(kind => this.run(this.resources[kind])));
    }

    this._lastPolledAt.set(new Date());
  }

  /**
   * Stratos-shape PATCH on the app. Wraps PATCH /pp/v1/cf/apps/:cnsi/:guid
   * which fans the body's optional fields out to the corresponding CAPI v3
   * sub-calls (name and labels, enable_ssh, scale, env vars). Flips `updating` for the
   * duration; the summary card dims itself off this signal. Refreshes the
   * app entity afterwards so callers don't have to, also when the call
   * rejects: patchApp reports each failed sub-call in _meta.errors while
   * the others still apply, and the rejection carries the CF detail.
   *
   * Body fields are the native PATCH shape: name?, enable_ssh?, memory?,
   * disk_quota?, instances?, environment_json?, labels? (a delta: null
   * removes a key, omitted keys stay).
   */
  async update(body: PatchAppBody): Promise<void> {
    this._updating.set(true);
    try {
      // Route the PATCH through CnsiAppsSource so the canonical
      // EDS._apps row updates immediately + the app.update cascade fires.
      // The local refresh() below still re-fetches the rich detail
      // (stats/env/routes) that the per-app cache doesn't track.
      const eds = this.endpointDataRegistry.acquire(this.cnsiGuid);
      try {
        const source = new CnsiAppsSource(this.cnsiGuid, this.http, eds);
        try {
          await source.update(this.appGuid, body);
        } finally {
          await this.refresh('app');
        }
      } finally {
        this.endpointDataRegistry.release(this.cnsiGuid);
      }
    } finally {
      this._updating.set(false);
    }
  }

  /** Reload a resource and wait until it settles (an idle or already-loading one just settles). */
  private run(res: ResourceRef<unknown>): Promise<void> {
    res.reload();
    return new Promise(resolve => {
      const watcher = effect(() => {
        if (!res.isLoading()) {
          watcher.destroy();
          resolve();
        }
      }, { injector: this.injector });
    });
  }

  // Diagnostic trace per fetch (kind, url, outcome, duration), gated on
  // localStorage.stratosDebug to keep the production console clean.
  private readonly _traces = (Object.keys(this.resources) as EntityKind[]).map(kind => {
    const res = this.resources[kind];
    let t0 = 0;
    return effect(() => {
      const status = res.status();
      if (res.isLoading()) {
        t0 ||= performance.now();
      } else if (t0) {
        this.debugTrace(kind, this._urls[kind] ?? '', status === 'error' ? 'err' : 'ok', performance.now() - t0, res.error());
        t0 = 0;
      }
    });
  });

  private debugTrace(kind: EntityKind, url: string, outcome: 'ok' | 'err', ms: number, err?: unknown): void {
    try {
      if (typeof localStorage === 'undefined' || !localStorage.getItem('stratosDebug')) {
        return;
      }
      console.debug('[AppDetailData]', kind, outcome, `${ms.toFixed(0)}ms`, url, err ?? '');
    } catch {
      // localStorage may throw in private-mode browsers; ignore.
    }
  }

  /** Stamp the fetch time and accumulate a usage sample for each stats response. */
  private readonly _statsEffect = effect(() => {
    const raw = this.statsRes.hasValue() ? this.statsRes.value() : undefined;
    if (raw) {
      untracked(() => {
        this._statsFetchedAt.set(new Date());
        this.appendUsageSample(raw.instances ?? []);
      });
    }
  });

  /**
   * Append one usage point per instance — only while a consumer holds stats
   * focus (accordion open). A collapsed accordion releases focus, so the
   * buffer stops growing and the last samples stay frozen for display. The
   * ring buffer is capped at `USAGE_HISTORY_CAP`, evicting the oldest points
   * so memory stays flat regardless of how long the tab stays open.
   */
  private appendUsageSample(stats: StAppStat[]): void {
    if (!this._focusPriority().has('stats')) {
      return;
    }
    // Client receipt time, not the CF-reported usage.time: gives uniform spacing
    // aligned to the poll cadence and is present even when usage is omitted
    // (e.g. CRASHED instances, where usage.time is absent).
    const t = Date.now();
    this._usageHistory.update(prev => {
      const next = new Map(prev);
      for (const s of stats) {
        const buf = (next.get(s.index) ?? []).concat({
          t, cpu: s.usage?.cpu ?? 0, mem: s.usage?.mem ?? 0, disk: s.usage?.disk ?? 0,
        });
        next.set(s.index, buf.length > this.USAGE_HISTORY_CAP ? buf.slice(-this.USAGE_HISTORY_CAP) : buf);
      }
      return next;
    });
  }

  /**
   * Remove a service binding from the local cache without re-fetching.
   * Called from the unbind action after async-job resolves. Idempotent.
   */
  removeServiceBinding(guid: string): void {
    const current = this._serviceBindings();
    if (!current) {
      return;
    }
    const next = current.filter(b => b.guid !== guid);
    if (next.length === current.length) {
      return;
    }
    this.bindingsRes.set({ ...this._bindingsRaw()!, resources: next });
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
    this.routesRes.set({ ...this._routesRaw()!, resources: next });
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
    const detail = this._appDetail();
    const existing = detail?.app.routes ?? [];
    if (detail && !existing.some(r => r.guid === route.guid)) {
      this.appRes.set({ ...detail, app: { ...detail.app, routes: [...existing, route] } });
    }
    const currentRoutes = this._routes();
    if (currentRoutes && !currentRoutes.some(r => r.guid === route.guid)) {
      this.routesRes.set({ ...this._routesRaw()!, resources: [...currentRoutes, route] });
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
   * Focus-driven continuous poll for `stats`. Runs at `_statsPollMs()`
   * (default 5s, UI-settable via `setStatsPollMs`) while at least one
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
    // Read the cadence signal inside the effect body so a UI change to the
    // poll interval re-arms this effect (clears the old interval via the
    // cleanup below, then schedules a fresh one at the new cadence).
    const ms = this._statsPollMs();
    const id = setInterval(() => {
      if (this.fetching()) {
        return; // skip-if-still-fetching guard
      }
      void this.refresh('stats');
    }, ms);
    onCleanup(() => clearInterval(id));
  });

  // ---------------------------------------------------------------------------
  // Error helpers
  // ---------------------------------------------------------------------------

  private toStratosError(kind: EntityKind, err: unknown): StratosError {
    const detail = extractHttpErrorMessage(err);
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
