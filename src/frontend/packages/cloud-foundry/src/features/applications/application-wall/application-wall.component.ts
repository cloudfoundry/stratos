import { animate, query, style, transition, trigger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, firstValueFrom } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import {
  PageHeaderComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListDropdown,
  SignalListPillColor,
} from '@stratosui/core';
import { EndpointModel, getFullEndpointApiUrl } from '@stratosui/store';
import { CFAppState } from '../../../cf-app-state';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CfAppsSignalConfigService } from '../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CfUserPermissionDirective } from '../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { goToAppWall } from '../../cf/cf.helpers';
import type { StApp } from '../../../services/endpoint-data/stratos-types';

@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    SignalListComponent,
    CfEndpointsMissingComponent,
    CfUserPermissionDirective
  ],
  animations: [
    trigger(
      'cardEnter', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ], { optional: true })
      ])
    ]
    )
  ],
  providers: [
    DatePipe,
  ]
})
export class ApplicationWallComponent implements OnInit {
  cloudFoundryService = inject(CloudFoundryService);
  private store = inject<Store<CFAppState>>(Store);
  private appsConfig = inject(CfAppsSignalConfigService);

  public cfIds$!: Observable<string[]>;

  public canCreateApplication!: string;

  public haveConnectedCf$!: Observable<boolean>;

  // Count of endpoints that share a URL with another connected CF, or null when
  // all URLs are distinct. Drives an informational banner so operators know
  // multiple endpoints are registered against the same foundation (different
  // auth contexts). Under FWT-934 composite keys this is no longer a *warning*
  // about scoping — apps/orgs from each connection coexist in the store — but
  // the shared-URL fact itself is still useful context.
  public duplicateEndpointCount$!: Observable<number | null>;

  // Config for <app-signal-list>. Populated in ngOnInit after the signal
  // config service is initialized with the connected CF GUIDs. Using a
  // WritableSignal so assignment triggers change detection under OnPush.
  public listConfig: WritableSignal<SignalListConfig<StApp> | undefined> = signal(undefined);

  private redirected = false;

  constructor() {
    const cloudFoundryService = this.cloudFoundryService;
    const activatedRoute = inject(ActivatedRoute);

    // If we have an endpoint ID, select it and redirect
    const { endpointId } = activatedRoute.snapshot.params;
    if (endpointId) {
      goToAppWall(this.store, endpointId);
      this.redirected = true;
      return;
    }

    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints.map(endpoint => endpoint.guid)),
    );
    this.canCreateApplication = CfCurrentUserPermissions.APPLICATION_CREATE;

    this.haveConnectedCf$ = cloudFoundryService.connectedCFEndpoints$.pipe(
      map(endpoints => !!endpoints && endpoints.length > 0)
    );

    this.duplicateEndpointCount$ = cloudFoundryService.connectedCFEndpoints$.pipe(
      map((endpoints: EndpointModel[]) => ApplicationWallComponent.countDuplicateUrlEndpoints(endpoints)),
    );
  }

  async ngOnInit(): Promise<void> {
    if (this.redirected) {
      return;
    }
    // Resolve connected CF guids once, then initialize the signal config.
    const connected = await firstValueFrom(
      this.cloudFoundryService.connectedCFEndpoints$.pipe(
        filter(endpoints => !!endpoints),
        take(1),
      ),
    );
    const cnsiGuids = (connected ?? []).map(ep => ep.guid);
    this.appsConfig.initialize(cnsiGuids);
    const dropdowns: SignalListDropdown[] = [
      {
        label: 'Cloud Foundry',
        options: this.appsConfig.cnsiOptions,
        selected: this.appsConfig.selectedCnsi,
      },
      {
        label: 'Organization',
        options: this.appsConfig.orgOptions,
        selected: this.appsConfig.selectedOrg,
      },
      {
        label: 'Space',
        options: this.appsConfig.spaceOptions,
        selected: this.appsConfig.selectedSpace,
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
    const renderCfOrgSpace = (app: StApp): string => {
      const cf = this.appsConfig.endpointNames().get(app.cnsiGuid) ?? app.cnsiGuid;
      const orgName = app.orgGuid ? (this.appsConfig.orgNames().get(app.orgGuid) ?? app.orgGuid) : '—';
      const spaceName = app.spaceGuid ? (this.appsConfig.spaceNames().get(app.spaceGuid) ?? app.spaceGuid) : '—';
      return `${cf} / ${orgName} / ${spaceName}`;
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
          render: (app: StApp) => String(app.instances ?? 0),
          widthHint: '6rem',
        },
        {
          header: 'Memory', key: 'memory', sortField: 'memory',
          render: (app: StApp) => ApplicationWallComponent.formatMb(app.memory),
          widthHint: '7rem',
        },
        {
          header: 'Disk', key: 'diskQuota', sortField: 'diskQuota',
          render: (app: StApp) => ApplicationWallComponent.formatMb(app.diskQuota),
          widthHint: '7rem',
        },
        {
          header: 'CF/Org/Space',
          render: renderCfOrgSpace,
          widthHint: '18rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (app: StApp) => ApplicationWallComponent.formatDate(app.createdAt),
          widthHint: '12rem',
        },
      ],
      getRowKey: (app: StApp) => `${app.cnsiGuid}:${app.guid}`,
      emptyMessage: 'There are no applications',
      loadingMessage: 'Loading applications…',
      nameFilter: this.appsConfig.nameFilter,
      filterDropdowns: dropdowns,
      onRefresh: () => this.appsConfig.refresh(),
      cardAccentColor: stateColor,
      viewMode: this.appsConfig.viewMode,
      sort: this.appsConfig.sort,
    });
    if (cnsiGuids.length > 0) {
      void this.appsConfig.loadAll();
    }
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

  // Returns the number of endpoints that share a URL with at least one other
  // connected CF, or null when all URLs are distinct. An endpoint is in a
  // "duplicate group" if its URL appears 2+ times among connected CFs.
  static countDuplicateUrlEndpoints(endpoints: EndpointModel[]): number | null {
    if (!endpoints || endpoints.length < 2) { return null; }
    const urlCounts = new Map<string, number>();
    for (const ep of endpoints) {
      const url = getFullEndpointApiUrl(ep);
      urlCounts.set(url, (urlCounts.get(url) ?? 0) + 1);
    }
    let dupCount = 0;
    for (const count of urlCounts.values()) {
      if (count > 1) { dupCount += count; }
    }
    return dupCount > 0 ? dupCount : null;
  }
}
