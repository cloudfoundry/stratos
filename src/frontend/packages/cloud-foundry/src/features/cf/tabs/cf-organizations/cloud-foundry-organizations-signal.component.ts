import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@stratosui/store';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListColumn,
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

import { CfOrgsSignalConfigService } from '../../../../shared/components/list/list-types/org/cf-orgs-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StOrg } from '../../../../services/endpoint-data/stratos-types';

// Signal-native replacement for CloudFoundryOrganizationsComponent. Reuses
// SignalListComponent + the app-wall column-kind vocabulary (link, dot,
// favorite, actions) so the visual language stays consistent with apps.
// The underlying data source is the existing EndpointDataService (via
// CfOrgsSignalConfigService) — no new Jetstream reads needed; the home-
// page parallelization work already populates full orgs + spaces signals.
@Component({
  selector: 'app-cloud-foundry-organizations-signal',
  templateUrl: './cloud-foundry-organizations-signal.component.html',
  styleUrls: ['./cloud-foundry-organizations-signal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ListSubNavComponent,
    SignalListComponent,
  ],
})
export class CloudFoundryOrganizationsSignalComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private store = inject<Store<any>>(Store);
  private orgsConfig = inject(CfOrgsSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);

  // Favorite keys in rowKey format (${cnsiGuid}:${orgGuid}). Mirrors the
  // app-wall treatment: read the favorites store once, rebuild the set
  // on every change, and the star cells re-render via OnPush.
  private readonly favoriteOrgRowKeys: Signal<ReadonlySet<string>> = toSignal(
    this.userFavoriteManager.getAllFavorites().pipe(
      map(([groups, entities]) => {
        const out = new Set<string>();
        if (!groups || !entities) return out;
        for (const epFavGuid in groups) {
          const g = groups[epFavGuid];
          if (!g?.entitiesIds) continue;
          for (const favId of g.entitiesIds) {
            const fav = entities[favId];
            if (fav && fav.entityType === 'organization' && fav.endpointType === 'cf') {
              out.add(`${fav.endpointId}:${fav.entityId}`);
            }
          }
        }
        return out;
      }),
    ),
    { initialValue: new Set<string>() },
  );

  public listConfig: WritableSignal<SignalListConfig<StOrg> | undefined> = signal(undefined);

  /** Total org count for the L5 sub-nav. Assigned in the constructor
   *  once orgsConfig.initialize() has populated `view`. */
  public totalOrganizations!: Signal<number>;

  /** Reactive permission flag for the L5 button. Mirrors the legacy
   *  `*appCfUserPermission="canAddOrg"` gate that was lost when this
   *  page was migrated to signal-list — the legacy template asked the
   *  same question via `canAddOrg$ | async`. */
  public canCreateOrganization!: Signal<boolean>;

  /** L5 primary action — navigates to the add-org stepper. */
  public createOrgAction!: ListSubNavAddAction;

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const router = inject(Router);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    this.orgsConfig.initialize(cfGuid);
    (this as { totalOrganizations: Signal<number> }).totalOrganizations =
      this.orgsConfig.view.totalFilteredResults;
    this.canCreateOrganization = toSignal(
      currentUserPermissionsService.can(CfCurrentUserPermissions.ORGANIZATION_CREATE, cfGuid),
      { initialValue: false },
    );
    this.createOrgAction = {
      label: 'Create Organization',
      icon: 'add',
      visible: this.canCreateOrganization,
      invoke: () => router.navigate(['/cloud-foundry', cfGuid, 'add-org']),
    };

    const statusColor = (org: StOrg): SignalListPillColor => {
      const s = (org.status ?? '').toLowerCase();
      if (s === 'active') return 'success';
      if (s === 'suspended') return 'warning';
      return 'neutral';
    };
    const statusLabel = (org: StOrg): string => {
      const s = (org.status ?? '').toLowerCase();
      if (s === 'active') return 'Active';
      if (s === 'suspended') return 'Suspended';
      return org.status ?? '—';
    };
    const renderSpaces = (org: StOrg): string => {
      if (!this.orgsConfig.hasLoadedOnce()) return '—';
      const count = this.orgsConfig.spaceCountByOrgGuid().get(org.guid) ?? 0;
      return String(count);
    };

    this.listConfig.set({
      pagedItems: this.orgsConfig.view.pagedItems,
      totalFilteredResults: this.orgsConfig.view.totalFilteredResults,
      totalPages: this.orgsConfig.view.totalPages,
      pageIndex: this.orgsConfig.pageIndex,
      pageSize: this.orgsConfig.pageSize,
      isAnyLoading: computed(() => !this.orgsConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'link',
          link: (o: StOrg) => ['/cloud-foundry', cfGuid, 'organizations', o.guid],
          render: (o: StOrg) => o.name,
          widthHint: '20rem',
        },
        {
          header: 'Status', key: 'status', sortField: 'status',
          kind: 'dot',
          pillColor: statusColor,
          render: statusLabel,
          widthHint: '10rem',
        },
        {
          header: 'Spaces', key: 'spaces', sortField: renderSpaces,
          render: renderSpaces,
          widthHint: '7rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (o: StOrg) => CloudFoundryOrganizationsSignalComponent.formatDate(o.createdAt),
          widthHint: '12rem',
        },
        {
          header: '', key: 'favorite',
          kind: 'favorite',
          favorite: {
            keys: this.favoriteOrgRowKeys,
            toggle: (o: StOrg) => this.toggleOrgFavorite(o),
          },
          render: () => '',
          widthHint: '3rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: this.buildOrgActions,
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (o: StOrg) => `${o.cnsiGuid}:${o.guid}`,
      emptyMessage: 'There are no organizations',
      emptyFilterMessage: 'No organizations match the current filters',
      loadingMessage: 'Loading organizations…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.orgsConfig.nameFilter,
      onRefresh: () => this.orgsConfig.refresh(),
      onClear: () => this.orgsConfig.clearFilters(),
      cardAccentColor: statusColor,
      viewMode: this.orgsConfig.viewMode,
      sort: this.orgsConfig.sort,
    });

    this.orgsConfig.registerSortExtractor('spaces', (o: StOrg) => {
      return this.orgsConfig.spaceCountByOrgGuid().get(o.guid) ?? 0;
    });
  }

  private toggleOrgFavorite(org: StOrg): void {
    const fav = new UserFavorite(org.cnsiGuid, 'cf', 'organization', org.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  private buildOrgActions = (org: StOrg): readonly SignalListRowAction<StOrg>[] => {
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
            'Delete Organization',
            `Are you sure you want to delete "${org.name}"? This cannot be undone and will remove all spaces, apps, and routes within it.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await runAction('Delete', () => this.orgsConfig.deleteOrg(org.cnsiGuid, org.guid));
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
