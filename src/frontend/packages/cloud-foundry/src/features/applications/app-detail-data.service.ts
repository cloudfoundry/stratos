import { Injectable, computed, effect, inject, signal, Signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
   * Fetch one or all entity kinds. Pass 'all' for a parallel fan-out.
   * Each fetch is independently gated with loading / error signals so a
   * partial failure doesn't block other entities from rendering.
   */
  async refresh(scope: EntityKind | 'all' = 'all'): Promise<void> {
    const fetchers: Record<EntityKind, () => Promise<void>> = {
      app:     () => this.fetchOne('app',     this.appUrl(),               this._app),
      summary: () => this.fetchOne('summary', this.appUrl('/summary'),     this._summary),
      stats:   () => this.fetchStats(),
      envVars: () => this.fetchOne('envVars', this.appUrl('/env'),         this._envVars),
      space:   () => this.fetchSpace(),
      org:     () => this.fetchOrg(),
      domains: () => this.fetchDomains(),
    };

    if (scope === 'all') {
      await Promise.all(Object.values(fetchers).map(f => f()));
    } else {
      await fetchers[scope]();
    }

    this._lastPolledAt.set(new Date());
  }

  // ---------------------------------------------------------------------------
  // URL helpers
  // ---------------------------------------------------------------------------

  private appUrl(suffix = ''): string {
    return `/pp/v1/cf/apps/${this.cnsiGuid}/${this.appGuid}${suffix}`;
  }

  private spaceUrl(spaceGuid: string): string {
    return `/pp/v1/cf/spaces/${this.cnsiGuid}/${spaceGuid}`;
  }

  private orgUrl(orgGuid: string): string {
    return `/pp/v1/cf/organizations/${this.cnsiGuid}/${orgGuid}`;
  }

  private orgDomainsUrl(orgGuid: string): string {
    return `/pp/v1/cf/organizations/${this.cnsiGuid}/${orgGuid}/domains`;
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
    try {
      const value = await firstValueFrom(this.http.get<T>(url));
      target.set(value);
    } catch (err: unknown) {
      this._errors.update(m => ({ ...m, [kind]: this.toStratosError(kind, err) }));
    } finally {
      this._loading.update(m => ({ ...m, [kind]: false }));
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
      const raw = await firstValueFrom(this.http.get<Record<string, AppStat>>(this.appUrl('/stats')));
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
        this.http.get<{ resources: IDomain[] }>(this.orgDomainsUrl(org))
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
