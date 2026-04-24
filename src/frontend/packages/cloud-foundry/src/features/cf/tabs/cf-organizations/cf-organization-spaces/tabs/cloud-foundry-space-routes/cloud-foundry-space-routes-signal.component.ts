import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  SignalListColumn,
  SignalListCompoundSegment,
  SignalListComponent,
  SignalListConfig,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';
import {
  UserFavorite,
  UserFavoriteManager,
} from '@stratosui/store';

import { CfRoutesSignalConfigService } from '../../../../../../../shared/components/list/list-types/route/cf-routes-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
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
  styleUrls: ['./cloud-foundry-space-routes-signal.component.scss'],
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

  public listConfig: WritableSignal<SignalListConfig<StRoute> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const orgGuid = this.cfOrgService.orgGuid;
    const spaceGuid = this.cfSpaceService.spaceGuid;
    this.routesConfig.initialize(cfGuid, spaceGuid);

    const displayUrl = (r: StRoute): string => {
      // Prefer the backend-rendered full URL; fall back to host + path for
      // the (unusual) case where CAPI omitted the rendered URL.
      if (r.url && r.url.length > 0) return r.url;
      const host = r.host ?? '';
      const path = r.path ?? '';
      return host + path;
    };

    const renderRoute = (r: StRoute): string => {
      const apps = (r.appGuids ?? [])
        .map(g => this.appNameByGuid().get(g) ?? '—')
        .join(', ');
      return apps ? `${displayUrl(r)} — ${apps}` : displayUrl(r);
    };

    const compoundRoute = (r: StRoute): SignalListCompoundSegment[] => {
      // Line 1 is the route URL itself. No route-detail page exists, so it
      // renders as plain text (no link). Lines 2..N are one per mapped app,
      // resolved to the app name via the apps() signal; each links to the
      // app detail page. Apps whose names haven't resolved yet render as
      // '—' plain text — never surface raw GUIDs in user-facing cells.
      const segments: SignalListCompoundSegment[] = [
        { text: displayUrl(r) },
      ];
      for (const appGuid of r.appGuids ?? []) {
        const name = this.appNameByGuid().get(appGuid);
        if (name) {
          segments.push({ text: name, link: ['/applications', r.cnsiGuid, appGuid] });
        } else {
          segments.push({ text: '—' });
        }
      }
      return segments;
    };

    const routeColumn: SignalListColumn<StRoute> = {
      header: 'Route', key: 'url', sortField: 'url',
      kind: 'compound',
      compound: compoundRoute,
      render: renderRoute,
      widthHint: '28rem',
    };

    this.listConfig.set({
      pagedItems: this.routesConfig.view.pagedItems,
      totalFilteredResults: this.routesConfig.view.totalFilteredResults,
      totalPages: this.routesConfig.view.totalPages,
      pageIndex: this.routesConfig.pageIndex,
      pageSize: this.routesConfig.pageSize,
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns: [
        routeColumn,
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
    });

    // URL-based sort reads the rendered URL so host+path fallback sorts in
    // the same order the user sees.
    this.routesConfig.registerSortExtractor('url', displayUrl);
  }

  private toggleRouteFavorite(route: StRoute): void {
    const fav = new UserFavorite(route.cnsiGuid, 'cf', 'route', route.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  private buildRouteActions = (route: StRoute): readonly SignalListRowAction<StRoute>[] => {
    const runAction = async (label: string, op: () => Promise<void>) => {
      try {
        await op();
      } catch (err: any) {
        this.snackBar.open(`${label} failed: ${err?.message ?? err}`, 'Dismiss');
      }
    };
    return [
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
