import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, Signal, WritableSignal, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  ListSubNavAddAction,
  ListSubNavComponent,
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

import { applicationEntityType } from '../../../../cf-entity-types';
import { CfAppsSignalConfigService } from '../../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
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
    ListSubNavComponent,
    SignalListComponent,
  ],
})
export class CloudFoundryApplicationsSignalComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private appsConfig = inject(CfAppsSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private router = inject(Router);
  private permissionsService = inject(CurrentUserPermissionsService);

  /** Total app count for the L5 sub-nav. */
  public totalApplications!: Signal<number>;
  /** Reactive permission flag for the Create Application button. Built
   *  in the constructor (injection context) so toSignal() resolves. */
  public readonly canCreateApplication: Signal<boolean> = toSignal(
    this.permissionsService.can(CfCurrentUserPermissions.APPLICATION_CREATE, this.cfEndpointService.cfGuid),
    { initialValue: false },
  );
  /** L5 primary action — navigates to the deploy stepper with this CNSI
   *  pre-selected via the `:endpointId` route param (the new-application
   *  base step forwards it as `auto-select-endpoint`). */
  public readonly createApplicationAction: ListSubNavAddAction = {
    label: 'Create Application',
    icon: 'add',
    visible: this.canCreateApplication,
    invoke: () => this.router.navigate(['/applications/new', this.cfEndpointService.cfGuid]),
  };

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
    this.totalApplications = this.appsConfig.view.totalItems;
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
          // Org/Space — the application wall's CF/Org/Space column minus the
          // CF segment (CF is already implied by this scoped route).
          header: 'Org/Space', key: 'orgSpace',
          sortField: (app: StApp) => CloudFoundryApplicationsSignalComponent.renderOrgSpace(
            app, this.appsConfig.orgNames(), this.appsConfig.spaceNames()),
          kind: 'compound',
          compound: (app: StApp) => CloudFoundryApplicationsSignalComponent.compoundOrgSpace(
            app, this.appsConfig.orgNames(), this.appsConfig.spaceNames()),
          render: (app: StApp) => CloudFoundryApplicationsSignalComponent.renderOrgSpace(
            app, this.appsConfig.orgNames(), this.appsConfig.spaceNames()),
          widthHint: '14rem',
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
      // Filter-by-field parity with the wall: the text filter can target
      // Name, Status, or the Org/Space column.
      filterColumns: ['name', 'state', 'orgSpace'],
      filterField: this.appsConfig.filterField,
      filterDropdowns: dropdowns,
      onRefresh: () => this.appsConfig.refresh(),
      onClear: () => this.appsConfig.clearFilters(),
      cardAccentColor: stateColor,
      viewMode: this.appsConfig.viewMode,
      sort: this.appsConfig.sort,
    });

    // Sort + filter extractors for the Org/Space column (composed from name
    // maps rather than a direct StApp field), plus name/state so the
    // filter-by-field dropdown can target each.
    const orgSpaceText = (app: StApp) => CloudFoundryApplicationsSignalComponent.renderOrgSpace(
      app, this.appsConfig.orgNames(), this.appsConfig.spaceNames());
    this.appsConfig.registerSortExtractor('orgSpace', orgSpaceText);
    this.appsConfig.registerFilterExtractor('name', (app: StApp) => app.name ?? '');
    this.appsConfig.registerFilterExtractor('state', stateLabel);
    this.appsConfig.registerFilterExtractor('orgSpace', orgSpaceText);

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

  /**
   * Resolve an app's org + space display names. Prefers the names carried on
   * the row from the server-side space→org / app→space join; falls back to
   * the catalog name maps by guid, then to an em-dash placeholder (never a
   * raw guid — guids stay in the URL/tooltip). Mirrors the application wall's
   * resolution, minus the CF/endpoint segment (CF is implied by the route).
   */
  static resolveOrgSpace(
    app: StApp,
    orgNames: ReadonlyMap<string, string>,
    spaceNames: ReadonlyMap<string, string>,
  ): { orgName: string; spaceName: string } {
    const orgName = app.orgName || (app.orgGuid ? (orgNames.get(app.orgGuid) ?? '—') : '—');
    const spaceName = app.spaceName || (app.spaceGuid ? (spaceNames.get(app.spaceGuid) ?? '—') : '—');
    return { orgName, spaceName };
  }

  /** Flatten org + space to a single string for sort/filter extractors. */
  static renderOrgSpace(
    app: StApp,
    orgNames: ReadonlyMap<string, string>,
    spaceNames: ReadonlyMap<string, string>,
  ): string {
    const { orgName, spaceName } = CloudFoundryApplicationsSignalComponent.resolveOrgSpace(app, orgNames, spaceNames);
    return `${orgName} / ${spaceName}`;
  }

  /**
   * Stacked Org/Space segments for the compound column. Each segment links
   * to its CF detail page once the guid + name are both known; while a name
   * is still '—' the segment renders as plain text (no dead anchors).
   */
  static compoundOrgSpace(
    app: StApp,
    orgNames: ReadonlyMap<string, string>,
    spaceNames: ReadonlyMap<string, string>,
  ): SignalListCompoundSegment[] {
    const { orgName, spaceName } = CloudFoundryApplicationsSignalComponent.resolveOrgSpace(app, orgNames, spaceNames);
    const orgLink = app.orgGuid && orgName !== '—'
      ? ['/cloud-foundry', app.cnsiGuid, 'organizations', app.orgGuid]
      : undefined;
    const spaceLink = app.orgGuid && app.spaceGuid && spaceName !== '—'
      ? ['/cloud-foundry', app.cnsiGuid, 'organizations', app.orgGuid, 'spaces', app.spaceGuid]
      : undefined;
    return [
      { text: orgName, link: orgLink },
      { text: spaceName, link: spaceLink },
    ];
  }

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
