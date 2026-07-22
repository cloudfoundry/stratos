import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, Signal, WritableSignal, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  isUnlimited,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListBulkAction,
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
import { BulkResult, CfAppsSignalConfigService } from '../../../../../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { extractHttpErrorMessage } from '../../../../../../../services/extract-error-message';
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
  host: { class: 'app-host-fill' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ListSubNavComponent,
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
  private router = inject(Router);
  private permissionsService = inject(CurrentUserPermissionsService);

  /** Total app count in this space for the L5 sub-nav. */
  public totalApplications!: Signal<number>;
  /** Reactive permission flag for the Create Application button — scoped
   *  to this space (APPLICATION_CREATE checks SPACE_DEVELOPER role). Built
   *  in the constructor (injection context) so toSignal() resolves. */
  public readonly canCreateApplication: Signal<boolean> = toSignal(
    this.permissionsService.can(
      CfCurrentUserPermissions.APPLICATION_CREATE,
      this.cfEndpointService.cfGuid,
      this.cfSpaceService.spaceGuid,
    ),
    { initialValue: false },
  );
  /** L5 primary action — navigates to the deploy stepper with the CNSI
   *  pre-selected via the `:endpointId` route param. Org/space pre-fill
   *  is a follow-up enhancement; today the user picks org/space inside
   *  the wizard. */
  public readonly createApplicationAction: ListSubNavAddAction = {
    label: 'Create Application',
    icon: 'add',
    visible: this.canCreateApplication,
    invoke: () => this.router.navigate(['/applications/new', this.cfEndpointService.cfGuid]),
  };

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

  // Selected row keys for bulk operations — key is `${cnsiGuid}:${guid}`,
  // matching getRowKey. Owned here; the checkbox column reads/writes it and
  // the bulk-action bar derives from it.
  private readonly selectedAppKeys: WritableSignal<ReadonlySet<string>> = signal(new Set());

  public listConfig: WritableSignal<SignalListConfig<StApp> | undefined> = signal(undefined);

  async ngOnInit(): Promise<void> {
    const cfGuid = this.cfEndpointService.cfGuid;
    const spaceGuid = this.cfSpaceService.spaceGuid;
    // Pin the locked space scope and build a single-CNSI orchestrator.
    // initializeForSpace() also flips a benign signal so the constructor
    // effect re-derives the filter predicate against the new lock.
    this.appsConfig.initializeForSpace(cfGuid, spaceGuid);
    this.totalApplications = this.appsConfig.view.totalItems;

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
          header: '', key: 'select',
          kind: 'checkbox',
          checkbox: {
            selectedKeys: this.selectedAppKeys,
            selectAll: {
              // Filtered set size, not just the current page — matches the
              // tri-state header's "all selectable rows" semantics.
              selectableCount: () => this.appsConfig.view.totalFilteredResults(),
              onToggle: () => this.toggleSelectAll(),
            },
          },
          render: () => '',
          widthHint: '3rem',
        },
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
      bulkActions: this.buildBulkActions(),
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

  // Select-all flips between "every filtered row selected" and cleared,
  // keyed off the full filtered set (not just the current page).
  private toggleSelectAll(): void {
    const filtered = this.appsConfig.view.filteredItems();
    const selected = this.selectedAppKeys();
    if (selected.size >= filtered.length && filtered.length > 0) {
      this.selectedAppKeys.set(new Set());
    } else {
      this.selectedAppKeys.set(new Set(filtered.map(a => `${a.cnsiGuid}:${a.guid}`)));
    }
  }

  // Resolve the selected row keys back to the StApp objects from the current
  // filtered set. Keys are `${cnsiGuid}:${guid}`; intersecting with live rows
  // drops any stale keys for rows that have since left the view.
  private resolveSelectedApps(keys: ReadonlySet<string>): StApp[] {
    return this.appsConfig.view.filteredItems()
      .filter(a => keys.has(`${a.cnsiGuid}:${a.guid}`));
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
        this.snackBar.error(`${result.failed} of ${total} applications failed to ${verb}`);
      } else {
        this.snackBar.open(`${total} ${total === 1 ? 'application' : 'applications'} ${verb} requested`);
      }
    } catch (err: unknown) {
      this.snackBar.error(`Bulk ${verb} failed: ${extractHttpErrorMessage(err)}`);
    } finally {
      this.selectedAppKeys.set(new Set());
    }
  }

  // Bulk Delete, rendered in the selection bar above the list when 1+ rows
  // are selected. Deleting an app cascades its routes/bindings on the CF side.
  private buildBulkActions(): SignalListBulkAction<StApp>[] {
    const cnsi = this.cfEndpointService.cfGuid;
    return [
      {
        label: 'Delete', icon: 'delete', danger: true,
        run: (keys: ReadonlySet<string>) => {
          const targets = this.resolveSelectedApps(keys);
          if (targets.length === 0) return;
          const confirm = new ConfirmationDialogConfig(
            'Delete Applications',
            `Delete ${targets.length} ${targets.length === 1 ? 'application' : 'applications'}? This cannot be undone.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await this.runBulk('delete', targets.length, () =>
              this.appsConfig.bulkDeleteApps(cnsi, targets.map(a => a.guid)));
          });
        },
      },
    ];
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
    if (isUnlimited(mb)) return '∞';
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
