import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, Signal, inject, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import {
  PageHeaderComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListDropdown,
} from '@stratosui/core';
import { UserFavorite, UserFavoriteManager } from '@stratosui/store';
import { serviceEntityType } from '../../../cf-entity-types';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { DuplicateUrlBannerComponent } from '../../../shared/components/duplicate-url-banner/duplicate-url-banner.component';
import {
  CfServiceOfferingsSignalConfigService,
} from '../../../shared/components/list/list-types/service-offering/cf-service-offerings-signal-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import type { StServiceOffering } from '../../../services/endpoint-data/stratos-types';

// Stratos Marketplace — multi-CNSI service offerings catalog.
//
// Mirrors ApplicationWallComponent's MergeOrchestrator + ViewPipeline + signal
// config wiring. Read-only list (no kebab actions); detail navigation goes
// to the existing /marketplace/:cnsi/:offeringGuid page (which still uses
// the legacy ngrx ListConfig today and is out of scope for this migration).
@Component({
  selector: 'app-service-catalog-page',
  templateUrl: './service-catalog-page.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    SignalListComponent,
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
export class ServiceCatalogPageComponent implements OnInit {
  cloudFoundryService = inject(CloudFoundryService);
  private offeringsConfig = inject(CfServiceOfferingsSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private router = inject(Router);

  public cfIds$: Observable<string[]>;
  public haveConnectedCf$: Observable<boolean>;

  // Row keys ({cnsiGuid}:{offeringGuid}) for service offerings the user has
  // favorited. Mirrors the app-wall pattern exactly — derived from
  // UserFavoriteManager's combined (groups, entities) stream and exposed
  // as a Signal so SignalListColumn.favorite can subscribe directly. The
  // legacy 481 catalog page used the same `serviceEntityType = 'service'`
  // key, so existing favorites carry over.
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

  // Config for <app-signal-list>. Populated in ngOnInit once the signal
  // config has been initialized with the connected CF guids. Using a
  // WritableSignal so assignment triggers change detection under OnPush.
  public listConfig: WritableSignal<SignalListConfig<StServiceOffering> | undefined> = signal(undefined);

  constructor() {
    this.cfIds$ = this.cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints
        .filter(endpoint => endpoint.connectionStatus === 'connected')
        .map(endpoint => endpoint.guid),
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
    const cnsiGuids = (connected ?? []).map(ep => ep.guid);
    this.offeringsConfig.initialize(cnsiGuids);

    const dropdowns: SignalListDropdown[] = [
      {
        label: 'Cloud Foundry',
        options: this.offeringsConfig.cnsiOptions,
        selected: this.offeringsConfig.selectedCnsi,
      },
    ];

    const renderTags = (o: StServiceOffering): string =>
      (o.tags ?? []).join(', ');
    const renderCf = (o: StServiceOffering): string =>
      this.offeringsConfig.endpointNames().get(o.cnsiGuid) ?? '—';

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
          // Long descriptions get truncated by the cell template's title-attr
          // overflow handling; the widthHint keeps the column from devouring
          // the row when a broker emits a wall-of-text description.
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
          header: 'CF', key: 'cf', sortField: renderCf,
          kind: 'link',
          // Only link once the endpoint name resolves — mirrors app-wall's
          // "no dead anchors during loading" rule.
          link: (o: StServiceOffering) =>
            renderCf(o) === '—' ? null : ['/cloud-foundry', o.cnsiGuid],
          render: renderCf,
          widthHint: '12rem',
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
      // Filter columns enable the toolbar's "filter by:" dropdown so the
      // text input can target Name, Description, Tags, or Broker.
      filterColumns: ['name', 'description', 'tags', 'broker'],
      filterField: this.offeringsConfig.filterField,
      filterDropdowns: dropdowns,
      headerActions: [
        {
          label: 'Add Service Instance',
          icon: 'add',
          primary: true,
          dataTest: 'add-service-instance',
          // Marketplace lists managed offerings, so default to the managed
          // path. The tile chooser at /services/new offers UPS too if the
          // user navigates back, but skipping it on this page shaves a step.
          run: () => this.router.navigateByUrl('/services/new/service'),
        },
      ],
      onRefresh: () => this.offeringsConfig.refresh(),
      onClear: () => this.offeringsConfig.clearFilters(),
      viewMode: this.offeringsConfig.viewMode,
      sort: this.offeringsConfig.sort,
    });

    this.offeringsConfig.registerSortExtractor('tags', renderTags);
    this.offeringsConfig.registerSortExtractor('cf', renderCf);
    this.offeringsConfig.registerFilterExtractor('name', (o: StServiceOffering) => o.name ?? '');
    this.offeringsConfig.registerFilterExtractor('description', (o: StServiceOffering) => o.description ?? '');
    this.offeringsConfig.registerFilterExtractor('tags', renderTags);
    this.offeringsConfig.registerFilterExtractor('broker', (o: StServiceOffering) => o.broker?.name ?? '');

    if (cnsiGuids.length > 0) {
      void this.offeringsConfig.loadAll();
    }
  }
}
