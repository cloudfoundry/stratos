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
  SignalListPillColor,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';
import {
  UserFavorite,
  UserFavoriteManager,
} from '@stratosui/store';

import { applicationEntityType } from '../../../../../../../cf-entity-types';
import { CfAppsSignalConfigService } from '../../../../../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import type { StApp } from '../../../../../../../services/endpoint-data/stratos-types';

// Signal-native space-apps tab. Scoped to one space under one CF
// endpoint (cfGuid + spaceGuid supplied by the route-level services).
// Reuses CfAppsSignalConfigService — the
// same singleton that drives the multi-CNSI app wall — via its
// initializeForSpace() entry point, which pins the locked space scope
// and builds a single-CNSI orchestrator.
//
// The toolbar exposes only a name filter (no CF/Org/Space dropdowns —
// there's exactly one of each in this context) and the standard view
// controls. Defaults: card view, page size 6.
@Component({
  selector: 'app-cloud-foundry-space-apps-signal',
  templateUrl: './cloud-foundry-space-apps-signal.component.html',
  styleUrls: ['./cloud-foundry-space-apps-signal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    SignalListComponent,
  ],
})
export class CloudFoundrySpaceAppsSignalComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfSpaceService = inject(CloudFoundrySpaceService);
  private appsConfig = inject(CfAppsSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);

  // Row keys (${cnsiGuid}:${appGuid}) for apps the user has favorited.
  // Mirrors the application-wall pattern so favorites carry across the
  // two views identically.
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
    const spaceGuid = this.cfSpaceService.spaceGuid;
    // Pin the locked space scope and build a single-CNSI orchestrator.
    // initializeForSpace() also flips a benign signal so the constructor
    // effect re-derives the filter predicate against the new lock.
    this.appsConfig.initializeForSpace(cfGuid, spaceGuid);

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
          render: (app: StApp) => CloudFoundrySpaceAppsSignalComponent.formatMb(app.memory),
          widthHint: '7rem',
        },
        {
          header: 'Disk', key: 'diskQuota', sortField: 'diskQuota',
          render: (app: StApp) => CloudFoundrySpaceAppsSignalComponent.formatMb(app.diskQuota),
          widthHint: '7rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (app: StApp) => CloudFoundrySpaceAppsSignalComponent.formatDate(app.createdAt),
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
      emptyMessage: 'There are no applications in this space',
      emptyFilterMessage: 'No applications match the current filters',
      loadingMessage: 'Loading applications…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.appsConfig.nameFilter,
      onRefresh: () => this.appsConfig.refresh(),
      onClear: () => this.appsConfig.clearFilters(),
      cardAccentColor: stateColor,
      viewMode: this.appsConfig.viewMode,
      sort: this.appsConfig.sort,
    });

    // Default per-space tab presentation: card view at 6 per page. The
    // service's writable signals carry user toggles within a session; we
    // re-set them on every mount so a per-space tab visit always lands on
    // the per-space defaults regardless of what the wall left behind.
    this.appsConfig.viewMode.set('card');
    this.appsConfig.pageSize.set(6);

    void this.appsConfig.loadAll();
    // Drive the Instances column's running / desired display the same way
    // the wall does — initial fetch + 30s polling + reactive re-fetch on
    // pagedItems change.
    this.appsConfig.startStatsPolling();
  }

  private toggleAppFavorite(app: StApp): void {
    const fav = new UserFavorite(app.cnsiGuid, 'cf', applicationEntityType, app.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  // Builds the per-row kebab-menu action list. Per the task spec the
  // per-space tab keeps just Delete (with confirmation) — start/stop/
  // restart/restage stay on the app detail page until a follow-up
  // migration brings them in here too.
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
