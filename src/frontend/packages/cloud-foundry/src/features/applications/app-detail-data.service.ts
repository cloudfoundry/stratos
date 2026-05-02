import { Injectable, computed, effect, inject, signal, Signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AppDetailPrefs } from './app-detail-prefs.service';
import { AppApplicationActionsService } from '../../shared/services/application-actions.service';
import { ApplicationStateService, ApplicationStateData } from '../../shared/services/application-state.service';
import { IApp, IAppSummary, IDomain, IOrganization, ISpace } from '../../cf-api.types';
import { APIResource } from '@stratosui/store';
import { AppStat, AppEnvVarsState } from '../../store/types/app-metadata.types';
import { getRoute, isTCPRoute } from './routes/routes.helper';
import { EnvVarStratosProject } from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { StratosError } from '../../services/endpoint-data/stratos-types';

export type EntityKind = 'app' | 'summary' | 'stats' | 'envVars' | 'space' | 'org' | 'domains';

/**
 * AppDetailDataService — component-scoped page data source for the app detail page.
 *
 * Owns one signal per primary entity (app / summary / stats / envVars / space / org / domains).
 * Exposes derived computed signals (running / url / stratosProject / state).
 * Runs a background polling effect that toggles cadence on actions.inFlight().
 *
 * Provide at application-base.component so signals are torn down when the
 * user navigates away from the app detail page. DO NOT add `providedIn:'root'`.
 */
@Injectable()
export class AppDetailDataService {
  private readonly http = inject(HttpClient);
  private readonly prefs = inject(AppDetailPrefs);
  private readonly actions = inject(AppApplicationActionsService);
  private readonly appStateService = inject(ApplicationStateService);

  cnsiGuid!: string;
  appGuid!: string;

  // ---------------------------------------------------------------------------
  // Primary signal sources — writable inside the service, readonly outside.
  // ---------------------------------------------------------------------------
  private readonly _app = signal<APIResource<IApp> | undefined>(undefined);
  private readonly _summary = signal<IAppSummary | undefined>(undefined);
  private readonly _stats = signal<AppStat[]>([]);
  private readonly _envVars = signal<AppEnvVarsState | undefined>(undefined);
  private readonly _space = signal<APIResource<ISpace> | undefined>(undefined);
  private readonly _org = signal<APIResource<IOrganization> | undefined>(undefined);
  private readonly _domains = signal<IDomain[]>([]);

  private readonly _loading = signal<Record<EntityKind, boolean>>({
    app: false, summary: false, stats: false, envVars: false,
    space: false, org: false, domains: false,
  });
  private readonly _errors = signal<Record<EntityKind, StratosError | null>>({
    app: null, summary: null, stats: null, envVars: null,
    space: null, org: null, domains: null,
  });

  // lastPolledAt — consumed by card-app-status "updating…" threshold (Task 10).
  private readonly _lastPolledAt = signal<Date | null>(null);

  // ---------------------------------------------------------------------------
  // Public readonly views
  // ---------------------------------------------------------------------------
  readonly app: Signal<APIResource<IApp> | undefined> = this._app.asReadonly();
  readonly summary: Signal<IAppSummary | undefined> = this._summary.asReadonly();
  readonly stats: Signal<AppStat[]> = this._stats.asReadonly();
  readonly envVars: Signal<AppEnvVarsState | undefined> = this._envVars.asReadonly();
  readonly space: Signal<APIResource<ISpace> | undefined> = this._space.asReadonly();
  readonly org: Signal<APIResource<IOrganization> | undefined> = this._org.asReadonly();
  readonly domains: Signal<IDomain[]> = this._domains.asReadonly();
  readonly loading: Signal<Record<EntityKind, boolean>> = this._loading.asReadonly();
  readonly errors: Signal<Record<EntityKind, StratosError | null>> = this._errors.asReadonly();
  readonly lastPolledAt: Signal<Date | null> = this._lastPolledAt.asReadonly();

  // ---------------------------------------------------------------------------
  // Derived computed signals
  // ---------------------------------------------------------------------------

  /** True when the app entity's state is STARTED. */
  readonly running = computed(() => this._app()?.entity?.state === 'STARTED');

  /**
   * First non-TCP route URL from the app summary.
   * Returns null if no routes are available or no non-TCP route exists.
   */
  readonly url = computed((): string | null => {
    const routes = this._summary()?.routes ?? [];
    const nonTcp = routes.filter(r => !isTCPRoute(r.port));
    const r = nonTcp[0];
    if (!r || !r.domain) {
      return null;
    }
    return getRoute(r.port, r.host, r.path, true, false, r.domain.name);
  });

  /**
   * Stratos deploy-source metadata extracted from VCAP_APPLICATION / env vars.
   * Null if the app was not deployed via Stratos or env vars are not loaded yet.
   */
  readonly stratosProject = computed((): EnvVarStratosProject | null => {
    const env = this._envVars();
    if (!env) {
      return null;
    }
    const stratosProjectString = env.environment_json?.STRATOS_PROJECT ?? null;
    if (!stratosProjectString) {
      return null;
    }
    try {
      return JSON.parse(stratosProjectString as string) as EnvVarStratosProject;
    } catch {
      return null;
    }
  });

  /**
   * Application state metadata derived from app entity + instance stats.
   * Drives the status card indicator / label / action set.
   */
  readonly state = computed((): ApplicationStateData => {
    const app = this._app()?.entity ?? null;
    const stats = this._stats();
    return this.appStateService.get(app ?? null, stats?.length ? stats : null);
  });

  /** True when any entity fetch is in progress. */
  readonly fetching = computed(() => Object.values(this._loading()).some(v => v));

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /** Store guids and kick off the initial full fetch. */
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
   * When scope === 'all', uses a three-phase refresh so that relations that
   * depend on previously fetched entities are resolved in the correct order:
   *
   *   Phase 1 (parallel): app, summary, stats, envVars  — independent entities
   *   Phase 2 (sequential): space  — needs app.entity.space_guid
   *   Phase 3 (parallel): org, domains  — both need space.entity.organization_guid
   *
   * When scope is a single EntityKind, that entity is fetched in isolation.
   * This keeps targeted refreshes (e.g. refresh('app')) fast and predictable.
   */
  async refresh(scope: EntityKind | 'all' = 'all'): Promise<void> {
    if (scope === 'all') {
      // Phase 1: independent entities — no relation walks needed
      await Promise.all([
        this.fetchOne('app',     this.appUrl(),           this._app),
        this.fetchOne('summary', this.appUrl('/summary'), this._summary),
        this.fetchStats(),
        this.fetchOne('envVars', this.appUrl('/env'),     this._envVars),
      ]);

      // Phase 2: space — requires app.entity.space_guid to be populated
      await this.fetchSpace();

      // Phase 3: org then domains — domains uses org.metadata.guid which is
      // only available after fetchOrg() completes, so they are sequential.
      await this.fetchOrg();
      await this.fetchDomains();
    } else {
      const fetchers: Record<EntityKind, () => Promise<void>> = {
        app:     () => this.fetchOne('app',     this.appUrl(),           this._app),
        summary: () => this.fetchOne('summary', this.appUrl('/summary'), this._summary),
        stats:   () => this.fetchStats(),
        envVars: () => this.fetchOne('envVars', this.appUrl('/env'),     this._envVars),
        space:   () => this.fetchSpace(),
        org:     () => this.fetchOrg(),
        domains: () => this.fetchDomains(),
      };
      await fetchers[scope]();
    }

    this._lastPolledAt.set(new Date());
  }

  // ---------------------------------------------------------------------------
  // URL + header helpers
  //
  // Single-resource reads go through the Jetstream CAPI v2 proxy
  // (/pp/v1/proxy/v2/...) with the target endpoint identified via the
  // x-cap-cnsi-list header. This matches the wire shape produced by the
  // legacy ngrx actions (GetApplication: `apps/{guid}`, GetAppSummary, etc.)
  // and avoids the gap that single-resource Jetstream native handlers
  // (/pp/v1/cf/apps/{cnsi}/{appGuid}, etc.) don't exist for these reads.
  //
  // V3 native handlers exist only for sub-resources (/routes, /service_bindings,
  // /revisions) and the apps LIST endpoint; single-app, summary, env, stats,
  // space, org, and domains are still v2-proxied. The v3 migration of these
  // is a separate workstream.
  // ---------------------------------------------------------------------------

  private appUrl(suffix = ''): string {
    return `/pp/v1/proxy/v2/apps/${this.appGuid}${suffix}`;
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

  /** CNSI selector header expected by the Jetstream proxy. */
  private cnsiHeaders(): { headers: HttpHeaders } {
    return { headers: new HttpHeaders({ 'x-cap-cnsi-list': this.cnsiGuid }) };
  }

  // ---------------------------------------------------------------------------
  // Fetch helpers
  // ---------------------------------------------------------------------------

  private async fetchOne<T>(
    kind: EntityKind,
    url: string,
    target: WritableSignal<T | undefined>,
  ): Promise<void> {
    this._loading.update(m => ({ ...m, [kind]: true }));
    this._errors.update(m => ({ ...m, [kind]: null }));
    const t0 = performance.now();
    try {
      const value = await firstValueFrom(this.http.get<T>(url, this.cnsiHeaders()));
      target.set(value);
      this.debugTrace(kind, url, 'ok', performance.now() - t0);
    } catch (err: unknown) {
      this._errors.update(m => ({ ...m, [kind]: this.toStratosError(kind, err) }));
      this.debugTrace(kind, url, 'err', performance.now() - t0, err);
    } finally {
      this._loading.update(m => ({ ...m, [kind]: false }));
    }
  }

  /**
   * Diagnostic trace for slice 1 verification. Gated on
   * localStorage.stratosDebug to keep production console clean.
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

  /**
   * Stats come back as an object keyed by instance index, not an array.
   * Normalise to an array so consumers can iterate uniformly.
   */
  private async fetchStats(): Promise<void> {
    this._loading.update(m => ({ ...m, stats: true }));
    this._errors.update(m => ({ ...m, stats: null }));
    try {
      const raw = await firstValueFrom(this.http.get<Record<string, AppStat>>(this.appUrl('/stats'), this.cnsiHeaders()));
      this._stats.set(Object.values(raw ?? {}));
    } catch (err: unknown) {
      // Apps that are STOPPED have no stats; treat as empty rather than error.
      this._stats.set([]);
      if (!this.isStoppedAppError(err)) {
        this._errors.update(m => ({ ...m, stats: this.toStratosError('stats', err) }));
      }
    } finally {
      this._loading.update(m => ({ ...m, stats: false }));
    }
  }

  /**
   * Walk app → space. The app entity must already be populated; if not, skip.
   * This mirrors the relation-walk from application.service.ts but uses HTTP
   * directly instead of the ngrx entity store.
   */
  private async fetchSpace(): Promise<void> {
    const app = this._app()?.entity;
    const spaceGuid = app?.space_guid;
    if (!spaceGuid) {
      // App not loaded yet — nothing to do; refresh('all') will run space
      // after app anyway via Promise.all which fires them concurrently.
      // On isolated refresh('space') calls, we skip silently.
      return;
    }
    await this.fetchOne('space', this.spaceUrl(spaceGuid), this._space);
  }

  /**
   * Walk space → org. The space entity must already be populated; if not, skip.
   */
  private async fetchOrg(): Promise<void> {
    const space = this._space()?.entity;
    const orgGuid = space?.organization_guid;
    if (!orgGuid) {
      return;
    }
    await this.fetchOne('org', this.orgUrl(orgGuid), this._org);
  }

  /**
   * Fetch org domains. Org entity must be loaded; domains are an array
   * returned directly (not APIResource-wrapped at this endpoint).
   */
  private async fetchDomains(): Promise<void> {
    const org = this._org()?.metadata?.guid;
    if (!org) {
      return;
    }
    this._loading.update(m => ({ ...m, domains: true }));
    this._errors.update(m => ({ ...m, domains: null }));
    try {
      const result = await firstValueFrom(
        this.http.get<{ resources: IDomain[] }>(this.orgDomainsUrl(org), this.cnsiHeaders())
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
    const seconds = this.actions.inFlight()
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

  /**
   * CF returns 400 "App must be in the STARTED state" for stats on a
   * stopped app. Treat as benign — clear stats rather than show an error.
   */
  private isStoppedAppError(err: unknown): boolean {
    if (err && typeof err === 'object') {
      const status = (err as any)?.status;
      const message = (err as any)?.error?.description ?? (err as any)?.message ?? '';
      return status === 400 && String(message).toLowerCase().includes('started');
    }
    return false;
  }
}
