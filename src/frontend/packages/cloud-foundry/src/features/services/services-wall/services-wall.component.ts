import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, Signal, inject, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  ListSubNavAddAction,
  ListSubNavComponent,
  PageHeaderComponent,
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
} from '../../../cf-entity-types';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { DuplicateUrlBannerComponent } from '../../../shared/components/duplicate-url-banner/duplicate-url-banner.component';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { boundAppSegments, renderBoundApps } from '../../../shared/signal-list-configs/bound-apps-cell';
import type { StServiceInstance } from '../../../services/endpoint-data/stratos-types';

// Stratos Services Wall — multi-CNSI service instances list (managed +
// user-provided), foundation-wide.
//
// Mirrors ServiceCatalogPageComponent (the marketplace migration) and
// ApplicationWallComponent: MergeOrchestrator + ViewPipeline + signal
// config wiring + CF dropdown filter. Per-row write surface is
// Edit / Detach / Delete (Edit + Detach navigate to the existing
// /services/:type/:cnsi/:siGuid edit|detach routes); the L5 sub-nav
// hosts Add Service Instance. The row Name link keeps the existing
// /services/:type/:cnsi/:siGuid detail-page route.
@Component({
  selector: 'app-services-wall',
  templateUrl: './services-wall.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    SignalListComponent,
    ListSubNavComponent,
    CfEndpointsMissingComponent,
    DuplicateUrlBannerComponent,
  ],
  animations: [
    trigger('cardEnter', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
        ], { optional: true }),
      ]),
    ]),
  ],
  providers: [
    DatePipe,
  ],
})
export class ServicesWallComponent implements OnInit {
  cloudFoundryService = inject(CloudFoundryService);
  private instancesConfig = inject(CfServiceInstancesSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private router = inject(Router);

  public cfIds$: Observable<string[]>;
  public haveConnectedCf$: Observable<boolean>;

  // Row keys ({cnsiGuid}:{siGuid}) for service instances the user has
  // favorited. Either entity type qualifies — the legacy 481 UI used
  // separate favorite entityTypes for managed (`serviceInstance`) and
  // user-provided (`userProvidedServiceInstance`); we OR them so existing
  // favorites of either kind light up here.
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
    // Use the entity type that matches the instance's actual kind so the
    // favorite is keyed under the same bucket the legacy UI used.
    const entityType = si.type === 'user-provided'
      ? userProvidedServiceInstanceEntityType
      : serviceInstancesEntityType;
    const fav = new UserFavorite(si.cnsiGuid, 'cf', entityType, si.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  // Config for <app-signal-list>. Populated in ngOnInit once the signal
  // config has been initialized with the connected CF guids.
  public listConfig: WritableSignal<SignalListConfig<StServiceInstance> | undefined> = signal(undefined);
  // L5 sub-nav: unfiltered total + primary add action. Total is bound
  // post-initialize() once instancesConfig.view exists.
  public totalServiceInstances!: Signal<number>;
  public readonly createServiceInstanceAction: ListSubNavAddAction = {
    label: 'Add Service Instance',
    icon: 'add',
    invoke: () => this.router.navigateByUrl('/services/new'),
  };

  constructor() {
    this.cfIds$ = this.cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints
        .filter(endpoint => endpoint.connectionStatus === 'connected')
        .map(endpoint => endpoint.guid)
        .filter((guid): guid is string => !!guid),
      ),
    );
    this.haveConnectedCf$ = this.cloudFoundryService.connectedCFEndpoints$.pipe(
      map(endpoints => !!endpoints && endpoints.length > 0),
    );
  }

  async ngOnInit(): Promise<void> {
    const connected = await firstValueFrom(
      this.cloudFoundryService.connectedCFEndpoints$.pipe(
        filter(endpoints => !!endpoints),
        take(1),
      ),
    );
    const cnsiGuids = (connected ?? []).map(ep => ep.guid).filter((guid): guid is string => !!guid);
    this.instancesConfig.initialize(cnsiGuids);
    // Bind the L5 sub-nav count — view exists only after initialize().
    this.totalServiceInstances = this.instancesConfig.view.totalItems;

    const dropdowns: SignalListDropdown[] = [
      {
        label: 'Cloud Foundry',
        options: this.instancesConfig.cnsiOptions,
        selected: this.instancesConfig.selectedCnsi,
      },
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

    const renderCf = (si: StServiceInstance): string =>
      this.instancesConfig.endpointNames().get(si.cnsiGuid) ?? '—';

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
      ServicesWallComponent.formatDate(si.createdAt);

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
          // Land on the marketplace offering summary for managed instances;
          // user-provided instances have no offering so the name stays
          // plain text (signal-list renders `null` as non-link).
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
          header: 'Type', key: 'type', sortField: renderType,
          kind: 'pill',
          pillColor: typeColor,
          render: renderType,
          widthHint: '8rem',
        },
        {
          header: 'CF', key: 'cf', sortField: renderCf,
          kind: 'link',
          // Only link once the endpoint name resolves — mirrors the
          // marketplace's "no dead anchors during loading" rule.
          link: (si: StServiceInstance) =>
            renderCf(si) === '—' ? null : ['/cloud-foundry', si.cnsiGuid],
          render: renderCf,
          widthHint: '12rem',
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
      // Toolbar's "filter by:" dropdown swaps which column the text input targets.
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
    this.instancesConfig.registerSortExtractor('cf', renderCf);
    this.instancesConfig.registerFilterExtractor('name', (si: StServiceInstance) => si.name ?? '');
    this.instancesConfig.registerFilterExtractor('service', renderService);
    this.instancesConfig.registerFilterExtractor('tags', renderTags);

    if (cnsiGuids.length > 0) {
      void this.instancesConfig.loadAll();
    }
  }

  private buildInstanceActions = (si: StServiceInstance): readonly SignalListRowAction<StServiceInstance>[] => {
    const runAction = async (label: string, op: () => Promise<void>) => {
      try {
        await op();
      } catch (err: any) {
        this.snackBar.error(`${label} failed: ${err?.message ?? err}`);
      }
    };
    // The wall mixes managed and user-provided instances, so the
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
      // Service keys are broker-mediated, so only managed instances get the
      // action; user-provided instances have no keys.
      ...(si.type === 'user-provided' ? [] : [{
        label: 'Service Keys', icon: 'vpn_key',
        invoke: () => {
          void this.router.navigate(['/services', siType, si.cnsiGuid, si.guid, 'keys']);
        },
      }]),
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
