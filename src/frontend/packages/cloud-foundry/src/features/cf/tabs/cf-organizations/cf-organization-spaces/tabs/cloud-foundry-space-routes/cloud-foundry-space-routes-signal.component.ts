import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  SignalListBulkAction,
  SignalListCompoundSegment,
  SignalListComponent,
  SignalListConfig,
  SignalListPillColor,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';
import {
  UserFavorite,
  UserFavoriteManager,
} from '@stratosui/store';

import { BulkResult, CfRoutesSignalConfigService } from '../../../../../../../shared/signal-list-configs/route/cf-routes-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { extractHttpErrorMessage } from '../../../../../../../services/extract-error-message';
import type { StApp, StRoute } from '../../../../../../../services/endpoint-data/stratos-types';

// Signal-native replacement for CloudFoundrySpaceRoutesComponent.
// Scoped to one space under one org under one CF endpoint (all three guids
// supplied by the route-level services). Its CfRoutesSignalConfigService
// owns its own fetch against /pp/v1/cf/routes/:cnsi (home-page cache
// carries counts only, not the full list), then filters client-side to
// this.spaceGuid.
@Component({
  selector: 'app-cloud-foundry-space-routes-signal',
  templateUrl: './cloud-foundry-space-routes-signal.component.html',
  host: { class: 'app-host-fill' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    SignalListComponent,
  ],
})
export class CloudFoundrySpaceRoutesSignalComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  cfSpaceService = inject(CloudFoundrySpaceService);
  private routesConfig = inject(CfRoutesSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);

  // Favorite keys in rowKey format (${cnsi}:${routeGuid}). Reads route
  // favorites from the manager and projects to the row-key set the
  // SignalListColumn.favorite binding expects.
  private readonly favoriteRouteRowKeys: Signal<ReadonlySet<string>> = toSignal(
    this.userFavoriteManager.getAllFavorites().pipe(
      map(([groups, entities]) => {
        const out = new Set<string>();
        if (!groups || !entities) return out;
        for (const epFavGuid in groups) {
          const g = groups[epFavGuid];
          if (!g?.entitiesIds) continue;
          for (const favId of g.entitiesIds) {
            const fav = entities[favId];
            if (fav && fav.entityType === 'route' && fav.endpointType === 'cf') {
              out.add(`${fav.endpointId}:${fav.entityId}`);
            }
          }
        }
        return out;
      }),
    ),
    { initialValue: new Set<string>() },
  );

  // Map of appGuid -> appName, derived from the endpoint-data service's
  // apps() signal. Keeps the Route cell's per-app segments display names
  // only (never raw GUIDs in user-facing cells).
  private readonly appNameByGuid: Signal<Map<string, string>> = computed(() => {
    const all: StApp[] = this.routesConfig.endpointData?.apps() ?? [];
    const m = new Map<string, string>();
    for (const a of all) m.set(a.guid, a.name);
    return m;
  });

  // Selected row keys for bulk operations — key is `${cnsiGuid}:${guid}`,
  // matching getRowKey. Owned here; the checkbox column reads/writes it and
  // the bulk-action disabled signals derive from it.
  private readonly selectedRouteKeys: WritableSignal<ReadonlySet<string>> = signal(new Set());

  public listConfig: WritableSignal<SignalListConfig<StRoute> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const orgGuid = this.cfOrgService.orgGuid;
    const spaceGuid = this.cfSpaceService.spaceGuid;
    this.routesConfig.initialize(cfGuid, spaceGuid);

    const displayUrl = (r: StRoute): string => {
      // Match legacy UI: full URL with scheme. TCP routes render as
      // host:port (no scheme); HTTP routes get an http:// prefix.
      const base = r.url && r.url.length > 0
        ? r.url
        : ((r.host ?? '') + (r.path ?? ''));
      if (r.port != null) return `${base}:${r.port}`;
      if (/^https?:\/\//i.test(base)) return base;
      return `http://${base}`;
    };

    const renderApps = (r: StRoute): string => {
      // Used for sort/filter string shape; the visual cell renders via
      // the compound function below. 'None' matches legacy behaviour.
      const guids = r.appGuids ?? [];
      if (guids.length === 0) return 'None';
      return guids.map(g => this.appNameByGuid().get(g) ?? '—').join(', ');
    };

    const compoundApps = (r: StRoute): SignalListCompoundSegment[] => {
      // Each bound app becomes its own line with a link to the app-detail
      // page. Apps whose name hasn't resolved yet render as '—' plain text
      // — never surface raw GUIDs in user-facing cells. Unmapped routes
      // render 'None' to match legacy explicit empty-state text.
      const guids = r.appGuids ?? [];
      if (guids.length === 0) return [{ text: 'None' }];
      const out: SignalListCompoundSegment[] = [];
      for (const appGuid of guids) {
        const name = this.appNameByGuid().get(appGuid);
        if (name) {
          out.push({ text: name, link: ['/applications', r.cnsiGuid, appGuid] });
        } else {
          out.push({ text: '—' });
        }
      }
      return out;
    };

    // TCP vs HTTP indicator. CF V3 distinguishes TCP routes by carrying a
    // port number in the route resource (HTTP routes have no port). Using a
    // pill instead of a dot so the 3-letter label reads clearly.
    const typeLabel = (r: StRoute): string => (r.port != null ? 'TCP' : 'HTTP');
    const typeColor = (r: StRoute): SignalListPillColor =>
      r.port != null ? 'warning' : 'neutral';

    this.listConfig.set({
      pagedItems: this.routesConfig.view.pagedItems,
      totalFilteredResults: this.routesConfig.view.totalFilteredResults,
      totalPages: this.routesConfig.view.totalPages,
      pageIndex: this.routesConfig.pageIndex,
      pageSize: this.routesConfig.pageSize,
      isAnyLoading: computed(() => !this.routesConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: '', key: 'select',
          kind: 'checkbox',
          checkbox: {
            selectedKeys: this.selectedRouteKeys,
            selectAll: {
              // Filtered set size, not just the current page — matches the
              // tri-state header's "all selectable rows" semantics.
              selectableCount: () => this.routesConfig.view.totalFilteredResults(),
              onToggle: () => this.toggleSelectAll(),
            },
          },
          render: () => '',
          widthHint: '3rem',
        },
        {
          header: 'Route', key: 'url', sortField: 'url',
          kind: 'text',
          render: displayUrl,
          widthHint: '24rem',
        },
        {
          header: 'Attached Applications', key: 'apps', sortField: renderApps,
          kind: 'compound',
          compound: compoundApps,
          render: renderApps,
          widthHint: '18rem',
        },
        {
          header: 'Type', key: 'type', sortField: typeLabel,
          kind: 'pill',
          pillColor: typeColor,
          render: typeLabel,
          widthHint: '6rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (r: StRoute) => CloudFoundrySpaceRoutesSignalComponent.formatDate(r.createdAt),
          widthHint: '12rem',
        },
        {
          header: '', key: 'favorite',
          kind: 'favorite',
          favorite: {
            keys: this.favoriteRouteRowKeys,
            toggle: (r: StRoute) => this.toggleRouteFavorite(r),
          },
          render: () => '',
          widthHint: '3rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: this.buildRouteActions,
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (r: StRoute) => `${r.cnsiGuid}:${r.guid}`,
      emptyMessage: 'There are no routes in this space',
      emptyFilterMessage: 'No routes match the current filters',
      loadingMessage: 'Loading routes…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.routesConfig.nameFilter,
      onRefresh: () => this.routesConfig.refresh(),
      onClear: () => this.routesConfig.clearFilters(),
      viewMode: this.routesConfig.viewMode,
      sort: this.routesConfig.sort,
      bulkActions: this.buildBulkActions(),
    });

    // URL-based sort reads the rendered URL so host+path fallback sorts in
    // the same order the user sees.
    this.routesConfig.registerSortExtractor('url', displayUrl);
  }

  private toggleRouteFavorite(route: StRoute): void {
    const fav = new UserFavorite(route.cnsiGuid, 'cf', 'route', route.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  // Select-all flips between "every filtered row selected" and cleared,
  // keyed off the full filtered set (not just the current page).
  private toggleSelectAll(): void {
    const filtered = this.routesConfig.view.filteredItems();
    const selected = this.selectedRouteKeys();
    if (selected.size >= filtered.length && filtered.length > 0) {
      this.selectedRouteKeys.set(new Set());
    } else {
      this.selectedRouteKeys.set(new Set(filtered.map(r => `${r.cnsiGuid}:${r.guid}`)));
    }
  }

  // Resolve the selected row keys back to the StRoute objects from the
  // current filtered set, so callers get appGuids for the unmap check.
  // Keys are `${cnsiGuid}:${guid}`; intersecting with live rows drops any
  // stale keys for rows that have since left the view.
  private resolveSelectedRoutes(keys: ReadonlySet<string>): StRoute[] {
    return this.routesConfig.view.filteredItems()
      .filter(r => keys.has(`${r.cnsiGuid}:${r.guid}`));
  }

  // Run a bulk op, report partial failures, and clear selection on success.
  // succeeded+pending counts as non-error (pending items have an async CF
  // job tracking completion); only `failed` drives an error snackbar.
  private async runBulk(
    verb: string,
    total: number,
    op: () => Promise<BulkResult>,
  ): Promise<void> {
    try {
      const result = await op();
      if (result.failed > 0) {
        this.snackBar.error(`${result.failed} of ${total} routes failed to ${verb}`);
      } else {
        this.snackBar.open(`${total} ${total === 1 ? 'route' : 'routes'} ${verb} requested`);
      }
    } catch (err: unknown) {
      this.snackBar.error(`Bulk ${verb} failed: ${extractHttpErrorMessage(err)}`);
    } finally {
      this.selectedRouteKeys.set(new Set());
    }
  }

  // Bulk Unmap + Bulk Delete, rendered in the selection bar above the list
  // when 1+ rows are selected. Unmap is disabled unless at least one selected
  // route has a binding to remove.
  private buildBulkActions(): SignalListBulkAction<StRoute>[] {
    const cnsi = this.cfEndpointService.cfGuid;
    const unmapDisabled = computed(() => {
      const routes = this.resolveSelectedRoutes(this.selectedRouteKeys());
      return !routes.some(r => (r.appGuids ?? []).length > 0);
    });
    return [
      {
        label: 'Unmap', icon: 'link_off',
        disabled: unmapDisabled,
        run: (keys: ReadonlySet<string>) => {
          const targets = this.resolveSelectedRoutes(keys).filter(r => (r.appGuids ?? []).length > 0);
          if (targets.length === 0) return;
          const confirm = new ConfirmationDialogConfig(
            'Unmap Routes',
            `Unmap ${targets.length} ${targets.length === 1 ? 'route' : 'routes'} from their bound apps? The routes will remain available to map again later.`,
            'Unmap',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await this.runBulk('unmap', targets.length, () =>
              this.routesConfig.bulkUnmapRoutes(cnsi, targets.map(r => r.guid)));
          });
        },
      },
      {
        label: 'Delete', icon: 'delete', danger: true,
        run: (keys: ReadonlySet<string>) => {
          const targets = this.resolveSelectedRoutes(keys);
          if (targets.length === 0) return;
          const confirm = new ConfirmationDialogConfig(
            'Delete Routes',
            `Delete ${targets.length} ${targets.length === 1 ? 'route' : 'routes'}? This cannot be undone and will unmap any bound apps.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await this.runBulk('delete', targets.length, () =>
              this.routesConfig.bulkDeleteRoutes(cnsi, targets.map(r => r.guid)));
          });
        },
      },
    ];
  }

  // Per-row Unmap + Delete. Mirrors the CF Routes tab; Unmap removes
  // all destinations from the route (route entity stays), Delete
  // destroys the route entirely. Restores the V2-era listActionUnmap
  // dropped during the signal-native migration.
  private buildRouteActions = (route: StRoute): readonly SignalListRowAction<StRoute>[] => {
    const runAction = async (label: string, op: () => Promise<void>) => {
      try {
        await op();
      } catch (err: unknown) {
        this.snackBar.error(`${label} failed: ${extractHttpErrorMessage(err)}`);
      }
    };
    const appGuids = route.appGuids ?? [];
    const boundCount = appGuids.length;
    return [
      {
        label: 'Unmap', icon: 'link_off',
        disabled: boundCount === 0,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Unmap Route',
            boundCount === 1
              ? `Unmap "${route.url || route.guid}" from the app it is currently bound to? The route will remain available to map again later.`
              : `Unmap "${route.url || route.guid}" from all ${boundCount} bound apps? The route will remain available to map again later.`,
            'Unmap',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await runAction('Unmap', () =>
              this.routesConfig.unmapAllAppsFromRoute(route.cnsiGuid, route.guid, appGuids));
          });
        },
      },
      {
        label: 'Delete', icon: 'delete', danger: true,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Delete Route',
            `Are you sure you want to delete "${route.url || route.guid}"? This cannot be undone and will unmap any apps bound to this route.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await runAction('Delete', () => this.routesConfig.deleteRoute(route.cnsiGuid, route.guid));
          });
        },
      },
    ];
  };

  static formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }
}
