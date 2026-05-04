import { Injectable, Injector, Signal, WritableSignal, effect, inject, runInInjectionContext, signal } from '@angular/core';

import { ListStateStore, SignalListColumn, SignalListCompoundSegment, SignalListRowAction } from '@stratosui/core';

import { AppDetailDataService } from '../../../../../features/applications/app-detail-data.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StRoute } from '../../../../../services/endpoint-data/stratos-types';
import { AppNameResolverService } from '../../../../services/app-name-resolver.service';
import { AppRouteActionsService } from '../../../../services/app-route-actions.service';

// CF App Routes signal-list config — single-app, per-route rows of the
// app-detail Routes tab. Replaces the legacy CfAppRoutesListConfigService
// (ngrx-coupled) with a signal-native configuration that drives the
// signal-list framework.
//
// Source signal is `AppDetailDataService.routes()` — slice-3 commit #2
// already wires the fetch + the `removeRoute(guid)` cache eviction hook
// the consumer (commit #5) calls on verb success. Per-row Unmap and
// Delete invoke AppRouteActionsService verbs; confirmation dialog wiring
// stays in the consuming component to match peer convention (see
// CfAppInstancesSignalConfigService).
//
// Service is tab-scoped (provided in the Routes tab component
// `providers` array, NOT providedIn:'root') so its filter/sort state
// resets cleanly when the user navigates between apps. The tab also
// provides AppRouteActionsService at the same scope.
@Injectable()
export class CfAppRoutesSignalConfigService {
  private readonly dataService = inject(AppDetailDataService);
  private readonly actionsService = inject(AppRouteActionsService);
  private readonly appService = inject(ApplicationService);
  private readonly appNames = inject(AppNameResolverService);
  private readonly injector = inject(Injector);

  private readonly state = inject(ListStateStore).bind('cf-app-routes', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    // Default sort mirrors legacy CfRoutesListConfigBase: most recent
    // route first via metadata.created_at -> StRoute.createdAt.
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

  // Source signal: per-route rows surfaced by AppDetailDataService.
  // dataService.routes is `StRoute[] | null` (null = pre-first-fetch);
  // the view pipeline wants an array, so we mirror through a bridge
  // signal with explicit null-coalesce. Set in the constructor where
  // an injection context is available for the effect.
  readonly routes!: Signal<StRoute[]>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StRoute) => unknown>> = signal(new Map());

  view!: ViewPipeline<StRoute>;

  constructor() {
    const src = this.dataService.routes;
    const bridge = signal<StRoute[]>([]);
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const value = src();
        bridge.set(value ?? []);
      });
    });
    (this as { routes: Signal<StRoute[]> }).routes = bridge.asReadonly();

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

  // Re-fetches routes via the data service. Routes are not on the
  // focus-poll cadence (Routes tab is read-modify, not continuous-read);
  // this exposes a manual refresh hook for the toolbar's refresh button.
  async refresh(): Promise<void> {
    await this.dataService.refresh('routes');
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StRoute) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Build the column set for the Routes tab. Mirrors the legacy
  // per-app shape (host / domain-from-url / path / TCP port / apps-attached)
  // plus a kebab actions column. The legacy `cf-app-routes` variant uses
  // a pre-rendered single "Route" cell — we split it here so users can
  // sort + filter on individual fields without losing the legacy cells.
  // Apps-Attached: the per-app routes endpoint does NOT populate
  // StRoute.appGuids (toStRoute in native_routes_reads.go omits it).
  // Until that backend extension lands, every row on the per-app Routes
  // tab is by definition mapped to at least the current app, so we
  // resolve THAT app's name through AppNameResolverService and render
  // it as a single segment. When future backend work populates appGuids
  // for multi-mapped routes, the `compound` factory below already
  // handles the multi-name case via resolveMany.
  buildColumns(): SignalListColumn<StRoute>[] {
    const columns: SignalListColumn<StRoute>[] = [
      {
        header: 'Host', key: 'host',
        render: (row) => row.host ?? '',
        sortField: 'host',
      },
      {
        header: 'Domain', key: 'domain',
        // Derive the domain segment from the CF-rendered URL by stripping
        // host, optional :port, and path. CF guarantees URL = host '.'
        // domain (':' port)? path; if any piece can't be located we fall
        // back to the full URL so the user sees something coherent.
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
        // TCP routes carry a non-zero Port; HTTP routes leave it
        // undefined. Show '-' for HTTP rather than blanking the cell so
        // the column reads as intentional.
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
        render: (row) => `${this.attachedAppGuids(row).length}`,
        sortField: (row) => this.attachedAppGuids(row).length,
        maxVisible: 3,
        collapsedLabel: (n) => `…and ${n} more`,
      },
      {
        header: '', key: 'actions',
        kind: 'actions',
        actions: this.buildRowActions,
        render: () => '',
        widthHint: '3rem',
      },
    ];
    return columns;
  }

  // ---------------------------------------------------------------------------
  // Cell helpers
  // ---------------------------------------------------------------------------

  // Parse the domain segment out of the CF-rendered URL.
  // URL shape (per CF): host '.' domain (':' port)? path
  // - HTTP route, no host: URL = domain + path
  // - HTTP route with host: URL = host + '.' + domain + path
  // - TCP route: URL = domain + ':' + port (no host, no path)
  // We don't fetch the domain catalog (slice-3 explicitly avoids that),
  // so the parse is best-effort. If the structure doesn't match, return
  // the URL as-is — better to display SOMETHING coherent than blank.
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

  // Compute the GUIDs of apps attached to a route. Per-app endpoint
  // doesn't populate StRoute.appGuids today, so default to the current
  // app GUID — every row on this tab is mapped to it by definition.
  private attachedAppGuids(row: StRoute): readonly string[] {
    if (row.appGuids && row.appGuids.length) {
      return row.appGuids;
    }
    const cur = this.appService.appGuid;
    return cur ? [cur] : [];
  }

  // Build the compound segments for the Apps Attached cell. Each segment
  // resolves an app GUID to its name via AppNameResolverService; until
  // the lookup lands, render the GUID as a placeholder so the cell isn't
  // visually empty. Segments are not links in slice 3 — wiring per-app
  // navigation from a route row defers to a follow-up slice.
  private buildAppsCompound(row: StRoute): readonly SignalListCompoundSegment[] {
    const guids = this.attachedAppGuids(row);
    if (!guids.length) return [];
    const cnsi = row.cnsiGuid || this.appService.cfGuid;
    const names = this.appNames.resolveMany(cnsi, guids)();
    return guids.map(g => ({ text: names.get(g) ?? g }));
  }

  // Per-row action factory. Returns the kebab-menu entries for a row.
  // Two entries: Unmap (remove the destination), Delete (delete the
  // route entirely). Both disabled while ANY per-route verb is in
  // flight — the action service rejects concurrent invokes, so a UI
  // that pretended otherwise would yield "click did nothing".
  //
  // The actual confirmation dialog wiring is the consuming component's
  // job (matches CfAppInstancesSignalConfigService convention). The
  // default factory here is the no-confirm path used by tests and any
  // future surface that doesn't need confirmation.
  readonly buildRowActions = (row: StRoute): readonly SignalListRowAction<StRoute>[] => {
    const disabled = this.actionsService.inFlight();
    return [
      {
        label: 'Unmap', icon: 'block',
        disabled,
        invoke: () => this.actionsService.unmapRoute(row.guid),
      },
      {
        label: 'Delete', icon: 'delete', danger: true,
        disabled,
        invoke: () => this.actionsService.deleteRoute(row.guid),
      },
    ];
  };
}
