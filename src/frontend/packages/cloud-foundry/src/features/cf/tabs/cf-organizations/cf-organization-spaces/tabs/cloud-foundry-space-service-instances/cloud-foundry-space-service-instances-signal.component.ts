import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, WritableSignal, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListPillColor,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';
import { UserFavorite, UserFavoriteManager } from '@stratosui/store';

import { serviceInstancesEntityType } from '../../../../../../../cf-entity-types';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions-checkers';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../../../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { boundAppSegments, renderBoundApps } from '../../../../../../../shared/signal-list-configs/bound-apps-cell';
import { buildServiceInstanceRowActions } from '../../../../../../../shared/signal-list-configs/service-instance/service-instance-row-actions';
import type { StServiceInstance } from '../../../../../../../services/endpoint-data/stratos-types';

// Scoped to one space under one org under one CF endpoint. Reuses the wall's
// CfServiceInstancesSignalConfigService via initializeForSpace, narrowed to
// type='managed' so user-provided instances live on the sibling tab.
//
// Columns trim the wall's shape:
// - No Type pill (every row here is Managed by definition).
// - No CF column or filter dropdown (single CNSI).
// - No Org/Space column (the user is already inside one space tab).
// Filterable column is Name only.
@Component({
  selector: 'app-cloud-foundry-space-service-instances-signal',
  templateUrl: './cloud-foundry-space-service-instances-signal.component.html',
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
export class CloudFoundrySpaceServiceInstancesSignalComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  cfSpaceService = inject(CloudFoundrySpaceService);
  private instancesConfig = inject(CfServiceInstancesSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private router = inject(Router);
  private permissionsService = inject(CurrentUserPermissionsService);

  /** Unfiltered total for the L5 sub-nav count. Bound in the constructor
   *  after initializeForSpace() creates the view. */
  public totalServiceInstances!: Signal<number>;

  /** Gate the Add button on space-scoped SERVICE_INSTANCE_CREATE
   *  (SPACE_DEVELOPER). Built here in the injection context so toSignal()
   *  resolves. */
  public readonly canCreateServiceInstance: Signal<boolean> = toSignal(
    this.permissionsService.can(
      CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE,
      this.cfEndpointService.cfGuid,
      this.cfSpaceService.spaceGuid,
    ),
    { initialValue: false },
  );

  /** L5 primary action — opens the add-service-instance wizard straight to
   *  the Managed Service path (this tab is managed-only), pre-selecting this
   *  CF via the `auto-select-endpoint` hint. Org/space are chosen in the
   *  wizard (no query-param pre-selection for those). */
  public readonly createServiceInstanceAction: ListSubNavAddAction = {
    label: 'Add Service Instance',
    icon: 'add',
    visible: this.canCreateServiceInstance,
    invoke: () => this.router.navigate(['/services/new/service'],
      { queryParams: { 'auto-select-endpoint': this.cfEndpointService.cfGuid } }),
  };

  // Favorite keys in rowKey format (${cnsi}:${siGuid}) for managed
  // service-instance favorites only. The wall ORs both managed and
  // user-provided entity types because either kind shows up there;
  // here we narrow to the managed bucket since the page is too.
  private readonly favoriteRowKeys: Signal<ReadonlySet<string>> = toSignal(
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
            if (fav.entityType === serviceInstancesEntityType) {
              out.add(`${fav.endpointId}:${fav.entityId}`);
            }
          }
        }
        return out;
      }),
    ),
    { initialValue: new Set<string>() },
  );

  public listConfig: WritableSignal<SignalListConfig<StServiceInstance> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const spaceGuid = this.cfSpaceService.spaceGuid;
    this.instancesConfig.initializeForSpace(cfGuid, spaceGuid, 'managed');
    // view exists only after initializeForSpace(). Use the filtered count:
    // the space + managed scope is applied via the filter predicate, so
    // totalItems would report the CNSI-wide total, not this page's scope.
    this.totalServiceInstances = this.instancesConfig.view.totalFilteredResults;

    const renderService = (si: StServiceInstance): string => si.servicePlan?.serviceOffering?.name ?? '';

    const renderTags = (si: StServiceInstance): string => {
      const tags = si.tags ?? [];
      return tags.length === 0 ? '—' : tags.join(', ');
    };

    const renderLastOp = (si: StServiceInstance): string => si.lastOperation.state ?? '';

    const lastOpColor = (si: StServiceInstance): SignalListPillColor => {
      const state = (si.lastOperation.state ?? '').toLowerCase();
      if (state === 'succeeded') return 'success';
      if (state === 'in progress') return 'warning';
      if (state === 'failed') return 'danger';
      return 'neutral';
    };

    const renderCreated = (si: StServiceInstance): string =>
      CloudFoundrySpaceServiceInstancesSignalComponent.formatDate(si.createdAt);

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
          // Same legacy detail-page route as the wall — that detail page
          // stays untouched in this migration.
          link: (si: StServiceInstance) => ['/services', 'managed', si.cnsiGuid, si.guid],
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
          header: 'Attached Apps', key: 'boundApps', sortField: renderBoundApps,
          kind: 'compound',
          compound: boundAppSegments,
          render: renderBoundApps,
          widthHint: '14rem',
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
          header: '', key: 'favorite',
          kind: 'favorite',
          favorite: {
            keys: this.favoriteRowKeys,
            toggle: (si: StServiceInstance) => this.toggleFavorite(si),
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
      emptyMessage: 'There are no service instances in this space',
      emptyFilterMessage: 'No service instances match the current filters',
      loadingMessage: 'Loading service instances…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.instancesConfig.nameFilter,
      onRefresh: () => this.instancesConfig.refresh(),
      onClear: () => this.instancesConfig.clearFilters(),
      viewMode: this.instancesConfig.viewMode,
      sort: this.instancesConfig.sort,
    });

    this.instancesConfig.registerSortExtractor('service', renderService);
    this.instancesConfig.registerSortExtractor('lastOp', renderLastOp);
    this.instancesConfig.registerSortExtractor('tags', renderTags);
    this.instancesConfig.registerFilterExtractor('name', (si: StServiceInstance) => si.name ?? '');

    void this.instancesConfig.loadAll();
  }

  private toggleFavorite(si: StServiceInstance): void {
    const fav = new UserFavorite(si.cnsiGuid, 'cf', serviceInstancesEntityType, si.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  // Per-row Edit / Detach / Delete. Restores the V2-era Edit + Detach
  // actions from cf-service-instances-list-config.base that the
  // signal-native migration dropped (catalog 2026-05-26 Space-scope row).
  // Every row on this tab is managed (page is scoped via
  // initializeForSpace + type='managed'), so siType is always 'service'.
  private buildInstanceActions = (si: StServiceInstance): readonly SignalListRowAction<StServiceInstance>[] =>
    buildServiceInstanceRowActions(si, {
      router: this.router,
      confirmDialog: this.confirmDialog,
      snackBar: this.snackBar,
      deleteServiceInstance: (cnsiGuid, guid) => this.instancesConfig.deleteServiceInstance(cnsiGuid, guid),
      isOfferingBindable: (si) => this.instancesConfig.isOfferingBindable(si),
    });

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
