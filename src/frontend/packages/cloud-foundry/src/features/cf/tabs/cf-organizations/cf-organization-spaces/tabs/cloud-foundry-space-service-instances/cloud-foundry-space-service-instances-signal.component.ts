import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, WritableSignal, inject, signal } from '@angular/core';
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
import { UserFavorite, UserFavoriteManager } from '@stratosui/store';

import { serviceInstancesEntityType } from '../../../../../../../cf-entity-types';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../../../../../shared/components/list/list-types/service-instance/cf-service-instances-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
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
  styleUrls: ['./cloud-foundry-space-service-instances-signal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
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

  private buildInstanceActions = (si: StServiceInstance): readonly SignalListRowAction<StServiceInstance>[] => {
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
