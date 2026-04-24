import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
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

import { CfRoutesSignalConfigService } from '../../../../shared/components/list/list-types/route/cf-routes-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StApp, StRoute } from '../../../../services/endpoint-data/stratos-types';

// Signal-native replacement for CloudFoundryRoutesComponent at
// /cloud-foundry/:cnsi/routes. CNSI-wide — shows every route the CF
// returns, with a Space / Org column resolving the route's spaceGuid
// and orgGuid via the same EndpointDataService signals the home-page
// parallelization cache populates.
//
// Reuses CfRoutesSignalConfigService; the service honours an empty
// spaceGuid as "no filter" so the same fetch-and-view machinery serves
// both the per-space and the CF-level pages.
@Component({
  selector: 'app-cloud-foundry-routes-signal',
  templateUrl: './cloud-foundry-routes-signal.component.html',
  styleUrls: ['./cloud-foundry-routes-signal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    SignalListComponent,
  ],
})
export class CloudFoundryRoutesSignalComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private routesConfig = inject(CfRoutesSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);

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

  private readonly appNameByGuid: Signal<Map<string, string>> = computed(() => {
    const all: StApp[] = this.routesConfig.endpointData?.apps() ?? [];
    const m = new Map<string, string>();
    for (const a of all) m.set(a.guid, a.name);
    return m;
  });

  public listConfig: WritableSignal<SignalListConfig<StRoute> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    // No spaceGuid — service shows every route in the CNSI.
    this.routesConfig.initialize(cfGuid);

    const displayUrl = (r: StRoute): string => {
      if (r.url && r.url.length > 0) return r.url;
      const host = r.host ?? '';
      const path = r.path ?? '';
      return host + path;
    };

    const renderApps = (r: StRoute): string => {
      const guids = r.appGuids ?? [];
      if (guids.length === 0) return '';
      return guids.map(g => this.appNameByGuid().get(g) ?? '—').join(', ');
    };

    const compoundApps = (r: StRoute): SignalListCompoundSegment[] => {
      const out: SignalListCompoundSegment[] = [];
      for (const appGuid of r.appGuids ?? []) {
        const name = this.appNameByGuid().get(appGuid);
        if (name) {
          out.push({ text: name, link: ['/applications', r.cnsiGuid, appGuid] });
        } else {
          out.push({ text: '—' });
        }
      }
      return out;
    };

    const renderSpace = (r: StRoute): string => {
      const spaceName = this.routesConfig.spaceNameByGuid().get(r.spaceGuid) ?? '—';
      const orgGuid = this.routesConfig.orgGuidBySpaceGuid().get(r.spaceGuid);
      const orgName = orgGuid ? (this.routesConfig.orgNameByGuid().get(orgGuid) ?? '—') : '—';
      return `${orgName} / ${spaceName}`;
    };

    const compoundSpace = (r: StRoute): SignalListCompoundSegment[] => {
      // Stack org name above space name, each linked to its detail page
      // when the name has resolved (never raw GUIDs in user-facing cells).
      const spaceName = this.routesConfig.spaceNameByGuid().get(r.spaceGuid);
      const orgGuid = this.routesConfig.orgGuidBySpaceGuid().get(r.spaceGuid);
      const orgName = orgGuid ? this.routesConfig.orgNameByGuid().get(orgGuid) : undefined;
      const out: SignalListCompoundSegment[] = [];
      if (orgName && orgGuid) {
        out.push({ text: orgName, link: ['/cloud-foundry', r.cnsiGuid, 'organizations', orgGuid] });
      } else {
        out.push({ text: '—' });
      }
      if (spaceName && orgGuid) {
        out.push({ text: spaceName, link: ['/cloud-foundry', r.cnsiGuid, 'organizations', orgGuid, 'spaces', r.spaceGuid] });
      } else {
        out.push({ text: '—' });
      }
      return out;
    };

    const typeLabel = (r: StRoute): string => (r.port != null ? 'TCP' : 'HTTP');
    const typeColor = (r: StRoute): SignalListPillColor =>
      r.port != null ? 'warning' : 'neutral';

    this.listConfig.set({
      pagedItems: this.routesConfig.view.pagedItems,
      totalFilteredResults: this.routesConfig.view.totalFilteredResults,
      totalPages: this.routesConfig.view.totalPages,
      pageIndex: this.routesConfig.pageIndex,
      pageSize: this.routesConfig.pageSize,
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Route', key: 'url', sortField: 'url',
          kind: 'text',
          render: displayUrl,
          widthHint: '22rem',
        },
        {
          header: 'Attached Applications', key: 'apps', sortField: renderApps,
          kind: 'compound',
          compound: compoundApps,
          render: renderApps,
          widthHint: '16rem',
        },
        {
          header: 'Type', key: 'type', sortField: typeLabel,
          kind: 'pill',
          pillColor: typeColor,
          render: typeLabel,
          widthHint: '6rem',
        },
        {
          header: 'Org / Space', key: 'orgSpace', sortField: renderSpace,
          kind: 'compound',
          compound: compoundSpace,
          render: renderSpace,
          widthHint: '16rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (r: StRoute) => CloudFoundryRoutesSignalComponent.formatDate(r.createdAt),
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
      emptyMessage: 'There are no routes in this Cloud Foundry',
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

    this.routesConfig.registerSortExtractor('url', displayUrl);
    this.routesConfig.registerSortExtractor('apps', renderApps);
    this.routesConfig.registerSortExtractor('type', typeLabel);
    this.routesConfig.registerSortExtractor('orgSpace', renderSpace);
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
