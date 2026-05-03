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
  StAppStat,
  StEnvVars,
  StratosError,
} from '../../services/endpoint-data/stratos-types';
import { stToLegacy } from '../../services/v3-to-legacy-adapter';

export type EntityKind = 'app' | 'stats' | 'envVars' | 'space' | 'org' | 'domains';

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

  private readonly _loading = signal<Record<EntityKind, boolean>>({
    app: false, stats: false, envVars: false,
    space: false, org: false, domains: false,
  });
  private readonly _errors = signal<Record<EntityKind, StratosError | null>>({
    app: null, stats: null, envVars: null,
    space: null, org: null, domains: null,
  });

  // lastPolledAt — consumed by card-app-status "updating…" threshold.
  private readonly _lastPolledAt = signal<Date | null>(null);

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
   * First route URL from the composed StAppDetail. The list-shape
   * `StAppRoute` carries the rendered URL (CF composes host + domain
   * server-side) — no per-route port to filter TCP from HTTP, so we
   * return whatever the first route is. If the app has no routes,
   * returns null. Slice 2's StRoute carries port; if a future template
   * needs the TCP filter back, that's the shape to read from.
   */
  readonly url = computed((): string | null => {
    const routes = this._appDetail()?.app.routes ?? [];
    return routes[0]?.url ?? null;
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
