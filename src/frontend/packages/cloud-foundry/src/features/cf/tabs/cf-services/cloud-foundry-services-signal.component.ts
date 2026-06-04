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
  SignalListComponent,
  SignalListConfig,
  SignalListDropdown,
  SignalListPillColor,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';
import { UserFavorite, UserFavoriteManager } from '@stratosui/store';

import {
  serviceInstancesEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../cf-entity-types';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StServiceInstance } from '../../../../services/endpoint-data/stratos-types';

// Per-CF Services tab. Single-CNSI variant of the top-level Services Wall.
// CF dropdown hidden — URL pins the CNSI; the rest of the column / sort /
// filter wiring mirrors the multi-CNSI page.
@Component({
  selector: 'app-cloud-foundry-services-signal',
  templateUrl: './cloud-foundry-services-signal.component.html',
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
export class CloudFoundryServicesSignalComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private instancesConfig = inject(CfServiceInstancesSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private router = inject(Router);
  private permissionsService = inject(CurrentUserPermissionsService);

  /** Total service-instance count for the L5 sub-nav. */
  public totalServiceInstances!: Signal<number>;
  /** Reactive permission flag for the Add Service Instance button. Built
   *  in the constructor (injection context) so toSignal() resolves. */
  public readonly canCreateServiceInstance: Signal<boolean> = toSignal(
    this.permissionsService.can(CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE, this.cfEndpointService.cfGuid),
    { initialValue: false },
  );
  /** L5 primary action — navigates to the add-service-instance wizard's
   *  type selector (Managed Service vs User Provided). Forwards the cnsi
   *  as `auto-select-endpoint` so the wizard can pre-select this CF. */
  public readonly createServiceInstanceAction: ListSubNavAddAction = {
    label: 'Add Service Instance',
    icon: 'add',
    visible: this.canCreateServiceInstance,
    invoke: () => this.router.navigate(['/services/new'],
      { queryParams: { 'auto-select-endpoint': this.cfEndpointService.cfGuid } }),
  };

  private readonly favoriteInstanceRowKeys: Signal<ReadonlySet<string>> = toSignal(
    this.userFavoriteManager.getAllFavorites().pipe(
      map(([groups, entities]) => {
        const out = new Set<string>();
        if (!groups || !entities) return out;
        for (const epFavGuid in groups) {
          const g = groups[epFavGuid];
          if (!g?.entitiesIds) continue;
          for (const favId of g.entitiesIds) {
            const fav = entities[favId];
            if (!fav || fav.endpointType !== 'cf') continue;
            if (fav.entityType === serviceInstancesEntityType
              || fav.entityType === userProvidedServiceInstanceEntityType) {
              out.add(`${fav.endpointId}:${fav.entityId}`);
            }
          }
        }
        return out;
      }),
    ),
    { initialValue: new Set<string>() },
  );

  private toggleInstanceFavorite(si: StServiceInstance): void {
    const entityType = si.type === 'user-provided'
      ? userProvidedServiceInstanceEntityType
      : serviceInstancesEntityType;
    const fav = new UserFavorite(si.cnsiGuid, 'cf', entityType, si.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  public listConfig: WritableSignal<SignalListConfig<StServiceInstance> | undefined> = signal(undefined);

  async ngOnInit(): Promise<void> {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.instancesConfig.initialize([cfGuid]);
    this.totalServiceInstances = this.instancesConfig.view.totalItems;
    // CNSI is pre-chosen by the URL. Pin the selection so the Org/Space
    // options stay scoped to this CF, but don't show a (locked) Cloud Foundry
    // dropdown — the CF is already named in the breadcrumb. Show just the
    // interactive Org/Space filters.
    this.instancesConfig.selectedCnsi.set(cfGuid);
    const dropdowns: SignalListDropdown[] = [
      {
        label: 'Organization',
        options: this.instancesConfig.orgOptions,
        selected: this.instancesConfig.selectedOrg,
        loading: this.instancesConfig.isLoadingOrgs,
      },
      {
        label: 'Space',
        options: this.instancesConfig.spaceOptions,
        selected: this.instancesConfig.selectedSpace,
        loading: this.instancesConfig.isLoadingSpaces,
      },
    ];

    const renderService = (si: StServiceInstance): string =>
      si.type === 'user-provided'
        ? 'User Provided'
        : (si.servicePlan?.serviceOffering?.name ?? '');

    const renderTags = (si: StServiceInstance): string => {
      const tags = si.tags ?? [];
      return tags.length === 0 ? '—' : tags.join(', ');
    };

    const renderType = (si: StServiceInstance): string =>
      si.type === 'user-provided' ? 'User Provided' : 'Managed';

    const typeColor = (si: StServiceInstance): SignalListPillColor =>
      si.type === 'user-provided' ? 'warning' : 'neutral';

    const renderLastOp = (si: StServiceInstance): string =>
      si.lastOperation.state ?? '';

    const lastOpColor = (si: StServiceInstance): SignalListPillColor => {
      const state = (si.lastOperation.state ?? '').toLowerCase();
      if (state === 'succeeded') return 'success';
      if (state === 'in progress') return 'warning';
      if (state === 'failed') return 'danger';
      return 'neutral';
    };

    const renderCreated = (si: StServiceInstance): string =>
      CloudFoundryServicesSignalComponent.formatDate(si.createdAt);

    this.listConfig.set({
      pagedItems: this.instancesConfig.view.pagedItems,
      totalFilteredResults: this.instancesConfig.view.totalFilteredResults,
      totalPages: this.instancesConfig.view.totalPages,
      pageIndex: this.instancesConfig.pageIndex,
      pageSize: this.instancesConfig.pageSize,
      isAnyLoading: this.instancesConfig.orchestrator.isAnyLoading,
      errorsByCnsi: this.instancesConfig.orchestrator.errorsByCnsi,
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'link',
          link: (si: StServiceInstance) => {
            const offeringGuid = si.servicePlan?.serviceOffering?.guid;
            if (!offeringGuid) return null;
            return ['/marketplace', si.cnsiGuid, offeringGuid, 'summary'];
          },
          render: (si: StServiceInstance) => si.name,
          widthHint: '14rem',
        },
        {
          header: 'Service', key: 'service', sortField: renderService,
          render: renderService,
          widthHint: '12rem',
        },
        {
          header: 'Last Operation', key: 'lastOp', sortField: renderLastOp,
          kind: 'pill',
          pillColor: lastOpColor,
          render: renderLastOp,
          widthHint: '10rem',
        },
        {
          header: 'Tags', key: 'tags', sortField: renderTags,
          render: renderTags,
          widthHint: '14rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: renderCreated,
          widthHint: '12rem',
        },
        {
          header: 'Type', key: 'type', sortField: renderType,
          kind: 'pill',
          pillColor: typeColor,
          render: renderType,
          widthHint: '8rem',
        },
        {
          header: '', key: 'favorite',
          kind: 'favorite',
          favorite: {
            keys: this.favoriteInstanceRowKeys,
            toggle: (si: StServiceInstance) => this.toggleInstanceFavorite(si),
          },
          render: () => '',
          widthHint: '3rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: this.buildInstanceActions,
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (si: StServiceInstance) => `${si.cnsiGuid}:${si.guid}`,
      emptyMessage: 'There are no service instances',
      emptyFilterMessage: 'No service instances match the current filters',
      loadingMessage: 'Loading service instances…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.instancesConfig.nameFilter,
      filterColumns: ['name', 'service', 'tags'],
      filterField: this.instancesConfig.filterField,
      filterDropdowns: dropdowns,
      onRefresh: () => this.instancesConfig.refresh(),
      onClear: () => this.instancesConfig.clearFilters(),
      viewMode: this.instancesConfig.viewMode,
      sort: this.instancesConfig.sort,
    });

    this.instancesConfig.registerSortExtractor('service', renderService);
    this.instancesConfig.registerSortExtractor('lastOp', renderLastOp);
    this.instancesConfig.registerSortExtractor('tags', renderTags);
    this.instancesConfig.registerSortExtractor('type', renderType);
    this.instancesConfig.registerFilterExtractor('name', (si: StServiceInstance) => si.name ?? '');
    this.instancesConfig.registerFilterExtractor('service', renderService);
    this.instancesConfig.registerFilterExtractor('tags', renderTags);

    void this.instancesConfig.loadAll();
  }

  private buildInstanceActions = (si: StServiceInstance): readonly SignalListRowAction<StServiceInstance>[] => {
    const runAction = async (label: string, op: () => Promise<void>) => {
      try {
        await op();
      } catch (err: any) {
        this.snackBar.error(`${label} failed: ${err?.message ?? err}`);
      }
    };
    // This surface mixes managed and user-provided instances, so the
    // edit/detach route's :type segment branches on the row kind:
    // 'service' for managed, 'user-service' for user-provided. Mirrors
    // the per-space tabs that already restored Edit + Detach.
    const siType = si.type === 'user-provided' ? 'user-service' : 'service';
    return [
      {
        label: 'Edit', icon: 'edit',
        invoke: () => {
          void this.router.navigate(['/services', siType, si.cnsiGuid, si.guid, 'edit']);
        },
      },
      {
        label: 'Detach', icon: 'link_off',
        invoke: () => {
          void this.router.navigate(['/services', siType, si.cnsiGuid, si.guid, 'detach']);
        },
      },
      {
        label: 'Delete', icon: 'delete', danger: true,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Delete Service Instance',
            `Delete the service instance "${si.name}"? This cannot be undone and will detach any apps bound to it.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await runAction('Delete', () =>
              this.instancesConfig.deleteServiceInstance(si.cnsiGuid, si.guid));
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
