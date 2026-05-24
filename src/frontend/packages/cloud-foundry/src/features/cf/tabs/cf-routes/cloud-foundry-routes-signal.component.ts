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
  SignalListDropdown,
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
  host: { class: 'app-host-fill' },
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
      // Prefix with http:// for HTTP routes to match the legacy UI's
      // Route column, which always rendered the full URL with scheme.
      // TCP routes aren't HTTP so they render as host:port without scheme.
      const base = r.url && r.url.length > 0
        ? r.url
        : ((r.host ?? '') + (r.path ?? ''));
      if (r.port != null) return `${base}:${r.port}`;
      // Avoid double-prepending if CF has already rendered scheme into url
      // (shouldn't today, but future-proof).
      if (/^https?:\/\//i.test(base)) return base;
      return `http://${base}`;
    };

    const renderApps = (r: StRoute): string => {
      const guids = r.appGuids ?? [];
      if (guids.length === 0) return 'None';
      return guids.map(g => this.appNameByGuid().get(g) ?? '—').join(', ');
    };

    const compoundApps = (r: StRoute): SignalListCompoundSegment[] => {
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

    // CNSI is pre-chosen by the URL — show the dropdown but disable it so
    // the scope is visible and can't drift. Parity with services + market-
    // place tabs which also lead with a locked Cloud Foundry indicator.
    const endpointName = computed(() =>
      this.cfEndpointService.endpoint()?.entity?.name ?? cfGuid,
    );
    const cnsiOptions = computed(() => [{ label: endpointName(), value: cfGuid }]);
    const selectedCnsi = signal<string | null>(cfGuid);
    const cnsiLocked: Signal<boolean> = signal(true).asReadonly();

    const dropdowns: SignalListDropdown[] = [
      {
        label: 'Cloud Foundry',
        options: cnsiOptions,
        selected: selectedCnsi,
        disabled: cnsiLocked,
      },
      {
        label: 'Organization',
        options: this.routesConfig.orgOptions,
        selected: this.routesConfig.selectedOrg,
        loading: this.routesConfig.isLoadingOrgs,
      },
      {
        label: 'Space',
        options: this.routesConfig.spaceOptions,
        selected: this.routesConfig.selectedSpace,
        loading: this.routesConfig.isLoadingSpaces,
      },
    ];

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
      filterDropdowns: dropdowns,
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
        this.snackBar.error(`${label} failed: ${err?.message ?? err}`);
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
