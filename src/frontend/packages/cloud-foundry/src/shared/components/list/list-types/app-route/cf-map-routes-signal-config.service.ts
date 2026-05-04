import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ListStateStore, SignalListColumn, SignalListCompoundSegment } from '@stratosui/core';

import { AppDetailDataService } from '../../../../../features/applications/app-detail-data.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StRoute, StRoutesResponse } from '../../../../../services/endpoint-data/stratos-types';
import { AppNameResolverService } from '../../../../services/app-name-resolver.service';

// CfMapRoutesSignalConfigService — single-row radio-select picker config
// for the "Map existing route" stepper inside AddRoutesComponent.
//
// Sibling of (NOT a fork of) CfAppRoutesSignalConfigService (slice 3):
// - Source data: drained from the space's full route catalog rather than
//   from AppDetailDataService.routes() — the picker shows ALL routes the
//   user could attach to this app, not the routes already attached.
// - Leading column is `kind: 'radio'` (single-row select), replacing slice
//   3's trailing `kind: 'actions'` (Unmap/Delete kebab) — there's no per-
//   row action verb on the picker, just selection.
// - `isDisabled` predicate dims rows already attached to the current app,
//   evaluated lazily against `dataService.routes()` at render time so a
//   concurrent attach (slice 3.5 commit #5) flips already-attached rows
//   to disabled without re-draining the picker.
//
// Wire: GET /pp/v1/cf/routes/{cnsi}?space_guids={spaceGuid}. Returns
// StRoutesResponse with `appGuids` populated by the backend's
// populateRouteDestinations fan-out, so the Apps Attached column renders
// without any extra per-route hydration. The space_guids passthrough on
// getNativeRouteCount is the minimal backend extension for the picker
// (mirrors getNativeAuditEvents's space-filter passthrough). Until the
// backend lands the filter, the handler falls back to draining all
// routes — the picker still functions, just less scoped.
//
// Tab-scoped: provided in AddRouteStepperComponent.providers (NOT
// providedIn:'root') so its filter/sort state and the selectedKey signal
// reset cleanly when the user navigates away from the stepper.
@Injectable()
export class CfMapRoutesSignalConfigService {
  private readonly dataService = inject(AppDetailDataService);
  private readonly appService = inject(ApplicationService);
  private readonly appNames = inject(AppNameResolverService);
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('cf-map-routes', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    // Default sort mirrors slice 3: most recent route first via
    // metadata.created_at -> StRoute.createdAt.
    sort: [
      { field: 'createdAt', direction: 'desc' },
      { field: 'createdAt', direction: 'desc' },
    ],
  });

  readonly filter: WritableSignal<(r: StRoute) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StRoute>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  // Legacy text filter ("Filter by Route") matches against URL.
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  // Single-row selection state. Holds the GUID of the currently selected
  // route, or null when nothing is selected. Owned by the service so its
  // lifetime matches the picker's tab-scoped instance — when the user
  // navigates away from the stepper the service is destroyed and the
  // selection clears with it. Exposed as readonly to consumers; the
  // signal-list component writes through the radio binding on the column
  // (which uses the same WritableSignal reference internally).
  private readonly _selectedKey: WritableSignal<string | null> = signal(null);
  readonly selectedKey: Signal<string | null> = this._selectedKey.asReadonly();

  // Source signal: per-route rows surfaced by the in-space drain. Set in
  // the constructor where an injection context is available.
  readonly routes!: Signal<StRoute[]>;
  private readonly _routes: WritableSignal<StRoute[]> = signal([]);

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StRoute) => unknown>> = signal(new Map());

  view!: ViewPipeline<StRoute>;

  constructor() {
    (this as { routes: Signal<StRoute[]> }).routes = this._routes.asReadonly();

    this.view = new ViewPipeline<StRoute>(
      this.routes,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      // Filter mirrors legacy "Filter by Route" text affordance: matches
      // against the rendered URL (substring, case-insensitive).
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((r: StRoute) => {
          if (!q) return true;
          return (r.url ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'createdAt', direction: 'desc' });
    this.pageIndex.set(0);
  }

  // Drain the routes within the current app's space. Called by the
  // consumer (AddRouteStepperComponent in commit #5) on stepper mount.
  // Single-page-on-mount strategy per the slice 3.5 design doc: spaces
  // typically hold tens to low-hundreds of routes; pagination defers
  // until a real customer signal arrives.
  //
  // Wire: GET /pp/v1/cf/routes/{cnsi}?space_guids={spaceGuid}. The
  // backend's getNativeRouteCount returns StRoute[] with `appGuids`
  // populated via populateRouteDestinations, so the Apps Attached column
  // renders without an extra fan-out. spaceGuid is read from the
  // app-detail signal because picker scope = app's own space (V3 rejects
  // cross-space attach).
  async refresh(): Promise<void> {
    const cnsi = this.dataService.cnsiGuid;
    const spaceGuid = this.dataService.appDetail()?.app.spaceGuid;
    if (!cnsi || !spaceGuid) {
      // Pre-app-detail load: nothing to drain yet. Consumer will retry
      // once appDetail() resolves.
      return;
    }
    const url = `/pp/v1/cf/routes/${cnsi}?space_guids=${encodeURIComponent(spaceGuid)}`;
    const response = await firstValueFrom(this.http.get<StRoutesResponse>(url));
    this._routes.set(response?.resources ?? []);
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StRoute) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Build the column set for the route picker. Mirrors slice 3's
  // CfAppRoutesSignalConfigService column shape (Host/Domain/Path/Port/
  // Apps Attached) with a leading radio column instead of the trailing
  // actions kebab. The signal-list radio primitive (commit #1) reads the
  // selectedKey WritableSignal and isDisabled predicate from the column's
  // `radio` binding.
  buildColumns(): SignalListColumn<StRoute>[] {
    const columns: SignalListColumn<StRoute>[] = [
      {
        header: '', key: 'radio',
        kind: 'radio',
        radio: {
          // Pass the writable signal directly; signal-list writes the
          // row's GUID into it on click. Service's public surface stays
          // readonly via _selectedKey.asReadonly() above.
          selectedKey: this._selectedKey,
          // Lazy predicate: read the live `dataService.routes()` snapshot
          // at click-time, NOT at picker-load-time. A concurrent attach
          // verb (slice 3.5 commit #5) mutates _appDetail synchronously
          // through dataService.addRoute(); by reading on each call we
          // pick up that mutation without a re-drain.
          isDisabled: (row) => this.isRouteAttachedToCurrentApp(row),
        },
        render: () => '',
        widthHint: '3rem',
      },
      {
        header: 'Host', key: 'host',
        render: (row) => row.host ?? '',
        sortField: 'host',
      },
      {
        header: 'Domain', key: 'domain',
        // Same domain-derive logic as slice 3: parse the CF-rendered URL
        // by stripping host, optional :port, and path. CF guarantees URL
        // = host '.' domain (':' port)? path; if any piece can't be
        // located we fall back to the full URL.
        render: (row) => this.deriveDomain(row),
        sortField: (row) => this.deriveDomain(row),
      },
      {
        header: 'Path', key: 'path',
        render: (row) => row.path ?? '',
        sortField: 'path',
      },
      {
        header: 'Port', key: 'port',
        render: (row) => (row.port ?? 0) > 0 ? String(row.port) : '-',
        sortField: (row) => row.port ?? 0,
      },
      {
        header: 'Apps Attached', key: 'apps',
        kind: 'compound',
        compound: (row) => this.buildAppsCompound(row),
        // Filter/sort string falls back to a count rendering. Compound
        // cells use this for substring filtering and as the last-resort
        // sort key.
        render: (row) => `${(row.appGuids ?? []).length}`,
        sortField: (row) => (row.appGuids ?? []).length,
        maxVisible: 3,
        collapsedLabel: (n) => `…and ${n} more`,
      },
    ];
    return columns;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  // True when the row is already mapped to the app the user is currently
  // viewing — read from `dataService.routes()` (the per-app routes
  // catalog populated by slice 3). The picker can't legally attach an
  // already-attached route, so the radio is disabled. Routes with no
  // appGuids on the picker payload still get evaluated against the
  // per-app catalog (the source of truth).
  private isRouteAttachedToCurrentApp(row: StRoute): boolean {
    const attached = this.dataService.routes() ?? [];
    return attached.some(r => r.guid === row.guid);
  }

  // Parse the domain segment out of the CF-rendered URL.
  // URL shape (per CF): host '.' domain (':' port)? path
  // - HTTP route, no host: URL = domain + path
  // - HTTP route with host: URL = host + '.' + domain + path
  // - TCP route: URL = domain + ':' + port (no host, no path)
  // Best-effort parse — same shape as slice 3's CfAppRoutesSignalConfigService.
  private deriveDomain(row: StRoute): string {
    const url = row.url ?? '';
    if (!url) return '';
    let working = url;
    const path = row.path ?? '';
    if (path && working.endsWith(path)) {
      working = working.slice(0, working.length - path.length);
    }
    const port = row.port ?? 0;
    if (port > 0) {
      const suffix = ':' + String(port);
      if (working.endsWith(suffix)) {
        working = working.slice(0, working.length - suffix.length);
      }
    }
    const host = row.host ?? '';
    if (host && working.startsWith(host + '.')) {
      working = working.slice(host.length + 1);
    }
    return working || url;
  }

  // Build the compound segments for the Apps Attached cell. The picker's
  // drain endpoint populates `appGuids` server-side via
  // populateRouteDestinations, so unlike slice 3 (where the per-app
  // endpoint omits appGuids) we don't need a fallback to the current
  // app's GUID — an empty appGuids array means the route really is
  // attached to no apps.
  private buildAppsCompound(row: StRoute): readonly SignalListCompoundSegment[] {
    const guids = row.appGuids ?? [];
    if (!guids.length) return [];
    const cnsi = row.cnsiGuid || this.appService.cfGuid;
    const names = this.appNames.resolveMany(cnsi, guids)();
    return guids.map(g => ({ text: names.get(g) ?? g }));
  }
}
