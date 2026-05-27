import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, Signal, WritableSignal, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListDropdown,
} from '@stratosui/core';
import { UserFavorite, UserFavoriteManager } from '@stratosui/store';

import { serviceEntityType } from '../../../../cf-entity-types';
import {
  CfServiceOfferingsSignalConfigService,
} from '../../../../shared/components/list/list-types/service-offering/cf-service-offerings-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StServiceOffering } from '../../../../services/endpoint-data/stratos-types';

// Per-CF Marketplace tab. Single-CNSI variant of the top-level Marketplace
// page (ServiceCatalogPageComponent). The CF dropdown is hidden — the URL
// already pins the CNSI via the parent CloudFoundryEndpointService — and
// every column / sort / filter wiring otherwise mirrors the multi-CNSI
// page. Reads the same singleton signal config; initialize() is keyed by
// cnsi-set so the wall and the per-CF tab don't fight over scope.
@Component({
  selector: 'app-cloud-foundry-marketplace-signal',
  templateUrl: './cloud-foundry-marketplace-signal.component.html',
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
export class CloudFoundryMarketplaceSignalComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private offeringsConfig = inject(CfServiceOfferingsSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private router = inject(Router);
  private permissionsService = inject(CurrentUserPermissionsService);

  /** Total offering count for the L5 sub-nav. */
  public totalServiceOfferings!: Signal<number>;
  /** Reactive permission flag for the Add Service Instance button. Built
   *  in the constructor (injection context) so toSignal() resolves. */
  public readonly canCreateServiceInstance: Signal<boolean> = toSignal(
    this.permissionsService.can(CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE, this.cfEndpointService.cfGuid),
    { initialValue: false },
  );
  /** L5 primary action — navigates to the add-service-instance wizard
   *  with the managed-service tile pre-selected (the marketplace context
   *  already implies a managed-broker flow). Forwards the cnsi as an
   *  `auto-select-endpoint` query param so the wizard can pre-select
   *  this CF in its first step. */
  public readonly createServiceInstanceAction: ListSubNavAddAction = {
    label: 'Add Service Instance',
    icon: 'add',
    visible: this.canCreateServiceInstance,
    invoke: () => this.router.navigate(['/services/new/service'],
      { queryParams: { 'auto-select-endpoint': this.cfEndpointService.cfGuid } }),
  };

  private readonly favoriteOfferingRowKeys: Signal<ReadonlySet<string>> = toSignal(
    this.userFavoriteManager.getAllFavorites().pipe(
      map(([groups, entities]) => {
        const out = new Set<string>();
        if (!groups || !entities) return out;
        for (const epFavGuid in groups) {
          const g = groups[epFavGuid];
          if (!g?.entitiesIds) continue;
          for (const favId of g.entitiesIds) {
            const fav = entities[favId];
            if (fav && fav.entityType === serviceEntityType && fav.endpointType === 'cf') {
              out.add(`${fav.endpointId}:${fav.entityId}`);
            }
          }
        }
        return out;
      }),
    ),
    { initialValue: new Set<string>() },
  );

  private toggleOfferingFavorite(o: StServiceOffering): void {
    const fav = new UserFavorite(o.cnsiGuid, 'cf', serviceEntityType, o.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  public listConfig: WritableSignal<SignalListConfig<StServiceOffering> | undefined> = signal(undefined);

  async ngOnInit(): Promise<void> {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.offeringsConfig.initialize([cfGuid]);
    this.totalServiceOfferings = this.offeringsConfig.view.totalItems;
    // CNSI is pre-chosen by the URL — show the dropdown but disable it so
    // the scope is visible and can't drift.
    this.offeringsConfig.selectedCnsi.set(cfGuid);
    const cnsiLocked: Signal<boolean> = signal(true).asReadonly();
    const dropdowns: SignalListDropdown[] = [
      {
        label: 'Cloud Foundry',
        options: this.offeringsConfig.cnsiOptions,
        selected: this.offeringsConfig.selectedCnsi,
        disabled: cnsiLocked,
      },
    ];

    const renderTags = (o: StServiceOffering): string =>
      (o.tags ?? []).join(', ');

    this.listConfig.set({
      pagedItems: this.offeringsConfig.view.pagedItems,
      totalFilteredResults: this.offeringsConfig.view.totalFilteredResults,
      totalPages: this.offeringsConfig.view.totalPages,
      pageIndex: this.offeringsConfig.pageIndex,
      pageSize: this.offeringsConfig.pageSize,
      isAnyLoading: this.offeringsConfig.orchestrator.isAnyLoading,
      errorsByCnsi: this.offeringsConfig.orchestrator.errorsByCnsi,
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'link',
          link: (o: StServiceOffering) => ['/marketplace', o.cnsiGuid, o.guid],
          render: (o: StServiceOffering) => o.name,
          widthHint: '14rem',
        },
        {
          header: 'Description', key: 'description', sortField: 'description',
          render: (o: StServiceOffering) => o.description ?? '',
          widthHint: '24rem',
        },
        {
          header: 'Broker', key: 'broker',
          sortField: (o: StServiceOffering) => o.broker?.name ?? '',
          render: (o: StServiceOffering) => o.broker?.name ?? '',
          widthHint: '12rem',
        },
        {
          header: 'Tags', key: 'tags', sortField: renderTags,
          render: renderTags,
          widthHint: '14rem',
        },
        {
          header: '', key: 'favorite',
          kind: 'favorite',
          favorite: {
            keys: this.favoriteOfferingRowKeys,
            toggle: (o: StServiceOffering) => this.toggleOfferingFavorite(o),
          },
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (o: StServiceOffering) => `${o.cnsiGuid}:${o.guid}`,
      emptyMessage: 'There are no services',
      emptyFilterMessage: 'No services match the current filters',
      loadingMessage: 'Loading services…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.offeringsConfig.nameFilter,
      filterColumns: ['name', 'description', 'tags', 'broker'],
      filterField: this.offeringsConfig.filterField,
      filterDropdowns: dropdowns,
      onRefresh: () => this.offeringsConfig.refresh(),
      onClear: () => this.offeringsConfig.clearFilters(),
      viewMode: this.offeringsConfig.viewMode,
      sort: this.offeringsConfig.sort,
    });

    this.offeringsConfig.registerSortExtractor('tags', renderTags);
    this.offeringsConfig.registerFilterExtractor('name', (o: StServiceOffering) => o.name ?? '');
    this.offeringsConfig.registerFilterExtractor('description', (o: StServiceOffering) => o.description ?? '');
    this.offeringsConfig.registerFilterExtractor('tags', renderTags);
    this.offeringsConfig.registerFilterExtractor('broker', (o: StServiceOffering) => o.broker?.name ?? '');

    void this.offeringsConfig.loadAll();
  }
}
