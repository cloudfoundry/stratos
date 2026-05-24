import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, Signal, WritableSignal, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
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

import { applicationEntityType } from '../../../../cf-entity-types';
import { CfAppsSignalConfigService } from '../../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StApp } from '../../../../services/endpoint-data/stratos-types';

// Per-CF Applications tab. Scoped to one CNSI via the parent route's
// CloudFoundryEndpointService. Mirrors the per-space tab's wiring exactly,
// except the orchestrator is initialized for the whole CNSI rather than
// pinned to one space.
@Component({
  selector: 'app-cloud-foundry-applications-signal',
  templateUrl: './cloud-foundry-applications-signal.component.html',
  host: { class: 'app-host-fill' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    SignalListComponent,
  ],
})
export class CloudFoundryApplicationsSignalComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private appsConfig = inject(CfAppsSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);

  private readonly favoriteAppRowKeys: Signal<ReadonlySet<string>> = toSignal(
    this.userFavoriteManager.getAllFavorites().pipe(
      map(([groups, entities]) => {
        const out = new Set<string>();
        if (!groups || !entities) return out;
        for (const epFavGuid in groups) {
          const g = groups[epFavGuid];
          if (!g?.entitiesIds) continue;
          for (const favId of g.entitiesIds) {
            const fav = entities[favId];
            if (fav && fav.entityType === applicationEntityType && fav.endpointType === 'cf') {
              out.add(`${fav.endpointId}:${fav.entityId}`);
            }
          }
        }
        return out;
      }),
    ),
    { initialValue: new Set<string>() },
  );

  public listConfig: WritableSignal<SignalListConfig<StApp> | undefined> = signal(undefined);

  async ngOnInit(): Promise<void> {
    const cfGuid = this.cfEndpointService.cfGuid;
    // Drop any stale per-space lock left behind by a previous space-apps
    // mount in the same session, then build a single-CNSI orchestrator.
    this.appsConfig.clearLockedSpace();
    this.appsConfig.initialize([cfGuid]);
    // CNSI is pre-chosen by the URL — pin the dropdown's selection to this
    // CF and disable it so the scope is visible (matching Org/Space framing
    // on per-org / per-space pages) but the user can't drift off this CF.
    this.appsConfig.selectedCnsi.set(cfGuid);
    const cnsiLocked: Signal<boolean> = signal(true).asReadonly();
    const dropdowns: SignalListDropdown[] = [
      {
        label: 'Cloud Foundry',
        options: this.appsConfig.cnsiOptions,
        selected: this.appsConfig.selectedCnsi,
        disabled: cnsiLocked,
      },
      {
        label: 'Organization',
        options: this.appsConfig.orgOptions,
        selected: this.appsConfig.selectedOrg,
        loading: this.appsConfig.isLoadingOrgs,
      },
      {
        label: 'Space',
        options: this.appsConfig.spaceOptions,
        selected: this.appsConfig.selectedSpace,
        loading: this.appsConfig.isLoadingSpaces,
      },
    ];

    const stateColor = (app: StApp): SignalListPillColor => {
      const s = (app.state ?? '').toUpperCase();
      if (s === 'STARTED') return 'success';
      if (s === 'CRASHED' || s === 'FAILED') return 'danger';
      return 'neutral';
    };
    const stateLabel = (app: StApp): string => {
      const s = (app.state ?? '').toUpperCase();
      if (s === 'STARTED') return 'Deployed - Online';
      if (s === 'STOPPED') return 'Stopped';
      if (s === 'CRASHED') return 'Crashed';
      if (s === 'FAILED') return 'Failed';
      return app.state ?? '';
    };

    this.listConfig.set({
      pagedItems: this.appsConfig.view.pagedItems,
      totalFilteredResults: this.appsConfig.view.totalFilteredResults,
      totalPages: this.appsConfig.view.totalPages,
      pageIndex: this.appsConfig.pageIndex,
      pageSize: this.appsConfig.pageSize,
      isAnyLoading: this.appsConfig.orchestrator.isAnyLoading,
      errorsByCnsi: this.appsConfig.orchestrator.errorsByCnsi,
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'link',
          link: (app: StApp) => ['/applications', app.cnsiGuid, app.guid],
          // Tag the row link with ?breadcrumbs=cf so the app-detail page
          // emits the CF-scoped 'Applications' breadcrumb that returns
          // here, instead of the default global '/applications' wall.
          linkQueryParams: () => ({ breadcrumbs: 'cf' }),
          render: (app: StApp) => app.name,
          widthHint: '16rem',
        },
        {
          header: 'Status', key: 'state', sortField: 'state',
          kind: 'dot',
          pillColor: stateColor,
          render: stateLabel,
          widthHint: '12rem',
        },
        {
          header: 'Instances', key: 'instances', sortField: 'instances',
          render: (app: StApp) => {
            const desired = app.instances ?? 0;
            const rowKey = `${app.cnsiGuid}:${app.guid}`;
            const s = this.appsConfig.appStats().get(rowKey);
            if (!s) return `— / ${desired}`;
            return `${s.running} / ${desired}`;
          },
          widthHint: '6rem',
        },
        {
          header: 'Memory', key: 'memory', sortField: 'memory',
          render: (app: StApp) => CloudFoundryApplicationsSignalComponent.formatMb(app.memory),
          widthHint: '7rem',
        },
        {
          header: 'Disk', key: 'diskQuota', sortField: 'diskQuota',
          render: (app: StApp) => CloudFoundryApplicationsSignalComponent.formatMb(app.diskQuota),
          widthHint: '7rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (app: StApp) => CloudFoundryApplicationsSignalComponent.formatDate(app.createdAt),
          widthHint: '12rem',
        },
        {
          header: '', key: 'favorite',
          kind: 'favorite',
          favorite: {
            keys: this.favoriteAppRowKeys,
            toggle: (app: StApp) => this.toggleAppFavorite(app),
          },
          render: () => '',
          widthHint: '3rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: this.buildAppActions,
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (app: StApp) => `${app.cnsiGuid}:${app.guid}`,
      emptyMessage: 'There are no applications in this Cloud Foundry',
      emptyFilterMessage: 'No applications match the current filters',
      loadingMessage: 'Loading applications…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.appsConfig.nameFilter,
      filterDropdowns: dropdowns,
      onRefresh: () => this.appsConfig.refresh(),
      onClear: () => this.appsConfig.clearFilters(),
      cardAccentColor: stateColor,
      viewMode: this.appsConfig.viewMode,
      sort: this.appsConfig.sort,
    });

    // Default per-CF tab presentation matches per-space: card view at 6/page.
    this.appsConfig.viewMode.set('card');
    this.appsConfig.pageSize.set(6);

    void this.appsConfig.loadAll();
    this.appsConfig.startStatsPolling();
  }

  private toggleAppFavorite(app: StApp): void {
    const fav = new UserFavorite(app.cnsiGuid, 'cf', applicationEntityType, app.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  private buildAppActions = (app: StApp): readonly SignalListRowAction<StApp>[] => {
    const runAction = async (label: string, op: () => Promise<void>) => {
      try {
        await op();
        await this.appsConfig.refresh();
      } catch (err: any) {
        this.snackBar.error(`${label} failed: ${err?.message ?? err}`);
      }
    };
    return [
      {
        label: 'Delete', icon: 'delete', danger: true,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Delete Application',
            `Delete the app "${app.name}"? This cannot be undone.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await runAction('Delete', () => this.appsConfig.deleteApp(app.cnsiGuid, app.guid));
          });
        },
      },
    ];
  };

  static formatMb(mb: number | null | undefined): string {
    if (mb == null || typeof mb !== 'number' || Number.isNaN(mb)) return '—';
    if (mb === -1) return '∞';
    if (mb < 1024) return `${mb} MB`;
    const gb = mb / 1024;
    if (gb < 1024) return `${gb.toFixed(1)} GB`;
    return `${(gb / 1024).toFixed(2)} TB`;
  }

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
